-- SQLite schema for RicetteGPT backend
-- Usage (PowerShell):
--   cd backend
--   sqlite3 .\data\app.db ".read db/schema_sqlite.sql"

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- Optional: store multiple active tokens per user; you can also keep just one.
CREATE TABLE IF NOT EXISTS auth_tokens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at  TEXT,
  revoked_at  TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved recipes per user. Anti-duplicate by (user_id, title_normalized).
CREATE TABLE IF NOT EXISTS user_recipes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL,
  title            TEXT NOT NULL,
  title_normalized TEXT NOT NULL,
  ingredients_json TEXT NOT NULL,
  steps_json       TEXT NOT NULL,
  image_url        TEXT,
  created_at       TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at       TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, title_normalized)
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_title_norm ON user_recipes(title_normalized);
