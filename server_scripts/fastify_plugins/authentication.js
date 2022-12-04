// handles sessions, logging in, and authentication
const workingDirectory = process.cwd()
// imports
const fp = require("fastify-plugin")
const crypto = require("crypto-js")
const bcrypt = require("bcrypt");
const { analytics } = require("../../db");
    const bcryptSaltRounds = 10;
const { authentication } = require(workingDirectory + "/db")

const authLevels = {
    [0]: "Guest",
    [1]: "User",
    [4]: "Admin"
}

// functions
const generateSessionId = () => {
    return crypto.lib.WordArray.random(32).toString()
}

// fastify functions
const loginPost = async (request, reply) => {
    // logs in the user
    const body = request.body
    const cookies = request.cookies

    const username = body["username"]

    const reject = (reason = "") => {
        reply.status(400)
        return reply.view("pages/login.hbs", { 
            seo: request.seo,
            cookies: request.parsedCookies || {},
            errorMessage: reason
        })
    }

    // check if the user is already logged in
    if (cookies["session"]) {
        // logout
        return reject("Already logged in.")
    }

    // compare query with database
    {
        const passwordPlain = body["password"]
        try {
            // get userdata from database
            const userData = await authentication.getUser(username)

            if (!(await bcrypt.compare(passwordPlain, userData.passwordHash))) {
                throw "Invalid Password."
            }
        } catch(error) {
            return reject("Invalid username or password provided.")
        }
    }

    // create session
    {
        // generate session id until it hasn't been found in the database
        var sessionId = generateSessionId()
        while (await authentication.sessionExists(sessionId)) {
            sessionId = generateSessionId()
        }

        // save in the database
        authentication.insertSession(sessionId, username)

        // set cookie
        reply.setCookie("session", sessionId, {
            path: "/",
            signed: true,
            sameSite: true,
            ["maxAge"]: 31536000
          })
    }
    
    reply.status(200)
    reply.redirect("/")
}

const loginGet = async(request, reply) => {

    return reply.view("pages/login.hbs", { 
        seo: request.seo,
        cookies: request.parsedCookies || {},
    })

}

const createAccount = async (request, reply) => {
    authentication.insertUser(
        "admin",
        await bcrypt.hash("9FgYx14d#1Xv3lxKv7Fq0Ey$iO",bcryptSaltRounds),
        4
    )
    reply.status(200).send("Account Created")
}

// plugin
const plugin = (fastify, options, done) => {

    fastify.addHook("preParsing", async (req, reply, _) => {
        const config = req.context.config

        const requiredAuthLevel = config["authLevel"] || 0
        const sessionCookie = req.cookies["session"]

        if (requiredAuthLevel > 0) {
            // only check authentication if the required auth is "User" or higher.
            var userAuthLevel = 0;

            try {
                if (sessionCookie) {
                    const unsignedCookie = req.unsignCookie(sessionCookie)
                    const sessionData = await authentication.getSession(unsignedCookie.value)
    
                    const userData = await authentication.getUser(sessionData.username)
    
                    userAuthLevel = userData.authLevel
                }
            } catch (error) {
            }

            if (!(userAuthLevel >= requiredAuthLevel)) {
                // 404
                reply.status(404)
                reply.send("Page not found.")
                return
            }

        }

    })

    // requests
    fastify.get("/login",loginGet)
    fastify.post("/login", loginPost)
    //fastify.get("/signup",createAccount)

    done()
}

module.exports = fp(plugin);