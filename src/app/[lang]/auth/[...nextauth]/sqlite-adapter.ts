import getDatabase, { Databases } from "@/data";
import { RawAccount, RawSession, RawUser, RawVerificationToken } from "@/data/types";
import { randomUUID } from "crypto";
import { Awaitable } from "next-auth";
import { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from "next-auth/adapters";

const db = getDatabase(Databases.AUTH)

export function SqliteAdapter(): Adapter {

    const getUser = (id: string): Promise<AdapterUser | null> => {
        return new Promise((resolve, reject) => {
            try {
                const userData = db.prepare(`
                SELECT id, email, email_verified
                FROM users
                WHERE id = ?
                `).get(id) as RawUser | null

                if (!userData) return resolve(null)

                resolve({
                    id: userData.id,
                    email: userData.email,
                    emailVerified: userData.email_verified ? new Date(userData.email_verified) : null
                } as AdapterUser)

            } catch (error) {
                reject(error)
            }
        })
    }

    const getSessionAndUser = (
        sessionToken: string
    ): Promise<{ session: AdapterSession; user: AdapterUser; } | null> => {
        return new Promise(async (resolve, reject) => {
            try {

                const sessionData = db.prepare(`
                SELECT expires, session_token, user_id
                FROM sessions
                WHERE session_token = ?
                `).get(sessionToken) as RawSession | null

                if (!sessionData) return resolve(null)

                const userId = sessionData.user_id
                const user = await getUser(userId)

                if (!user) return resolve(null)

                resolve({
                    session: {
                        expires: new Date(sessionData.expires),
                        sessionToken: sessionToken,
                        userId: userId
                    },
                    user: user
                })

            } catch (error) {
                reject(error)
            }
        })
    }

    return {

        getUser: getUser,
    
        getUserByAccount: (
            providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">
        ): Promise<AdapterUser | null> => {
            return new Promise((resolve, reject) => {
                try {
                    const accountData = db.prepare(`
                    SELECT user_id, provider_account_id
                    FROM accounts
                    WHERE provider_account_id = :id OR user_id = :id
                    `).get({ id: providerAccountId }) as RawAccount | null
    
                    if (!accountData) return resolve(null)
    
                    resolve(getUser(accountData.user_id))
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        createUser: (
            user: Omit<AdapterUser, "id">
        ): Promise<AdapterUser> => {
            return new Promise((resolve, reject) => {
                try {
    
                    const id = randomUUID()
                    db.prepare(`
                    INSERT INTO users (id, email, email_verified)
                    VALUES (?, ?, ?)
                    `).run(
                        id,
                        user.email,
                        user.emailVerified
                    )
    
                    resolve({
                        id: id,
                        email: user.email,
                        emailVerified: user.emailVerified
                    })
    
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        updateUser: (
            user: Partial<AdapterUser> & Pick<AdapterUser, "id">
        ): Promise<AdapterUser> => {
            return new Promise(async (resolve, reject) => {
                try {
                    const id = user.id
                    const existing = await getUser(id)
                    if (!existing) return reject(`No existing user with id ${id}`)
    
                    const email = user.email || existing.email
                    const emailVerified = user.emailVerified || existing.emailVerified
    
                    db.prepare(`
                    UPDATE users
                    SET email = ?,
                        email_verified = ?
                    WHERE id = ?
                    `).run(
                        email,
                        emailVerified?.toISOString(),
                        id
                    )
    
                    resolve({
                        id: id,
                        email: email,
                        emailVerified: emailVerified
                    })
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        linkAccount: (
            account: AdapterAccount
        ): Promise<AdapterAccount | null | undefined> => {
            return new Promise((resolve, reject) => {
                try {
    
                    db.prepare(`
                    INSERT INTO accounts (user_id, type, provider, provider_account_id, expires_at)
                    VALUES (?, ?, ?, ?, ?)
                    `).run(
                        account.userId,
                        account.type,
                        account.provider,
                        account.providerAccountId,
                        account.expires_at
                    )
                    resolve(account)
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        deleteUser: (
            userId: string
        ): Promise<void> | Awaitable<AdapterUser | null | undefined> => {
            return new Promise<void>((resolve, reject) => {
                try {
                    db.prepare(`
                    DELETE FROM users
                    WHERE id = ?
                    `).run(userId)
    
                    resolve()
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        createSession: (
            session: {
                sessionToken: string;
                userId: string;
                expires: Date;
            }
        ): Promise<AdapterSession> => {
            return new Promise((resolve, reject) => {
                try {
    
                    db.prepare(`
                    INSERT INTO sessions (expires, session_token, user_id)
                    VALUES (?, ?, ?)
                    `).run(
                        session.expires.toISOString(),
                        session.sessionToken,
                        session.userId
                    )
    
                    resolve({
                        sessionToken: session.sessionToken,
                        userId: session.userId,
                        expires: session.expires
                    } as AdapterSession)
    
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        getSessionAndUser: getSessionAndUser,
    
        updateSession: (
            session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">
        ): Promise<AdapterSession | null | undefined> => {
            return new Promise(async (resolve, reject) => {
                try {
                    const sessionToken = session.sessionToken
                    const existing = await getSessionAndUser(sessionToken)
                    if (!existing) return resolve(null)
                    const existingSession = existing.session
    
                    const expires = session.expires || existingSession.expires
                    const userId = session.userId || existingSession.userId
    
                    db.prepare(`
                    UPDATE sessions
                    SET expires = ?,
                        user_id = ?
                    WHERE session_token = ?
                    `).run(
                        expires,
                        userId,
                        sessionToken
                    )
    
                    resolve({
                        expires: expires,
                        userId: userId,
                        sessionToken: sessionToken
                    })
    
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        deleteSession: (
            sessionToken: string
        ): Promise<void> | Awaitable<AdapterSession | null | undefined> => {
            return new Promise<void>((resolve, reject) => {
                try {
    
                    db.prepare(`
                    DELETE FROM sessions
                    WHERE session_token = ?
                    `).run(sessionToken)
    
                    resolve()
    
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        getUserByEmail: (
            email: string
        ): Promise<AdapterUser | null> => {
            return new Promise((resolve, reject) => {
                try {
                    const userData = db.prepare(`
                    SELECT id, email, email_verified
                    FROM users
                    WHERE email = ?
                    `).get(email) as RawUser | null
    
                    if (!userData) return resolve(null)
    
                    resolve({
                        id: userData.id,
                        email: userData.email,
                        emailVerified: userData.email_verified ? new Date(userData.email_verified) : null
                    } as AdapterUser)
                } catch (error) {
                    reject(error)
                }
            })
        },
        
        createVerificationToken: (
            verificationToken: VerificationToken
        ): Promise<VerificationToken | null | undefined> => {
            return new Promise((resolve, reject) => {
                try {
                    
                    db.prepare(`
                    INSERT INTO tokens (token, identifier, expires)
                    VALUES (?, ?, ?)
                    `).run(verificationToken.token, verificationToken.identifier, verificationToken.expires.toISOString())
    
                    resolve(verificationToken)
    
                } catch (error) {
                    reject(error)
                }
            })
        },
    
        useVerificationToken: (
            params: { 
                identifier: string; 
                token: string; 
            }
        ): Promise<VerificationToken | null> => {
            return new Promise((resolve, reject) => {
                try {
                    const tokenData = db.prepare(`
                    SELECT token, identifier, expires
                    FROM tokens
                    WHERE token = ? AND identifier = ?
                    `).get(params.token, params.identifier) as RawVerificationToken
    
                    if (!tokenData) return resolve(null)
    
                    // remove from table
                    db.prepare(`
                    DELETE FROM tokens
                    WHERE token = ? AND identifier = ?
                    `).run(params.token, params.identifier)
    
                    resolve({
                        token: params.token,
                        identifier: params.identifier,
                        expires: new Date(tokenData.expires)
                    })
                } catch (error) {
                    reject(error)
                }
            })
        }
    }
}