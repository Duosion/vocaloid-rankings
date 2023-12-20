import { randomBytes, randomUUID } from "crypto";
import getDatabase, { Databases } from ".";
import { RawSession, RawUser, Session, User, UserAccessLevel } from "./types";

const db = getDatabase(Databases.AUTH)

// READERS

// Get User
function parseRawUser(
    rawUser: RawUser
): User {
    return {
        id: rawUser.id,
        username: rawUser.username,
        password: rawUser.password,
        created: new Date(rawUser.created),
        lastLogin: new Date(rawUser.last_login),
        accessLevel: rawUser.access_level as UserAccessLevel
    }
}

function getUserSync(
    id: string
): User | null {

    const rawUser = db.prepare(`
    SELECT id, username, password, created, last_login, access_level
    FROM users
    WHERE id = ?
    `).get(id) as RawUser | null

    return rawUser ? parseRawUser(rawUser) : null
}

export function getUser(
    id: string
): Promise<User | null> {
    return new Promise((resolve, reject) => {
        try {
            resolve(getUserSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

function getUserFromUsernameSync(
    username: string
): User | null {
    const rawUser = db.prepare(`
    SELECT id, username, password, created, last_login, access_level
    FROM users
    WHERE username = ?
    `).get(username) as RawUser | null

    return rawUser ? parseRawUser(rawUser) : null
}

export function getUserFromUsername(
    username: string
): Promise<User | null> {
    return new Promise((resolve, reject) => {
        try {
            resolve(getUserFromUsernameSync(username))
        } catch (error) {
            reject(error)
        }
    })
}

// Get Session

function parseRawSession(
    rawSession: RawSession
): Session {
    return {
        token: rawSession.token,
        expires: new Date(rawSession.expires),
        userId: rawSession.user_id,
        stayLoggedIn: rawSession.stay_logged_in === 1 ? true : false
    }
}

function getSessionSync(
    token: string
): Session | null {
    const rawSession = db.prepare(`
    SELECT token, expires, user_id, stay_logged_in
    FROM sessions
    WHERE token = ?
    `).get(token) as RawSession | null

    return rawSession ? parseRawSession(rawSession) : null
}

export function getSession(
    token: string
): Promise<Session | null> {
    return new Promise((resolve, reject) => {
        try {
            resolve(getSessionSync(token))
        } catch (error) {
            reject(error)
        }
    })
}

// Get User Sesssions

function getUserSessionsSync(
    userId: string
): Session[] {
    const rawSessions = db.prepare(`
    SELECT token, expires, user_id
    FROM sessions
    WHERE user_id = ?
    `).all(userId) as RawSession[]

    return rawSessions.map(rawSession => parseRawSession(rawSession))
}

export function getUserSession(
    userId: string
): Promise<Session[]> {
    return new Promise((resolve, reject) => {
        try {
            resolve(getUserSessionsSync(userId))
        } catch (error) {
            reject(error)
        }
    })
}

// CREATORS

// Insert User
function insertUserSync(
    user: Omit<User, "id">
): User {
    const id = randomUUID()

    const username = user.username
    const password = user.password
    const created = user.created
    const lastLogin = user.lastLogin
    const accessLevel = user.accessLevel

    db.prepare(`
    INSERT INTO users (id, username, password, created, last_login, access_level)
    VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        id,
        username,
        password,
        created.toISOString(),
        lastLogin.toISOString(),
        accessLevel
    )

    return {
        id: id,
        username: username,
        password: password,
        created: created,
        lastLogin: lastLogin,
        accessLevel: accessLevel
    }
}

export function insertUser(
    user: Omit<User, "id">
): Promise<User> {
    return new Promise((resolve, reject) => {
        try {
            resolve(insertUserSync(user))
        } catch (error) {
            reject(error)
        }
    })
}

// Insert Session
function insertSessionSync(
    session: Omit<Session, 'token'>
): Session {
    const token = randomBytes(18).toString('base64')

    const expires = session.expires
    const userId = session.userId
    const stayLoggedIn = session.stayLoggedIn

    db.prepare(`
    INSERT INTO sessions (token, expires, user_id, stay_logged_in)
    VALUES (?, ?, ?, ?)
    `).run(
        token,
        expires.toISOString(),
        userId,
        stayLoggedIn ? 1 : 0
    )

    return {
        token: token,
        expires: expires,
        userId: userId,
        stayLoggedIn: stayLoggedIn
    }
}

export function insertSession(
    session: Omit<Session, 'token'>
): Promise<Session> {
    return new Promise((resolve, reject) => {
        try {
            resolve(insertSessionSync(session))
        } catch (error) {
            reject(error)
        }
    })
}

// UPDATE

// update user
function updateUserSync(
    user: Partial<User> & Pick<User, "id">
) {
    const userId = user.id
    const existing = getUserSync(userId)

    if (!existing) throw new Error(`Attempt to update a user that doesn't exist. Id: (${userId})`)

    const username = user.username || existing.username
    const password = user.password || existing.password
    const created = user.created || existing.created
    const lastLogin = user.lastLogin || existing.lastLogin
    const accessLevel = user.accessLevel === undefined ? existing.accessLevel : user.accessLevel

    db.prepare(`
    UPDATE users
    SET username = ?,
        password = ?,
        created = ?,
        last_login = ?,
        access_level = ?
    WHERE id = ?
    `).run(
        username,
        password,
        created.toISOString(),
        lastLogin.toISOString(),
        accessLevel,
        userId
    )
}

export function updateUser(
    user: Partial<User> & Pick<User, "id">
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            resolve(updateUserSync(user))
        } catch (error) {
            reject(error)
        }
    })
}

// update session
function updateSessionSync(
    session: Partial<Session> & Pick<Session, 'token'>
) {
    const sessionToken = session.token

    const fields: Record<string, string> = {
        expires: 'expires',
        userId: 'user_id',
        stayLoggedIn: 'stay_logged_in'
    }

    const sets: string[] = []
    const values: any[] = []
    for (const key in session) {
        const value = session[key as keyof typeof session]
        const field = fields[key]
        if (field && value !== undefined) {
            sets.push(`${field} = ?`)
            if (value instanceof Date) {
                values.push(value.toISOString())
            } else {
                switch (typeof (value)) {
                    case 'boolean':
                        values.push(value ? 1 : 0)
                    default:
                        values.push(value)
                }
            }
        }
    }

    if (sets.length > 0) db.prepare(`
            UPDATE sessions
            SET ${sets.join(', ')}
            WHERE token = ?
            `).run([...values, sessionToken])
}

export function updateSession(
    session: Partial<Session> & Pick<Session, 'token'>
): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            resolve(updateSessionSync(session))
        } catch (error) {
            reject(error)
        }
    })
}

// DELETE

// Delete User
function deleteUserSync(
    id: string
) {
    db.prepare(`
    DELETE FROM users
    WHERE id = ?
    `).run(id)
}

export function deleteUser(
    id: string
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            resolve(deleteUserSync(id))
        } catch (error) {
            reject(error)
        }
    })
}

// Delete Session
function deleteSessionSync(
    token: string
) {
    db.prepare(`
    DELETE FROM sessions
    WHERE token = ?
    `).run(token)
}

export function deleteSession(
    token: string
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            resolve(deleteSessionSync(token))
        } catch (error) {
            reject(error)
        }
    })
}