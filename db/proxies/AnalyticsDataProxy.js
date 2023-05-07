const Database = require("better-sqlite3")
const { generateTimestamp } = require("../../server_scripts/shared")

function generateISOTimestamp() {
    return new Date().toISOString()
}

module.exports = class AnalyticsDataProxy {

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

    eventExists (eventName) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = this.db

                const exists = db.prepare(`
                SELECT ROWID AS id
                FROM events
                WHERE name = ?
                `).get(eventName)?.id

                resolve(exists) // resolve
            } catch (error) {
                reject(error)
            }
        })
    }

    createEvent (eventName) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(this.db.prepare(`
                INSERT INTO events (name)
                VALUES (?)`).run(eventName).lastInsertRowid) // resolve
            } catch (error) {
                reject(error)
            }
        })
    }

    insertEvent (eventName, uid, params) {
        return new Promise(async (resolve, reject) => {
            try {

                const existing = (await this.eventExists(eventName)) || (await this.createEvent(eventName))

                this.db.prepare(`
                INSERT INTO analytics (event_id, uid, timestamp, data)
                VALUES (?, ?, ?, ?)`).run(
                    existing,
                    uid,
                    generateISOTimestamp(),
                    JSON.stringify(params)
                )

                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

}