module.exports = (db, exists) => {
    try {
        // create metadata table
        db.prepare('CREATE TABLE IF NOT EXISTS viewsMetadata (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, updated TEXT NOT NULL)').run()
        
        // create songs table
        db.prepare('CREATE TABLE IF NOT EXISTS songsData (songId TEXT PRIMARY KEY NOT NULL, songType TEXT NOT NULL, singers JSON NOT NULL, producers JSON NOT NULL, publishDate TEXT NOT NULL, additionDate TEXT NOT NULL, thumbnail TEXT NOT NULL, names JSON NOT NULL, videoIds JSON NOT NULL, fandomURL TEXT)').run()
    
        // create artists table
        db.prepare('CREATE TABLE IF NOT EXISTS artistData (artistId TEXT PRIMARY KEY NOT NULL, artistType TEXT NOT NULL, publishDate TEXT NOT NULL, additionDate TEXT NOT NULL, names JSON NOT NULL, thumbnails JSON NOT NULL)').run()

    } catch(err) {
        console.log(err)
    }
}