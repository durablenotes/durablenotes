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

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);

INSERT INTO stats (key, value) VALUES ('total_notes', 0) ON CONFLICT(key) DO NOTHING;
-- Defaults
INSERT INTO system_settings (key, value) VALUES ('site_title', 'Durable Notes') ON CONFLICT(key) DO NOTHING;
INSERT INTO system_settings (key, value) VALUES ('logo_url', '/logo.png') ON CONFLICT(key) DO NOTHING;
INSERT INTO system_settings (key, value) VALUES ('favicon_url', '/favicon.ico') ON CONFLICT(key) DO NOTHING;
