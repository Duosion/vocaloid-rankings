const sqlite3 = require("better-sqlite3")
const fs = require("fs");
const SongsDataProxy = require("./proxies/SongsDataProxy");
const AccountsDataProxy = require("./proxies/AccountsDataProxy");
const AnalyticsDataProxy = require("./proxies/AnalyticsDataProxy");

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
        name: "songsData",
        path: "songs_data.db",
        pragma: "default",
        /*verbose: (output) => {
            console.log(output)
        },*/
        init: (db, exists) => require("./initializers/songs_data.js")(db, exists),
        extensions: [process.cwd() + "/db/extensions/spellfix.dll"]
    },
    {
        name: "analytics",
        path: "analytics.db",
        pragma: "default",
        init: (db, exists) => require("./initializers/analytics.js")(db, exists)
    },
    {
        name: "accounts",
        path: "accounts.db",
        pragma: "default",
        init: (db, exists) => require("./initializers/accounts.js")(db, exists)
    },
]
const loadedDatabases = {} // databases that have been laoded

// copy files from .toClone to data directory
{
    const copyDirectory = "./.toClone/"
    if (fs.existsSync(copyDirectory)) {
        // delete database file
        /*console.log("Remove old data directory.")
        fs.rmSync(dataDirectory, { recursive: true, force: true })
        console.log("Make new data directory.")
        fs.mkdirSync(dataDirectory)*/
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
exports.songsDataProxy = new SongsDataProxy(loadedDatabases.songsData)
exports.accountsDataProxy = new AccountsDataProxy(loadedDatabases.accounts)
exports.analyticsDataProxy = new AnalyticsDataProxy(loadedDatabases.analytics)