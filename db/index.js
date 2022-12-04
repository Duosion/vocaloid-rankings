const dataDirectory = "./data"
// import modules
const fs = require("fs");
const JSON = require("JSON");
const sqlite3 = require("sqlite3").verbose();
const sqlite = require("sqlite");
const { generateTimestamp } = require("../server_scripts/shared")

// functions
function generateISOTimestamp() {
    return new Date().toISOString()
}

// database directiories
if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory)
}

// set up data
    // viewsDb
    const viewsDbDirectory = dataDirectory + "views.db"
    const viewsDbFileExists = fs.existsSync(viewsDbDirectory)

    const viewsDb = sqlite.open({
        filename: viewsDbDirectory,
        driver: sqlite3.Database
    }).then( async db => {

        if (viewsDbFileExists) { return db }

        try {

            await db.run(
                "CREATE TABLE metadata (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, updated TEXT NOT NULL)"
            );

        } catch(err) {
            console.log(err)
        }

        return db

    })

    // songs db
    const songsDbDirectory = dataDirectory + "songs.db"
    const songsDbFileExists = fs.existsSync(songsDbDirectory)

    const songsDb = sqlite.open({
        filename: songsDbDirectory,
        driver: sqlite3.Database
    }).then( async db => {
        if (songsDbFileExists) { return db }

        try {

            await db.run(
                "CREATE TABLE songs (songId TEXT PRIMARY KEY NOT NULL, songType TEXT NOT NULL, singers TEXT NOT NULL, producers TEXT NOT NULL, publishDate TEXT NOT NULL, additionDate TEXT NOT NULL, thumbnail TEXT NOT NULL, names TEXT NOT NULL, videoIds TEXT NOT NULL, fandomURL TEXT)"
            );

        } catch(err) {
            console.log(err)
        }

        return db

    })

    // songsViewsDb
    const songsViewsDbDirectory = dataDirectory + "songsViews.db"
    const songsViewsDbExists = fs.existsSync(songsViewsDbDirectory)

    const songsViewsDb = sqlite.open({
        filename: songsViewsDbDirectory,
        driver: sqlite3.Database
    }).then(async db => {
        // initialize the database
        if (songsViewsDbExists) { return db }

        try {

            // create metadata table
            await db.run(
                "CREATE TABLE viewsMetadata (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, updated TEXT NOT NULL)"
            )

            // create songs table
            await db.run(
                "CREATE TABLE songsData (songId TEXT PRIMARY KEY NOT NULL, songType TEXT NOT NULL, singers JSON NOT NULL, producers JSON NOT NULL, publishDate TEXT NOT NULL, additionDate TEXT NOT NULL, thumbnail TEXT NOT NULL, names JSON NOT NULL, videoIds JSON NOT NULL, fandomURL TEXT)"
            );

            Promise.all([songsDb, viewsDb, songsViewsDb]).then(async result => {
                const songsDatabase      = result[0]
                const viewsDatabase      = result[1]
                const songsViewsDatabase = result[2]
        
                // add songs to songsViews
                console.log("Merging Songs Data")
                const toMergeSongs = await songsDatabase.all("SELECT * FROM songs")
                for (const [_, songData] of toMergeSongs.entries()) {
                    await songsViewsDatabase.run(`REPLACE INTO songsData (songId, songType, singers, producers, publishDate, additionDate, thumbnail, names, videoIds, fandomURL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[
                        songData.songId,
                        songData.songType,
                        songData.singers,
                        songData.producers,
                        songData.publishDate,
                        songData.additionDate,
                        songData.thumbnail,
                        songData.names,
                        songData.videoIds,
                        songData.fandomURL
                    ])
                }
        
                // merge views & metadata
                console.log("Merging Views Data")
                const toMergeMetadata = await viewsDatabase.all("SELECT * FROM metadata")
                const metadataCount = toMergeMetadata.length
        
                for (const [n, metadata] of toMergeMetadata.entries()) {
                    const timestamp = metadata.timestamp
                    console.log(`${timestamp} ${n}/${metadataCount}`)
                    // add metadata to new metadata table
                    await songsViewsDatabase.run(`REPLACE INTO viewsMetadata (id, timestamp, updated) VALUES (?, ?, ?)`, [
                        metadata.id,
                        timestamp,
                        metadata.updated
                    ])
        
                    // merge views
                    const toMergeViewsData = await viewsDatabase.all(`SELECT * FROM '${timestamp}'`)
                    // create new table
                    {
        
                        // create the new table
                        await songsViewsDatabase.run(
                            `CREATE TABLE IF NOT EXISTS '${timestamp}' (songId TEXT PRIMARY KEY NOT NULL, total INTEGER NOT NULL, breakdown JSON NOT NULL, `
                            + "FOREIGN KEY (songId) REFERENCES songs (songId))",
                        )
                    }
        
                    for (const [_, viewsData] of toMergeViewsData.entries()) {
                        await songsViewsDatabase.run(`REPLACE INTO '${timestamp}' (songId, total, breakdown) VALUES (?, ?, ?)`, [
                            viewsData.songId,
                            viewsData.total,
                            viewsData.breakdown
                        ])
                    }
        
                }
                
                console.log("Databases Merged")
            })

        } catch(err) {
            console.log(err)
        }

        return db
    })

    // analytics db
    const analyticsDbDirectory = dataDirectory + "analytics.db"
    const analyticsDbFileExists = fs.existsSync(analyticsDbDirectory)

    const analyticsDb = sqlite.open({
        filename: analyticsDbDirectory,
        driver: sqlite3.Database
    }).then( async db => {
        if (analyticsDbFileExists) { return db }

        try {

            await db.run(
                "CREATE TABLE analytics (eventName TEXT PRIMARY KEY NOT NULL)"
            )

        } catch(err) {
            console.log(err)
        }

        return db
    })

    // authentication db
    const authDbDirectory = dataDirectory + "authentication.db"
    const authDbFileExists = fs.existsSync(authDbDirectory)

    const authDb = sqlite.open({
        filename: authDbDirectory,
        driver: sqlite3.Database
    }).then( async db => {
        if (authDbFileExists) { return db }

        try {
            // create accounts table
            await db.run(
                "CREATE TABLE users (username STRING PRIMARY KEY NOT NULL UNIQUE, passwordHash STRING NOT NULL, created STRING NOT NULL, authLevel INTEGER NOT NULL)"
            )

            //create sessions table
            await db.run(
                "CREATE TABLE sessions (id STRING PRIMARY KEY NOT NULL, username STRING NOT NULL, created STRING NOT NULL, expires STRING)"
            )
        } catch(err) {
            console.log(err)
        }

        return db
    })

// functions

//mergeSongsViews()

// exports
exports.databases = {

    views: viewsDb,
    songs: songsDb,
    analytics: analyticsDb

}

// songs
const songsProxy = {
    songExists: (songId) => {
        return new Promise(async (resolve, reject) => {
            try {
              
                const db = await songsViewsDb

                resolve((await db.get(
                    "SELECT songId FROM songsData WHERE songId = ?",
                    songId
                )) ? true : false)
                
            } catch (error) {
               reject(error) 
            }
        }) 
    },

    getSongs: () => {
        return new Promise(async (resolve, reject) => {
            try {
              
                const db = await songsViewsDb

                resolve(await db.all(
                    "SELECT * FROM songsData"
                ))
                
            } catch (error) {
               reject(error) 
            }
        })
    },
    getSong: (songID) => {

        return new Promise( async (resolve, reject) => {
            try {

                const db = await songsViewsDb

                const songData = await db.get(
                    "SELECT * FROM songsData WHERE songId = ?",
                    songID
                )

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

                const db = await songsViewsDb

                // make sure that the song doesn't already exist
                /*const exists = await db.get(
                    "SELECT songId FROM songs WHERE songId = ?",
                    songID
                )
                if (exists) { reject(`Song with ID ${songID} already exists.`); return }
                */
                const stringify = JSON.stringify
                // add to table
                

                resolve(await db.run(
                    "REPLACE INTO songsData (songId, songType, singers, producers, publishDate, additionDate, thumbnail, names, videoIds, fandomURL)"
                    + " VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        songID,
                        songData.songType,
                        stringify(songData.singers),
                        stringify(songData.producers),
                        songData.publishDate,
                        songData.additionDate,
                        songData.thumbnail,
                        stringify(songData.names),
                        stringify(songData.videoIds),
                        songData.fandomURL
                    ]
                ))

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
                
                const db = await songsViewsDb

                if (await viewsProxy.timestampExists(timestamp)) { reject(`Row with timestamp ${timestamp} already exists.`); return }
            
                // create the new table
                await db.run(
                    `CREATE TABLE IF NOT EXISTS '${timestamp}' (songId TEXT PRIMARY KEY NOT NULL, total INTEGER NOT NULL, breakdown JSON NOT NULL, `
                    + "FOREIGN KEY (songId) REFERENCES songsData (songId))",
                )

                resolve(true)

            } catch (error) {
                reject(error)
            }
        })
    },
    createMetadata: (timestamp, isoString) => {
        return new Promise(async (resolve, reject) => {
            try {

                const db = await songsViewsDb

                if (await viewsProxy.timestampExists(timestamp)) { reject(`Row with timestamp ${timestamp} already exists.`); return }

                // create the new row
                await db.run("INSERT INTO viewsMetadata (timestamp, updated) VALUES (?, ?)", [
                    timestamp,
                    isoString || new Date().toISOString()
                ])

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
                
                const db = await songsViewsDb

                // make sure that the table exists
                viewsProxy.createViewsTableIfNotExists(timestamp)

                resolve(await db.run(
                    `REPLACE INTO '${timestamp}' (songId, total, breakdown) VALUES(?, ?, ?)`,
                    [
                        viewData.songId,
                        viewData.total,
                        JSON.stringify(viewData.breakdown),
                    ]
                ))

            } catch (error) {
                reject(error)
            }
        })
    },
    getViewData: (timestamp, songId) => {
        return new Promise( async (resolve, reject) => {
            try {

                const db = await songsViewsDb

                // make sure that the table exists
                viewsProxy.createViewsTableIfNotExists(timestamp)

                // get data
                const viewData = await db.get(
                    `SELECT * FROM '${timestamp}' WHERE songId = ?`,
                    songId
                )
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
                const db = await songsViewsDb

                // make sure that the table exists
                viewsProxy.createViewsTableIfNotExists(timestamp)

                // get data
                resolve(db.all(
                    `SELECT * FROM '${timestamp}'`
                ))
            } catch (error) {
                reject(error)
            }
        })
    },

    /*
        const rankingsFilterQueryTemplate = {
    
            MaxEntries: 50, // the maximum # of entries to return [x]
            StartAt: 0, // the maximum # of entries to return [x]
            
            Date: "", []
            DaysOffset: 0, []

            ViewType: "Combined", [x]

            Producer: "", [x]
            Singer: "", [x]
            SongType: "All", [x]

            TimePeriod: "AllTime",
            Direction: "Descending", [x]
            SortBy: "Views", []

            Language: "Original", [x]

            PublishYear: "", [x]

        }
    */

    getViewsLength: (timestamp) => {
        return new Promise(async (resolve, reject) => {
            try {
                
                const db = await songsViewsDb

                const result = await db.get(
                    `SELECT COUNT(*) AS length FROM '${timestamp}'`
                )

                resolve(result.length)

            } catch (error) {
                reject(error)
            }
        })
    },

    filterRankings: (filterParams, timestamp, timePeriodTimestamp) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await songsViewsDb

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

                const query = `SELECT '${timestamp}'.songId, songType, publishDate, additionDate, thumbnail, json_extract(names, '$.${filterParams.Language}') AS name, videoIds, fandomURL, ${totalSelectQuery}, '${timestamp}'.breakdown 
                FROM '${timestamp}'${fromExpression}
                INNER JOIN songsData on songsData.songId = '${timestamp}'.songId${timePeriodTimestamp != null ? ` INNER JOIN '${timePeriodTimestamp}' ON '${timePeriodTimestamp}'.songId = '${timestamp}'.songId` : ""}
                ${whereExpression} ${orderByQuery}
                LIMIT ${filterParams.MaxEntries} OFFSET ${filterParams.StartAt}`

                resolve(await db.all(
                    query
                ))

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
                const db = await songsViewsDb

                resolve(await db.get(
                    `SELECT id, timestamp
                    FROM viewsMetadata
                    WHERE id = MAX(1, (IFNULL((SELECT id FROM viewsMetadata WHERE timestamp = '${timestamp}'), (SELECT COUNT(*) FROM viewsMetadata)) - ${offset}) )`
                ))
            } catch (error) {
                reject(error)
            }      
        })
    },

    getMetadata: () => {
        return new Promise(async (resolve, reject) => {
            try {

                const db = await songsViewsDb

                resolve(await db.all(
                    "SELECT * FROM viewsMetadata"
                ))
                
            } catch (error) {
                reject(error)
            }
        })
    },

    // timestamps
    timestampExists: (timestamp) => {
        return new Promise( async(resolve, reject) => {
            try {
                
                const db = await songsViewsDb

                const exists = await db.get(
                    "SELECT id FROM viewsMetadata WHERE timestamp = ?",
                    timestamp
                )

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
                const db = await analyticsDb

                const exists = await db.get(
                    "SELECT eventName FROM analytics WHERE eventName = ?",
                    eventName
                )
                
                resolve(exists ? true : false) // resolve
            } catch (error) {
                reject(error)
            }
        })
    },
    createEventTable: (eventName, params) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await analyticsDb

                // build columns from params
                    var columns = ", uid STRING NOT NULL, timestamp STRING NOT NULL, date STRING NOT NULL" // UID column is always there
                    for (const [key, _] of Object.entries(params)) {
                        columns+= `, ${key} STRING NOT NULL`
                    }

                // create the new table
                await db.run(
                    `CREATE TABLE IF NOT EXISTS ${eventName} (id INTEGER PRIMARY KEY AUTOINCREMENT${columns})`
                )
                
                // add to analytics table
                await db.run(
                    `INSERT INTO analytics (eventName) VALUES (?)`,
                    eventName
                )
                
                resolve() // resolve
            } catch (error) {
                reject(error)
            }
        })
    },
    insertEvent: (eventName, uid, params) => {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await analyticsDb

                if (!(await analyticsProxy.eventExists(eventName))) {
                    await analyticsProxy.createEventTable(eventName, params)
                }

                var columnKeys = `uid, timestamp, date`
                var columnValues = `"${uid}", "${generateISOTimestamp()}", "${generateTimestamp().Name}"`

                for (const [key, value] of Object.entries(params)) {
                    columnKeys+= `, ${key}`
                    columnValues+= `, "${value}"`
                }

                // create the new row
                await db.run(
                    `INSERT INTO ${eventName} (${columnKeys}) VALUES (${columnValues})`
                )

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
                const db = await authDb

                // get data
                const userData = await db.get(
                    `SELECT * FROM users WHERE username = ?`,
                    username
                )
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
                const db = await authDb

                // get data
                const sessionData = await db.get(
                    `SELECT * FROM sessions WHERE id = ?`,
                    sessionId
                )
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
                const db = await authDb

                // insert user
                await db.run(
                    'INSERT INTO users (username, passwordHash, created, authLevel) VALUES (?, ?, ?, ?)',
                    username,
                    passwordHash,
                    generateISOTimestamp(),
                    authLevel || 1, // default auth level is 1 (User)
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
                const db = await authDb

                // insert user
                await db.run(
                    'INSERT INTO sessions (id, username, created, expires) VALUES (?, ?, ?, ?)',
                    sessionId,
                    username,
                    generateISOTimestamp(),
                    expires,
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
                const db = await authDb

                const exists = await db.get(
                    "SELECT id FROM sessions WHERE id = ?",
                    sessionId
                )

                resolve(exists ? true : false) // resolve
            } catch (error) {
                reject(error)
            }
        })
    }
}
exports.authentication = authProxy