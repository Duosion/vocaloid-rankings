const JSON = require("JSON");
const { generateTimestamp } = require("../server_scripts/shared")
const databases = require("./init.js").databases

function generateISOTimestamp() {
    return new Date().toISOString()
}

// songs
const songsProxy = {
    songExists: (songId) => {
        return new Promise(async (resolve, reject) => {
            try {
              
                const db = databases.songsViews

                resolve(db.prepare('SELECT songId FROM songsData WHERE songId = ?').get(songId) ? true : false)
                
            } catch (error) {
               reject(error) 
            }
        }) 
    },

    getSongs: () => {
        return new Promise(async (resolve, reject) => {
            try {
              
                const db = databases.songsViews

                resolve(db.prepare('SELECT * FROM songsData').all())
                
            } catch (error) {
               reject(error) 
            }
        })
    },
    getSong: (songID) => {

        return new Promise( async (resolve, reject) => {
            try {

                const db = databases.songsViews

                const songData = db.prepare('SELECT * FROM songsData WHERE songId = ?').get(songID)

                if (!songData) { resolve(null); return } 

                const jsonParse = JSON.parse
                
                // parse json
                songData.singers = jsonParse(songData.singers)
                songData.producers = jsonParse(songData.producers)
                songData.names = jsonParse(songData.names)
                songData.videoIds = jsonParse(songData.videoIds)

                resolve(songData)

            } catch(error) {
                reject(error)
            }
        })

    },

    // addition
    insertSongs: (songsToAdd) => {
        return new Promise( async (resolve, reject) => {
            try {
                
                const promises = []

                for (let [songID, songData] of Object.entries(songsToAdd)) {
                    promises.push(songsProxy.addSong(songID, songData))
                }

                await Promise.allSettled(promises);

                resolve(true)

            } catch(error) {
                reject(error)
            }
        })
    },
    insertSong: (songID, songData) => {
        
        return new Promise( async (resolve, reject) => {
            try {

                const db = databases.songsViews

                const stringify = JSON.stringify

                resolve(db.prepare('REPLACE INTO songsData (songId, songType, singers, producers, publishDate, additionDate, thumbnail, names, videoIds, fandomURL)'
                + ' VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(songID,
                    songData.songType,
                    stringify(songData.singers),
                    stringify(songData.producers),
                    songData.publishDate,
                    songData.additionDate,
                    songData.thumbnail,
                    stringify(songData.names),
                    stringify(songData.videoIds),
                    songData.fandomURL))
                    
            } catch(err) {
                reject(err)
            }
        })
        
    }
}
exports.songs = songsProxy

