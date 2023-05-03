module.exports = (db, exists) => {
    if (exists) { return }
    db.prepare('CREATE TABLE analytics (eventName TEXT PRIMARY KEY NOT NULL)').run()
}