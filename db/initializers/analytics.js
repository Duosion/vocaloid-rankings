module.exports = (db, exists) => {
    if (exists) { return }
    
    db.prepare(`CREATE TABLE analytics (
        ROWID INTEGER PRIMARY KEY,
        event INTEGER NOT NULL,
        uid STRING NOT NULL,
        timestamp STRING NOT NULL,
        data STRING NOT NULL
    )`).run()
}