// views
const viewsProxy = {
    // views

    createViewsTable: (timestamp) => {
        return new Promise( async (resolve, reject) => {
            try {
                const db = databases.songsViews

                if (await viewsProxy.timestampExists(timestamp)) { reject(`Row with timestamp ${timestamp} already exists.`); return }

                // create the new table
                db.prepare(`CREATE TABLE IF NOT EXISTS '${timestamp}' (songId TEXT PRIMARY KEY NOT NULL, total INTEGER NOT NULL, breakdown JSON NOT NULL, `
                + "FOREIGN KEY (songId) REFERENCES songsData (songId))").run()
            
                resolve(true)
            } catch (error) {
                reject(error)
            }
        })
    },
    createMetadata: (timestamp, isoString = new Date().toISOString()) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.songsViews

                if (await viewsProxy.timestampExists(timestamp)) { reject(`Row with timestamp ${timestamp} already exists.`); return }

                db.prepare('INSERT INTO viewsMetadata (timestamp, updated) VALUES (?, ?)').run(timestamp, isoString)

                // resolve
                resolve(true)
            } catch (error) {
                reject(error)
            }
        })
    },
    createViewsTableIfNotExists: (timestamp) => {
        // creates a views table if it doesn't exist
        return new Promise(async (resolve, reject) => {
            try {
                if (await viewsProxy.timestampExists(timestamp)) { resolve(true); return }
                
                await viewsProxy.createViewsTable(timestamp)

                resolve(true)
            } catch (error) {
                reject(error)
            }
        })
    },
    insertViewData: (timestamp, viewData) => {
        return new Promise( async (resolve, reject) => {
            try {
                const db = databases.songsViews

                // make sure that the table exists
                viewsProxy.createViewsTableIfNotExists(timestamp)

                resolve(db.prepare(`REPLACE INTO '${timestamp}' (songId, total, breakdown) VALUES(?, ?, ?)`).run(
                    viewData.songId,
                    viewData.total,
                    JSON.stringify(viewData.breakdown)
                    ))
            } catch (error) {
                reject(error)
            }
        })
    },
    getViewData: (timestamp, songId) => {
        return new Promise( async (resolve, reject) => {
            try {

                const db = databases.songsViews

                // make sure that the table exists
                viewsProxy.createViewsTableIfNotExists(timestamp)

                // get data
                const viewData = db.prepare(`SELECT * FROM '${timestamp}' WHERE songId = ?`).get(songId)

                if (!viewData) { reject(null); return }

                // parse json
                viewData.breakdown = JSON.parse(viewData.breakdown)

                resolve(viewData)

            } catch (error) {
                reject(error)
            }
        })
    },
    getViewsData: (timestamp) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.songsViews

                // make sure that the table exists
                viewsProxy.createViewsTableIfNotExists(timestamp)

                // get data
                resolve(db.prepare(`SELECT * FROM '${timestamp}'`).all())
            } catch (error) {
                reject(error)
            }
        })
    },

    getViewsLength: (timestamp) => {
        return new Promise(async (resolve, reject) => {
            try {
                
                const db = databases.songsViews

                const result = db.prepare(`SELECT COUNT(*) AS length FROM '${timestamp}'`).get()

                resolve(result.length)

            } catch (error) {
                reject(error)
            }
        })
    },

    filterRankings: (filterParams, timestamp, timePeriodTimestamp) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.songsViews

                const filterViewType = filterParams.ViewType
                const orderDirection = filterParams.Direction == "Descending" ? "DESC" : "ASC"
                var orderByQuery     = ""
                // build order
                {
                    switch(filterParams.SortBy) {
                        case "Views": {
                            orderByQuery = `ORDER BY total ${orderDirection}`
                            break;
                        }
                        case "UploadDate": {
                            orderByQuery = `ORDER BY datetime(publishDate) ${orderDirection}`
                            break;
                        }
                        case "AdditionDate": {
                            orderByQuery = `ORDER BY datetime(additionDate) ${orderDirection}`
                            break;
                        }
                    }
                }

                var totalSelectQuery = "total"

                // build where expressions
                var whereExpression = ""
                var fromExpression = ""
                {
                    const whereExpressions = []
                    const fromExpressions = []

                    // time period filter
                    {
                        const filteringByTimePeriod = timePeriodTimestamp != null

                        switch(filterViewType) {
                            case "Combined": {
                                if (filteringByTimePeriod) {
                                    totalSelectQuery = `'${timestamp}'.total - '${timePeriodTimestamp}'.total AS total`
                                }
                                break;
                            }
                            default: {
                                const extractTimestampBreakdownString = `json_extract('${timestamp}'.breakdown, '$.${filterViewType}')`
                                if (filteringByTimePeriod) {
                                    totalSelectQuery = `${extractTimestampBreakdownString} - json_extract('${timePeriodTimestamp}'.breakdown, '$.${filterViewType}') AS total` 
                                } else {
                                    totalSelectQuery = `${extractTimestampBreakdownString} AS total`
                                }
                                whereExpressions.push(`${extractTimestampBreakdownString} != 'null'`)
                            }
                        }
                    }

                    const filterPublishYear = filterParams.PublishYear
                    if (filterPublishYear != "") {
                        whereExpressions.push(`publishDate LIKE '${filterPublishYear}%'`)
                    }
                    const filterSongType = filterParams.SongType
                    if (filterSongType != "All") {
                        whereExpressions.push(`songType = '${filterSongType}'`)
                    }

                    const filterProducer = filterParams.Producer
                    if (filterProducer != "") {
                        fromExpressions.push(`json_each(songsData.producers) AS jsonProducers`)
                        whereExpressions.push(`jsonProducers.value = '${filterProducer}'`)
                    }

                    const filterSinger = filterParams.Singer
                    if (filterSinger != "") {
                        fromExpressions.push(`json_each(songsData.singers) AS jsonSingers`)
                        whereExpressions.push(`jsonSingers.value = '${filterSinger}'`)
                    }

                    const length = whereExpressions.length
                    if (length >= 1) {
                        whereExpression = "WHERE "

                        for (const [n, expression] of whereExpressions.entries()) {
                            const separator = n == (length - 1) ? "" : " AND "
                            whereExpression += expression + separator
                        }
                        
                    }

                    // build from expressions
                    for (const [_, from] of fromExpressions.entries()) {
                        fromExpression += ", " + from
                    }
                }

                const query = `SELECT '${timestamp}'.songId, songType, publishDate, additionDate, thumbnail, IFNULL(json_extract(names, '$.${filterParams.Language}'), json_extract(names, '$.Original')) AS name, ${totalSelectQuery} 
                FROM '${timestamp}'${fromExpression}
                INNER JOIN songsData on songsData.songId = '${timestamp}'.songId${timePeriodTimestamp != null ? ` INNER JOIN '${timePeriodTimestamp}' ON '${timePeriodTimestamp}'.songId = '${timestamp}'.songId` : ""}
                ${whereExpression} ${orderByQuery}
                LIMIT ${filterParams.MaxEntries} OFFSET ${filterParams.StartAt}`

                resolve(db.prepare(query).all())
            } catch (error) {
                reject(error)
            }
        })
    },

    // metadata

    getMetadataTimestamp: (timestamp, offset) => {
        offset = offset || 0
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.songsViews

                resolve(db.prepare(`SELECT id, timestamp
                FROM viewsMetadata
                WHERE id = MAX(1, (IFNULL((SELECT id FROM viewsMetadata WHERE timestamp = '${timestamp}'), (SELECT COUNT(*) FROM viewsMetadata)) - ${offset}) )`).get())
            } catch (error) {
                reject(error)
            }      
        })
    },

    getMetadata: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.songsViews

                resolve(db.prepare('SELECT * FROM viewsMetadata').all())
            } catch (error) {
                reject(error)
            }
        })
    },

    // timestamps
    timestampExists: (timestamp) => {
        return new Promise( async(resolve, reject) => {
            try {
                const db = databases.songsViews

                const exists = db.prepare("SELECT id FROM viewsMetadata WHERE timestamp = ?").get(timestamp)

                resolve(exists ? true : false)
            } catch (error) {
                reject(error)
            }
        })

    },
}
exports.views = viewsProxy

