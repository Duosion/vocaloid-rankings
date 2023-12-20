import { deleteSession, getSession, getUser, insertSession, insertUser, updateSession, updateUser } from '@/data/auth'
import { Session, User, UserAccessLevel } from '@/data/types'
import bcrypt from 'bcrypt'
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

const defaultSaltRounds = 10
const defaultCookieName = 'session'
const sessionLifetime = 7 * 24 * 60 * 60 // in seconds, how long a login session lasts.

export function getHash(
    plaintext: string | Buffer,
    saltRounds?: number
): Promise<string> {
    saltRounds = saltRounds == undefined ? Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '') : saltRounds
    saltRounds = isNaN(saltRounds) ? defaultSaltRounds : saltRounds

    return bcrypt.hash(plaintext, saltRounds)
}

export function getActiveSession(
    cookies: RequestCookies | ReadonlyRequestCookies,
    cookieName: string = defaultCookieName
): Promise<Session | null> {
    return new Promise(async (resolve, reject) => {
        try {
            const sessionToken = cookies.get(cookieName)
            if (!sessionToken) return resolve(null)

            const session = await getSession(sessionToken.value)
            if (!session) return resolve(null)

            const dateNow = new Date()
            if (dateNow >= session.expires) {
                // update the expiration date
                if (session.stayLoggedIn) {

                    session.expires = new Date(dateNow.getTime() + (sessionLifetime * 1000))
                    await updateSession({
                        token: session.token,
                        expires: session.expires
                    })

                } else {
                    cookies.delete(cookieName)
                    await deleteSession(session.token)
                    return resolve(null)
                }
            }

            resolve(session)
        } catch (error) {
            reject(error)
        }
    })
}

export function login(
    cookies: RequestCookies | ReadonlyRequestCookies,
    user: User,
    password: string,
    cookieName: string = defaultCookieName,
    stayLoggedIn: boolean = false
): Promise<Session> {
    return new Promise(async (resolve, reject) => {
        try {
            // ensure that the user isn't already logged in
            const loggedIn = await getActiveSession(cookies, cookieName)
            if (loggedIn) reject('Already logged in.')

            // validate password
            const validLogin = await bcrypt.compare(password, user.password)
            if (!validLogin) reject('Invalid username/password.')

            // generate session
            const dateNow = new Date()
            const session = await insertSession({
                expires: new Date(dateNow.getTime() + (sessionLifetime * 1000)),
                stayLoggedIn: stayLoggedIn,
                userId: user.id
            })

            // update user last login
            await updateUser({
                id: user.id,
                lastLogin: dateNow
            })

            // add cookie
            cookies.set(cookieName, session.token, {
                expires: session.expires.getTime(),
                sameSite: true
            })

            resolve(session)
        } catch (error) {
            throw reject(`Error when logging in: ${error}`)
        }
    })
}

export function logout(
    cookies: RequestCookies | ReadonlyRequestCookies,
    cookieName: string = defaultCookieName
): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            const session = await getActiveSession(cookies, cookieName)
            if (!session) return reject('Not logged in.')

            resolve(deleteSession(session.token))
        } catch (error) {
            reject(error)
        }
    })
}

export async function signup(
    username: string,
    password: string,
    accessLevel: UserAccessLevel
): Promise<User> {
    const dateNow = new Date()
    try {
        const hashed = await getHash(password)
        return await insertUser({
            username: username,
            password: hashed,
            created: dateNow,
            lastLogin: dateNow,
            accessLevel: accessLevel
        })
    } catch (error: any) {
        throw new Error(error)
    }
}

export function getAuthenticatedUser(
    cookies: RequestCookies | ReadonlyRequestCookies,
    cookieName: string = defaultCookieName
): Promise<User | null> {
    return new Promise(async (resolve, reject) => {
        try {
            const session = await getActiveSession(cookies, cookieName)
            if (!session) return resolve(null)

            resolve(getUser(session.userId))
        } catch (error) {
            reject(error)
        }
    })
}