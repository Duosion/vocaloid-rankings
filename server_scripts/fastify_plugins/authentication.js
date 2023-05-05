// handles sessions, logging in, and authentication
const workingDirectory = process.cwd()
// imports
const fp = require("fastify-plugin")
const crypto = require("crypto-js")
const bcrypt = require("bcrypt");
const AccessLevel = require("../../db/enums/AccessLevel");
const bcryptSaltRounds = 10;
const { accountsDataProxy } = require(workingDirectory + "/db")

const sessionLifetime = 7 * 24 * 60 * 60 // in seconds, how long a login session lasts.

// functions
const generateSessionId = () => {
    return crypto.lib.WordArray.random(32).toString()
}

// fastify functions
const postLogin = async (request, reply) => {
    // logs in the user
    const body = request.body
    const query = request.query

    const referer = query.referer

    const username = body["username"] || ""
    const stayLoggedIn = body['stayLoggedIn'] || ""

    const reject = (reason = "") => {
        return reply.status(302).redirect(`/login?errorMessage=${reason}&referer=${referer}`)
    }

    // check if the user is already logged in
    if (request.loggedIn) {
        // logout
        return reject("Already logged in.")
    }

    // compare query with database
    {
        const passwordPlain = body["password"] || ""
        try {
            // get userdata from database
            const userData = await accountsDataProxy.getUser(username)

            if (!(await bcrypt.compare(passwordPlain, userData.hash))) {
                throw "Invalid Password."
            }
        } catch (error) {
            return reject("Invalid username or password provided.")
        }
    }

    // create session
    {
        // generate session id until it hasn't been found in the database
        var sessionId = generateSessionId()
        while (await accountsDataProxy.sessionExists(sessionId)) {
            sessionId = generateSessionId()
        }

        // save in the database
        const dateNow = new Date()
        await accountsDataProxy.insertSession(
            sessionId,
            username,
            dateNow,
            new Date(dateNow.getTime() + (sessionLifetime * 1000)),
            stayLoggedIn == 'on' ? true : false
        )
            .catch(error => {
                reject(error.message)
            })

        // set cookie
        reply.setCookie("session", sessionId, {
            path: "/",
            signed: true,
            sameSite: true,
            ["maxAge"]: 31536000
        })
    }
    return reply.status(302).redirect(referer || '/')
}

const getLogout = async (request, reply) => {
    const query = request.query
    const sessionCookie = request.cookies["session"]
    const referer = query['referer']
    if (sessionCookie) {
        const unsignedCookie = request.unsignCookie(sessionCookie)
        // delete the session
        await accountsDataProxy.deleteSession(unsignedCookie.value || "")
            .catch(error => { reply.status(400).send(error) })
        // clear the cookie
        reply.clearCookie("session")
        // respond to the client
        if (referer) {
            reply.status(302).redirect(referer)
        } else {
            reply.status(200).send("Logged out.")
        }
    } else {
        reply.status(400).send("Not logged in.")
    }
}

const getLogin = async (request, reply) => {
    const query = request.query
    // add error message
    const errorMessage = query['errorMessage']
    if (errorMessage) {
        request.addHbParam('errorMessage', errorMessage)
    }

    request.addHbParam('referer', query.referer)
    return reply.view("pages/login.hbs", request.hbParams)
}

const getAccount = async (request, reply) => {

    request.addHbParam('canDownloadDatabase', request.accessLevel >= AccessLevel.Admin.id)

    return reply.view('pages/account.hbs', request.hbParams)
}

// plugin
const plugin = (fastify, options, done) => {

    fastify.decorateRequest('accessLevel', AccessLevel.Guest.id)
    fastify.decorateRequest('loggedIn', false)

    // add a hook in the "preParsing" phase of request handling
    fastify.addHook("preParsing", async (req, reply, _) => {
        const config = req.routeConfig

        const requiredAuthLevel = config["accessLevel"] || 0
        const redirect = config['loginRedirect'] ? true : false
        const sessionCookie = req.cookies["session"]

        var userAuthLevel = 0;

        try {
            if (sessionCookie) {
                const unsignedCookie = req.unsignCookie(sessionCookie)

                const sessionData = await accountsDataProxy.getSession(unsignedCookie.value)
                const userData = sessionData.user

                req.loggedIn = true
                req.addHbParam('loggedIn', true)

                // set last login
                const dateNow = new Date()
                userData.lastLogin = dateNow
                await accountsDataProxy.updateUser(userData)

                // renew session if applicable
                const sessionExpires = sessionData.expires
                if (dateNow >= sessionExpires) {
                    // session is expired
                    if (sessionData.stayLoggedIn) {
                        sessionData.expires = new Date(dateNow.getTime() + (sessionLifetime * 1000))
                        await accountsDataProxy.updateSession(sessionData)
                    } else {
                        reply.clearCookie('session')
                        await accountsDataProxy.deleteSession(sessionData.id)
                        throw new Error('Session Expiry')
                    }
                }

                userAuthLevel = userData.accessLevel.id
            }
        } catch (error) {
        }

        // add access level to request & handlebars parameters
        req.accessLevel = userAuthLevel
        req.addHbParam('accessLevel', userAuthLevel)

        if (!(userAuthLevel >= requiredAuthLevel)) {
            if (sessionCookie) {
                reply.clearCookie('session')
            }
            if (redirect) {
                return reply.status(302).redirect(`/login?referer=${req.url}`)
            } else {
                return reply.status(userAuthLevel > 0 ? 403 : 401).send("Not Authorized")
            }
        }

    })

    // requests
    fastify.get("/login", getLogin)
    fastify.post("/login", postLogin)

    fastify.get('/logout', getLogout)

    fastify.get('/account', {
        config: {
            accessLevel: AccessLevel.User.id,
            loginRedirect: true
        }
    }, getAccount)

    // add admin account
    if (process.env.adminUsername && process.env.adminPassword) {
        accountsDataProxy.userExists(process.env.adminUsername)
            .then(async exists => {
                if (!exists) {
                    await accountsDataProxy.insertUser(
                        process.env.adminUsername,
                        bcrypt.hashSync(process.env.adminPassword, bcryptSaltRounds),
                        AccessLevel.Admin
                    )
                    console.log("Admin account was created. Delete credentials from .env file.")
                }
            })
            .catch(error => {
                console.log("Error when creating admin account: ", error)
            })
    }

    done()
}

module.exports = fp(plugin);