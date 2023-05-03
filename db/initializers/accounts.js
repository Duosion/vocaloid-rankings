module.exports = (db, exists) => {
    if (exists) { return }
    db.prepare(`
    CREATE TABLE users (
        username TEXT PRIMARY KEY NOT NULL UNIQUE,
        hash TEXT NOT NULL,
        created TEXT NOT NULL,
        last_login TEXT NOT NULL,
        access_level INTEGER NOT NULL
    )`).run()

    db.prepare(`
    CREATE TABLE sessions (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
        created TEXT NOT NULL,
        expires TEXT NOT NULL,
        stay_logged_in INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
    )`).run()
}