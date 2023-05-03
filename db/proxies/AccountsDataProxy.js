const AccessLevel = require("../enums/AccessLevel")
const Database = require("better-sqlite3")
const User = require("../dataClasses/User")
const Session = require("../dataClasses/Session")

module.exports = class AccountsDataProxy {
    
    /**
     * Creates a new MainDataProxy
     * 
     * @param {Database.Database} db The db for this proxy to use.
     */
    constructor(
        db
    ) {
        this.db = db
    }
    
    // private functions

    /**
     * Builds a user object from data acquired from the database.
     * 
     * @param {Object} userData The data to build the user from.
     * @returns {User}
     */
    #buildUserSync(
        userData
    ) {
        return new User(
            userData.username,
            userData.hash,
            new Date(userData.created),
            new Date(userData.last_login),
            AccessLevel.fromId(userData.access_level) || AccessLevel.Guest
        )
    }

    /**
     * Builds a session object from data acquired from the database.
     * 
     * @param {Object} sessionData The data to build the session from.
     * @returns {Session}
     */
    #buildSessionSync(
        sessionData
    ) {
        return new Session(
            sessionData.id,
            this.#getUserSync(sessionData.username),
            new Date(sessionData.created),
            new Date(sessionData.expires),
            sessionData.stay_logged_in == 1 ? true : false
        )
    }

    /**
     * Gets a user based on their username.
     * 
     * @param {string} username The username of the user to get.
     * @returns {User}
     */
    #getUserSync(
        username
    ) {
        const data = this.db.prepare(`
        SELECT username, hash, created, last_login, access_level
        FROM users
        WHERE username = ?
        `).get(username)

        if (!data) {
            throw new Error(`User with the username "${username}" does not exist.`)
        }

        return this.#buildUserSync(data)
    }

    /**
     * Gets a session based on its sessionId
     * 
     * @param {string} sessionId 
     * @returns {Session}
     */
    #getSessionSync(
        sessionId
    ) {
        const sessionData = this.db.prepare(`
        SELECT id, username, created, expires, stay_logged_in
        FROM sessions
        WHERE id = ?`).get(sessionId)

        if (!sessionData) {
            throw new Error(`Session with the id "${sessionId}" does not exist.`)
        }

        return this.#buildSessionSync(sessionData)
    }

    // public getters

    /**
     * Gets a user from their username.
     * Returns a promise that resolves with the requested user.
     * 
     * @param {string} username 
     * @returns {Promise<User>}
     */
    getUser(
        username
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getUserSync(username))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Checks if a user exists from the username.
     * Returns a promise that resolves with whether the user exists or not.
     * 
     * @param {string} username 
     * @returns {Promise<Boolean>}
     */
    userExists(
        username
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare(`
                SELECT username
                FROM users
                WHERE username = ?`).get(username) ? true : false) 
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Gets a session from its session id.
     * Returns a promise that resolves with the requested session.
     * 
     * @param {*} sessionId 
     * @returns 
     */
    getSession(
        sessionId
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getSessionSync(sessionId))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Checks if a user exists from its session id.
     * Returns a promise that resolves with whether the session exists or not.
     * 
     * @param {string} sessionId 
     * @returns {Promise<boolean>}
     */
    sessionExists(
        sessionId
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare(`
                SELECT id
                FROM sessions
                WHERE id = ?`).get(sessionId) ? true : false)
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Gets all of the sessions that a user has based on the user's username.
     * Returns a promise that resolves with a list of all sessions associated with the provided username.
     * 
     * @param {string} username 
     * @returns {Promise<Session[]>}
     */
    getUserSessions(
        username
    ) {
        return new Promise((resolve, reject) => {
            try {
                const ids = this.db.prepare(`
                SELECT id
                FROM sessions
                WHERE username = ?
                `).all(username)

                const sessions = []
                ids.forEach(id => {
                    sessions.push(this.#getSessionSync(id.id))
                })

                resolve(sessions)
            } catch (error) {
                reject(error)
            }
        })
    }

    // public deleters

    /**
     * Deletes a user based on their username.
     * Returns a promise that resolves when the user is deleted.
     * 
     * @param {string} username 
     * @returns {Promise<void>}
     */
    deleteUser(
        username
    ){
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`
                DELETE FROM users
                WHERE username = ?
                `).run(username)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Deletes a session based on its id.
     * Returns a promise that resolves when the session is deleted.
     * 
     * @param {string} sessionId 
     * @returns {Promise<void>}
     */
    deleteSession(
        sessionId
    ) {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`
                DELETE FROM sessions
                WHERE id = ?
                `).run(sessionId)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    // public inserters
    
    /**
     * Inserts a new user into the database.
     * 
     * @param {string} username The user's username.
     * @param {string} hash The password hash of the user.
     * @param {AccessLevel} accessLevel The user's access level.
     * @returns {Promise<User>} A promise that resolves with the newly created user.
     */
    insertUser(
        username,
        hash,
        accessLevel
    ) {
        return new Promise((resolve, reject) => {
            try {
                const dateNow = new Date().toISOString()
                this.db.prepare(`
                INSERT INTO users (username, hash, created, last_login, access_level)
                VALUES (?, ?, ?, ?, ?)
                `).run(
                    username,
                    hash,
                    dateNow,
                    dateNow,
                    accessLevel.id
                )

                resolve(new User('','',new Date(),new Date(), 0))//this.#getUserSync(username))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Updates an existing user.
     * 
     * @param {User} user The modified user.
     * @returns {Promise<void>} A promise that resolves once the user is updated.
     */
    updateUser(
        user
    ) {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`
                UPDATE users
                SET hash = ?,
                    created = ?,
                    last_login = ?,
                    access_level = ?
                WHERE username = ?
                `).run(
                    user.hash,
                    user.created.toISOString(),
                    user.lastLogin.toISOString(),
                    user.accessLevel.id,
                    user.username
                )
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Inserts a new session into the database
     * 
     * @param {string} id The id of the new session.
     * @param {string} username The username of the user that this session belongs to.
     * @param {Date} created When this session was created.
     * @param {Date} expires When this session expires.
     * @param {boolean} stayLoggedIn Does this session renew itself automatically?
     * @returns {Promise<Session>} A promise that resolves with the newly created session.
     */
    insertSession(
        id,
        username,
        created = new Date(),
        expires = new Date(),
        stayLoggedIn = false
    ) {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`
                INSERT INTO sessions (id, username, created, expires, stay_logged_in)
                VALUES (?, ?, ?, ?, ?)
                `).run(
                    id,
                    username,
                    created.toISOString(),
                    expires.toISOString(),
                    stayLoggedIn ? 1 : 0
                )
                resolve(this.#getSessionSync(id))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Updates an existing session
     * 
     * @param {Session} session The updated session.
     * @returns {Promise<void>} A promise that resolves when the session is updated.
     */
    updateSession(
        session
    ) {
        return new Promise((resolve, reject) => {
            try {
                this.db.prepare(`
                UPDATE sessions
                SET username = ?,
                    created = ?,
                    expires = ?,
                    stay_logged_in = ?
                WHERE id = ?
                `).run(
                    session.user.username,
                    session.created.toISOString(),
                    session.expires.toISOString(),
                    session.stayLoggedIn ? 1 : 0,
                    session.id
                )
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }
}