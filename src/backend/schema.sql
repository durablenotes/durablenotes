DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS stats (
    key TEXT PRIMARY KEY,
    value INTEGER DEFAULT 0
);

INSERT INTO stats (key, value) VALUES ('total_notes', 0) ON CONFLICT(key) DO NOTHING;
