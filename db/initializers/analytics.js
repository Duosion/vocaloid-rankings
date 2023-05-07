module.exports = (db, exists) => {
    if (exists) { return }
    db.prepare(`CREATE TABLE events (
        ROWID INTEGER PRIMARY KEY,
        name TEXT NOT NULL
    )`).run()
    
    db.prepare(`CREATE TABLE analytics (
        ROWID INTEGER PRIMARY KEY,
        event_id INTEGER NOT NULL,
        uid STRING NOT NULL,
        timestamp STRING NOT NULL,
        data STRING NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events (ROWID) ON DELETE CASCADE
    )`).run()
}