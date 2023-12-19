import { Database } from "better-sqlite3";

export default function init(
    database: Database,
    exists: Boolean
) {
    if (exists) { return }

    // create user table
    database.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL,
        email_verified TEXT
    )`).run()

    // create account table
    database.prepare(`CREATE TABLE IF NOT EXISTS accounts (
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, provider, provider_account_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`)

    // create session table
    database.prepare(`CREATE TABLE IF NOT EXISTS sessions (
        session_token TEXT PRIMARY KEY NOT NULL,
        expires TEXT NOT NULL,
        user_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`).run()

    // create verification tokens table
    database.prepare(`CREATE TABLE IF NOT EXISTS tokens (
        token TEXT NOT NULL,
        identifier TEXT NOT NULL,
        expires TEXT NOT NULL,
        PRIMARY KEY (token, identifier)
    )`).run()
}