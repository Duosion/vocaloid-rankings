const Database = require("better-sqlite3")
const { generateTimestamp } = require("../../server_scripts/shared")
const AnalyticsEvent = require("../enums/AnalyticsEvent")

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

    /**
     * Inserts an event into the database
     * 
     * @param {AnalyticsEvent} event The type of this event
     * @param {string} uid 
     * @param {Object} params 
     * @returns 
     */
    insertEvent (event, uid, params) {
        return new Promise(async (resolve, reject) => {
            try {
                this.db.prepare(`
                INSERT INTO analytics (event, uid, timestamp, data)
                VALUES (?, ?, ?, ?)`).run(
                    event.id,
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