// analytics
const analyticsProxy = {
    eventExists: (eventName) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.analytics

                const exists = db.prepare("SELECT eventName FROM analytics WHERE eventName = ?").get(eventName)

                resolve(exists ? true : false) // resolve
            } catch (error) {
                reject(error)
            }
        })
    },
    createEventTable: (eventName, params) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.analytics

                // build columns from params
                    var columns = ", uid STRING NOT NULL, timestamp STRING NOT NULL, date STRING NOT NULL" // UID column is always there
                    for (const [key, _] of Object.entries(params)) {
                        columns+= `, ${key} STRING NOT NULL`
                    }

                // create the new table
                db.prepare(`CREATE TABLE IF NOT EXISTS ${eventName} (id INTEGER PRIMARY KEY AUTOINCREMENT${columns})`).run()
                
                // add to analytics table
                console.log("query: INSERT INTO analytics (eventName) VALUES (?)",eventName)
                db.prepare(`INSERT INTO analytics (eventName) VALUES (?)`).run(eventName)
                
                resolve() // resolve
            } catch (error) {
                reject(error)
            }
        })
    },
    insertEvent: (eventName, uid, params) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.analytics

                if (!(await analyticsProxy.eventExists(eventName))) {
                    await analyticsProxy.createEventTable(eventName, params)
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
exports.analytics = analyticsProxy

// authentication
const authProxy = {
    getUser: (username) => {
        return new Promise( async (resolve, reject) => {
            try {
                const db = databases.authentication

                // get data
                const userData = db.prepare('SELECT * FROM users WHERE username = ?').get(username)

                if (!userData) { reject(null); return }

                resolve(userData)
            } catch (error) {
                reject(error)
            }
        })
    },
    getSession: (sessionId) => {
        return new Promise( async (resolve, reject) => {
            try {
                const db = databases.authentication
                // get data
                const sessionData = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId)
                if (!sessionData) { reject(null); return }

                resolve(sessionData)
            } catch (error) {
                reject(error)
            }
        })
    },
    insertUser: (username, passwordHash, authLevel) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.authentication

                // insert user
                db.prepare('INSERT INTO users (username, passwordHash, created, authLevel) VALUES (?, ?, ?, ?)').run(
                    username,
                    passwordHash,
                    generateISOTimestamp(),
                    authLevel || 1 // default auth level is 1 (User)
                )

                resolve()
            } catch (error) {
                reject(error)
            }
        })
    },
    insertSession: (sessionId, username, expires) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.authentication

                // insert session
                db.prepare('INSERT INTO sessions (id, username, created, expires) VALUES (?, ?, ?, ?)').run(
                    sessionId,
                    username,
                    generateISOTimestamp(),
                    expires
                )

                resolve()
            } catch (error) {
                reject(error)
            }
        })
    },
    sessionExists: (sessionId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = databases.authentication

                const exists = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId)

                resolve(exists ? true : false) // resolve
            } catch (error) {
                reject(error)
            }
        })
    }
}
exports.authentication = authProxy