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

                const exists = db.prepare("SELECT eventName FROM analytics WHERE eventName = ?").get(eventName)

                resolve(exists ? true : false) // resolve
            } catch (error) {
                reject(error)
            }
        })
    }

    createEventTable (eventName, params) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = this.db

                // build columns from params
                    var columns = ", uid STRING NOT NULL, timestamp STRING NOT NULL, date STRING NOT NULL" // UID column is always there
                    for (const [key, _] of Object.entries(params)) {
                        columns+= `, ${key} STRING NOT NULL`
                    }

                // create the new table
                db.prepare(`CREATE TABLE IF NOT EXISTS ${eventName} (id INTEGER PRIMARY KEY AUTOINCREMENT${columns})`).run()
                
                // add to analytics table
                db.prepare(`INSERT INTO analytics (eventName) VALUES (?)`).run(eventName)
                
                resolve() // resolve
            } catch (error) {
                reject(error)
            }
        })
    }

    insertEvent (eventName, uid, params) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = this.db

                if (!(await this.eventExists(eventName))) {
                    await this.createEventTable(eventName, params)
                }

                var columnKeys = `uid, timestamp, date`
                var columnValues = `'${uid}', '${generateISOTimestamp()}', '${generateTimestamp().Name}'`

                for (const [key, value] of Object.entries(params)) {
                    columnKeys+= `, ${key}`
                    columnValues+= `, '${value}'`
                }

                // create the new row
                db.prepare(`INSERT INTO ${eventName} (${columnKeys}) VALUES (${columnValues})`).run()

                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

}