import { Database } from "better-sqlite3";

export default function init(
    database: Database,
    exists: Boolean
) {
    if (exists) { return }

    // create user table
    database.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY NOT NULL
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created TEXT NOT NULL,
        last_login TEXT NOT NULL,
        access_level INTEGER NOT NULL
    )`).run()

    // create session table
    database.prepare(`CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY NOT NULL,
        expires TEXT NOT NULL,
        user_id TEXT NOT NULL,
        stay_logged_in INTEGER NOT NULL DEFAULT 0
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`).run()
}