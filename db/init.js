const sqlite3 = require("better-sqlite3")
const fs = require("fs");
const Artist = require("./dataClasses/Artist");
const ArtistThumbnail = require("./dataClasses/ArtistThumbnail");
const Song = require("./dataClasses/song");
const ArtistThumbnailType = require("./enums/ArtistThumbnailType");
const ArtistType = require("./enums/ArtistType");
const NameType = require("./enums/NameType");
const SongType = require("./enums/SongType");
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
        init: (db, exists) => require("./dbInitializers/songsViews.js")(db, exists)
    },
    {
        name: "songsData",
        path: "songs_data.db",
        pragma: "default",
        init: (db, exists) => require("./dbInitializers/songs_data.js")(db, exists)
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

// tests
const songsDataProxy = new SongsDataProxy(loadedDatabases.songsData)

/*songsDataProxy.insertSong(new Song(
    20,
    "2010-05-18T00:00:00Z",
    "2022-08-28T07:20:35.212Z",
    SongType.Vocaloid,
    "https://img.youtube.com/vi/ZB75e7vzX0I/hqdefault.jpg",
    "https://img.youtube.com/vi/ZB75e7vzX0I/hqdefault.jpg",
    "#ffffff",
    "/wiki/%E3%83%AF%E3%83%BC%E3%83%AB%E3%82%BA%E3%82%A8%E3%83%B3%E3%83%89%E3%83%BB%E3%83%80%E3%83%B3%E3%82%B9%E3%83%9B%E3%83%BC%E3%83%AB_(World%27s_End_Dancehall)",
    [
        new Artist(
            0,
            ArtistType.Singer,
            "2010-05-18T00:00:00Z",
            "2022-08-28T07:20:35.212Z",
            {
                [NameType.English.id]: "Hatsune Miku",
                [NameType.Romaji.id]: "Hatsune Mikuu"
            },
            {
                [ArtistThumbnailType.Medium.id]: new ArtistThumbnail(
                    ArtistThumbnailType.Medium,
                    "https://img.youtube.com/vi/ZB75e7vzX0I/hqdefault.jpg",
                    "#ffffff"
                )
            }
        ),
        new Artist(
            1,
            ArtistType.Singer,
            "2010-05-18T00:00:00Z",
            "2022-08-28T07:20:35.212Z",
            {
                [NameType.English.id]: "Gumi",
                [NameType.Romaji.id]: "GUMI"
            },
            {
                [ArtistThumbnailType.Medium.id]: new ArtistThumbnail(
                    ArtistThumbnailType.Medium,
                    "https://img.youtube.com/vi/ZB75e7vzX0I/hqdefault.jpg",
                    "#ffffff"
                )
            }
        )
    ],
    {
        [NameType.Japanese.id]: "ワールズエンド・ダンスホール",
        [NameType.English.id]: "World's End Dancehall",
        [NameType.Original.id]: "ワールズエンド・ダンスホール"
    }
))*/

setTimeout(() => {
    console.time("new get song")
    songsDataProxy.getSong(20).then((result) => {
        console.timeEnd("new get song")
        console.log("song 20:",result)
    }).catch((err) => {
        console.log("error:", err)
    });
},2000)

// export loaded databases
exports.databases = loadedDatabases