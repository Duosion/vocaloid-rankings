const sqlite3 = require("better-sqlite3")
const fs = require("fs");
const SongsDataProxy = require("./proxies/SongsDataProxy");

// variables
const dataDirectory = process.cwd() + "/data/"
if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory)
}

const dbPragmas = {
    "default": "journal_mode = WAL"
}

const databases = [
    {
        name: "songsViews",
        path: "songsViews.db",
        pragma: "default", // the pragma for this database
        verbose: null, // is this database verbose?
        proxy: null,
        init: (db, exists) => require("./dbInitializers/songsViews.js")(db, exists)
    },
    {
        name: "songsData",
        path: "songs_data.db",
        pragma: "default",
        /*verbose: (output) => {
            console.log(output)
        },*/
        init: (db, exists) => require("./dbInitializers/songs_data.js")(db, exists),
        extensions: [process.cwd() + "/db/extensions/spellfix.dll"]
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
const proxies = {}

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

    // load extensions
    const extensions = dbInfo.extensions
    if (extensions) {
        for (const [_, path] of extensions.entries()) {
            db.loadExtension(path)
        }
    }

    // call init function
    const init = dbInfo.init
    if (init) {
        try {
            init(db, dbExists)
        } catch (error) {
            console.log(`Initalization failed for module ${dbInfo.name}. Error: ${error}`)
        }
    }
    const name = dbInfo.name
    // add to loaded databases page
    loadedDatabases[name] = db
}

// export loaded databases
exports.databases = loadedDatabases