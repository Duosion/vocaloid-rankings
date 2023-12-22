import { Database } from "better-sqlite3"
import sqlite3 from 'better-sqlite3'
import initSongsData from "./initializers/songsData"
import initAuthDatabase from "./initializers/auth"
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "fs"

const rootDirectory = process.cwd()
const dataDirectory = rootDirectory + "/src/data/database/"
if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory)
}

const loadedDatabases: {
    [key in Databases]?: Database
} = {}

export const enum Databases {
    SONGS_DATA,
    AUTH
}

const enum Pragma {
    DEFAULT
}

const dbPragmas = {
    [Pragma.DEFAULT]: "journal_mode = WAL"
}

const databaseMetadata = {
    [Databases.SONGS_DATA]: {
        path: 'songs_data.db',
        pragma: Pragma.DEFAULT,
        init: initSongsData,
        extensions: [rootDirectory + '/src/data/extensions/spellfix']
    },
    [Databases.AUTH]: {
        path: 'auth.db',
        pragma: Pragma.DEFAULT,
        init: initAuthDatabase,
        extensions: []
    }
}

// copy files from .toClone to data directory
{
    const copyDirectory = rootDirectory + "/src/data/toClone/"
    if (existsSync(copyDirectory)) {
        // delete database file
        /*console.log("Remove old data directory.")
        fs.rmSync(dataDirectory, { recursive: true, force: true })
        console.log("Make new data directory.")
        fs.mkdirSync(dataDirectory)*/
        // copy files to data
        readdirSync(copyDirectory).forEach(file => {
            //fs.rmSync(dataDirectory + file)
            copyFileSync(copyDirectory + file, dataDirectory + file)
            rmSync(copyDirectory + file)
            console.log("copied",file)
        })
    }
}

export default function getDatabase(
    database: Databases
): Database {
    const isLoaded = loadedDatabases[database]
    if (isLoaded) {
        return isLoaded
    }

    // load the database
    const metadata = databaseMetadata[database]

    const fullPath = dataDirectory + metadata.path
    // see if the db already exists
    const dbExists = existsSync(fullPath)
    // create new db
    const db = new sqlite3(fullPath)
    // set pragma
    const pragma = metadata.pragma
    if (pragma) { db.pragma(dbPragmas[pragma] || pragma); }

    // load extensions
    const extensions = metadata.extensions
    if (extensions) {
        extensions.forEach(path => {
            db.loadExtension(path)
        })
    }

    // call init function
    const init = metadata.init
    if (init) {
        try {
            init(db, dbExists)
        } catch (error) {
            console.log(`Initalization failed for module ${metadata.path}. Error: ${error}`)
        }
    }

    // add to loaded databases
    loadedDatabases[database] = db

    return db
}