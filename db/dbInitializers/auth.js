module.exports = (db, exists) => {
    if (exists) { return }
    db.prepare('CREATE TABLE users (username STRING PRIMARY KEY NOT NULL UNIQUE, passwordHash STRING NOT NULL, created STRING NOT NULL, authLevel INTEGER NOT NULL)').run()
    db.prepare('CREATE TABLE sessions (id STRING PRIMARY KEY NOT NULL, username STRING NOT NULL, created STRING NOT NULL, expires STRING)').run()
}