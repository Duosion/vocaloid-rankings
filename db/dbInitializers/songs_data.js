module.exports = (db, exists) => {

    // create songs table
    db.prepare(`CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY NOT NULL,
        publish_date TEXT NOT NULL,
        addition_date TEXT NOT NULL,
        song_type INTEGER NOT NULL,
        thumbnail TEXT NOT NULL,
        maxres_thumbnail TEXT NOT NULL,
        average_color TEXT NOT NULL,
        fandom_url TEXT)`).run()

    // create songs artists table
    db.prepare(`CREATE TABLE IF NOT EXISTS songs_artists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER NOT NULL,
        artist_id INTEGER NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs (id),
        FOREIGN KEY (artist_id) REFERENCES artists (id))`).run()

    // create songs names table
    db.prepare(`CREATE TABLE IF NOT EXISTS songs_names (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_type INTEGER NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs (id))`).run()

    // create artists table
    db.prepare(`CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY NOT NULL,
        artist_type INTEGER NOT NULL,
        publish_date TEXT NOT NULL,
        addition_date TEXT NOT NULL)`).run()

    // create artists names table
    db.prepare(`CREATE TABLE IF NOT EXISTS artists_names (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artist_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_type INTEGER NOT NULL,
        FOREIGN KEY (artist_id) REFERENCES artists (id))`).run()

    // create artists thumbnails table
    db.prepare(`CREATE TABLE IF NOT EXISTS artists_thumbnails (
        id INTEGER PRIMARY KEY NOT NULL,
        thumbnail_type INTEGER NOT NULL,
        url TEXT NOT NULL,
        artist_id INTEGER NOT NULL,
        average_color TEXT NOT NULL,
        FOREIGN KEY (artist_id) REFERENCES artists (id))`).run()

    // create views totals table
    db.prepare(`CREATE TABLE IF NOT EXISTS views_totals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        total INTEGER NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs (id))`).run()

    // create views breakdown table
    db.prepare(`CREATE TABLE IF NOT EXISTS views_breakdowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        views INTEGER NOT NULL,
        video_id TEXT NOT NULL,
        view_type INTEGER NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs (id))`).run()

    // create views metadata table
    db.prepare(`CREATE TABLE IF NOT EXISTS views_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        total INTEGER NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs (id))`).run()

}