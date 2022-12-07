const sqlite3 = require("better-sqlite3")
const fs = require("fs");

// variables
const dataDirectory = "./data/"

const dbPragmas = {
    "default": "journal_mode = WAL"
}

const databases = [
    {
        name: "songsViews",
        path: "songsViews.db",
        pragma: "default", // the pragma for this database
        verbose: null, // is this database verbose?
        init: (db, exists) => require("./dbInitializers/songsViews.js")(db, exists)
    },
    {
        name: "analytics",
        path: "analytics.db",
        pragma: "default",
        init: (db, exists) => require("./dbInitializers/analytics.js")(db, exists)
    },
    {
        name: "authentication",
        path: "authentication.db",
        pragma: "default",
        init: (db, exists) => require("./dbInitializers/auth.js")(db, exists)
    },
]
const loadedDatabases = {} // databases that have been laoded

// copy files from .toClone to data directory
{
    const copyDirectory = "./.toClone/"
    if (fs.existsSync(copyDirectory)) {
        // copy files to data
        fs.readdirSync(copyDirectory).forEach(file => {
            //fs.rmSync(dataDirectory + file)
            fs.copyFileSync(copyDirectory + file, dataDirectory + file)
            fs.rmSync(copyDirectory + file)
            console.log("copied",file)
        })
    }
}

// initialize databases
for (const [_, dbInfo] of databases.entries()) {
    const fullPath = dataDirectory + dbInfo.path
    // see if the db already exists
    const dbExists = fs.existsSync(fullPath)
    // create new db
    db = new sqlite3(fullPath, { verbose: dbInfo.verbose })
    // set pragma
    const pragma = dbInfo.pragma
    if (pragma) { db.pragma(dbPragmas[pragma] || pragma); }
    // call init function
    const init = dbInfo.init
    if (init) {
        try {
            init(db, dbExists)
        } catch (error) {
            console.log(`Initalization failed for module ${dbInfo.name}. Error: ${error}`)
        }
    }
    // add to loaded databases page
    loadedDatabases[dbInfo.name] = db
}
// export loaded databases
exports.databases = loadedDatabases