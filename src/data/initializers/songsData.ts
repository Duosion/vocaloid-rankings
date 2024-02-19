import { Database } from "better-sqlite3";

export default function init(
    database: Database,
    exists: Boolean
) {
    //if (exists) { return }

    // create songs table
    database.prepare(`CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY NOT NULL,
        publish_date TEXT NOT NULL,
        addition_date TEXT NOT NULL,
        song_type INTEGER NOT NULL,
        thumbnail TEXT NOT NULL,
        maxres_thumbnail TEXT NOT NULL,
        thumbnail_type INTEGER NOT NULL,
        average_color TEXT NOT NULL,
        dark_color TEXT NOT NULL,
        light_color TEXT NOT NULL,
        fandom_url TEXT,
        last_updated TEXT NOT NULL,
        last_refreshed TEXT,
        dormant INTEGER NOT NULL)`).run()

    // create songs artists table
    database.prepare(`CREATE TABLE IF NOT EXISTS songs_artists (
        song_id INTEGER NOT NULL,
        artist_id INTEGER NOT NULL,
        artist_category INTEGER NOT NULL,
        PRIMARY KEY (song_id, artist_id, artist_category),
        FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE,
        FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
    )`).run()
    database.prepare(`CREATE INDEX IF NOT EXISTS idx_songs_artists_artist_id_song_id
        ON songs_artists (artist_id, song_id);`).run()

    // create songs names table
    database.prepare(`CREATE TABLE IF NOT EXISTS songs_names (
        song_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_type INTEGER NOT NULL,
        PRIMARY KEY (song_id, name_type),
        FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE)`).run()

    // create songs video ids table
    database.prepare(`CREATE TABLE IF NOT EXISTS songs_video_ids (
        song_id INTEGER NOT NULL,
        video_id TEXT NOT NULL,
        video_type INTEGER NOT NULL,
        PRIMARY KEY (song_id, video_id),
        FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE)`).run()

    // create artists table
    database.prepare(`CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY NOT NULL,
        artist_type INTEGER NOT NULL,
        publish_date TEXT NOT NULL,
        addition_date TEXT NOT NULL,
        base_artist_id INTEGER,
        average_color TEXT NOT NULL,
        dark_color TEXT NOT NULL,
        light_color TEXT NOT NULL,
        FOREIGN KEY (base_artist_id) REFERENCES artists (id) ON DELETE SET NULL)`).run()
    
    // create artists names table
    database.prepare(`CREATE TABLE IF NOT EXISTS artists_names (
        artist_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_type INTEGER NOT NULL,
        PRIMARY KEY (artist_id, name_type),
        FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE)`).run()

    // create artists thumbnails table
    database.prepare(`CREATE TABLE IF NOT EXISTS artists_thumbnails (
        thumbnail_type INTEGER NOT NULL,
        url TEXT NOT NULL,
        artist_id INTEGER NOT NULL,
        PRIMARY KEY (artist_id, thumbnail_type),
        FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE)`).run()

    // create views totals table
    database.prepare(`CREATE TABLE IF NOT EXISTS views_totals (
        song_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        total INTEGER NOT NULL,
        PRIMARY KEY (song_id, timestamp),
        FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE)`).run()
    database.prepare(`CREATE INDEX IF NOT EXISTS idx_views_totals_timestamp_song_id
    ON views_totals (timestamp, song_id);`).run()

    // create views breakdown table
    database.prepare(`CREATE TABLE IF NOT EXISTS views_breakdowns (
        song_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        views INTEGER NOT NULL,
        video_id TEXT NOT NULL,
        view_type INTEGER NOT NULL,
        PRIMARY KEY (song_id, timestamp, video_id),
        FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE)`).run()
    database.prepare(`CREATE INDEX IF NOT EXISTS idx_views_breakdowns_timestamp_song_id
    ON views_breakdowns (timestamp, song_id);`).run()

    // create views metadata table
    database.prepare(`CREATE TABLE IF NOT EXISTS views_metadata (
        timestamp TEXT PRIMARY KEY NOT NULL,
        updated TEXT NOT NULL)`).run()

    // create lists table
    database.prepare(`CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        created TEXT NOT NULL,
        last_updated TEXT NOT NULL,
        image TEXT
    )`).run()

    // create lists localization table
    database.prepare(`CREATE TABLE IF NOT EXISTS lists_localizations (
        locale TEXT NOT NULL,
        list_id INTEGER NOT NULL,
        value TEXT NOT NULL,
        type INTEGER NOT NULL,
        PRIMARY KEY (list_id, locale, type),
        FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
    )`).run()

    // create lists songs table
    database.prepare(`CREATE TABLE IF NOT EXISTS lists_songs (
        song_id INTEGER NOT NULL,
        list_id INTEGER NOT NULL,
        PRIMARY KEY (song_id, list_id),
        FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE,
        FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
    )`).run()
}