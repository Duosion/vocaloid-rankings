module.exports = (db, exists) => {
    if (exists) { return }

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
        song_id INTEGER NOT NULL,
        artist_id INTEGER NOT NULL,
        artist_category INTEGER NOT NULL,
        PRIMARY KEY (song_id, artist_id, artist_category),
        FOREIGN KEY (song_id) REFERENCES songs (id),
        FOREIGN KEY (artist_id) REFERENCES artists (id))`).run()

    // create songs names table
    db.prepare(`CREATE TABLE IF NOT EXISTS songs_names (
        song_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_type INTEGER NOT NULL,
        PRIMARY KEY (song_id, name_type),
        FOREIGN KEY (song_id) REFERENCES songs (id))`).run()

    // create songs video ids table
    db.prepare(`CREATE TABLE IF NOT EXISTS songs_video_ids (
        song_id INTEGER NOT NULL,
        video_id TEXT NOT NULL,
        video_type INTEGER NOT NULL,
        PRIMARY KEY (song_id, video_id),
        FOREIGN KEY (song_id) REFERENCES songs (id))`).run()

    // create artists table
    db.prepare(`CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY NOT NULL,
        artist_type INTEGER NOT NULL,
        publish_date TEXT NOT NULL,
        addition_date TEXT NOT NULL)`).run()

    // create artists names table
    db.prepare(`CREATE TABLE IF NOT EXISTS artists_names (
        artist_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_type INTEGER NOT NULL,
        PRIMARY KEY (artist_id, name_type),
        FOREIGN KEY (artist_id) REFERENCES artists (id))`).run()

    // create artists thumbnails table
    db.prepare(`CREATE TABLE IF NOT EXISTS artists_thumbnails (
        thumbnail_type INTEGER NOT NULL,
        url TEXT NOT NULL,
        artist_id INTEGER NOT NULL,
        average_color TEXT NOT NULL,
        PRIMARY KEY (artist_id, thumbnail_type),
        FOREIGN KEY (artist_id) REFERENCES artists (id))`).run()

    // create views totals table
    db.prepare(`CREATE TABLE IF NOT EXISTS views_totals (
        song_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        total INTEGER NOT NULL,
        PRIMARY KEY (song_id, timestamp),
        FOREIGN KEY (song_id) REFERENCES songs (id))`).run()

    // create views breakdown table
    db.prepare(`CREATE TABLE IF NOT EXISTS views_breakdowns (
        song_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        views INTEGER NOT NULL,
        video_id TEXT NOT NULL,
        view_type INTEGER NOT NULL,
        PRIMARY KEY (song_id, timestamp, video_id),
        FOREIGN KEY (song_id) REFERENCES songs (id))`).run()

    // create views metadata table
    db.prepare(`CREATE TABLE IF NOT EXISTS views_metadata (
        timestamp TEXT PRIMARY KEY NOT NULL,
        updated TEXT NOT NULL)`).run()

}