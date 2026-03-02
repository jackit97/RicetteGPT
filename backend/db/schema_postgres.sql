-- PostgreSQL schema for RicetteGPT backend
-- Usage:
--   psql "$DATABASE_URL" -f backend/db/schema_postgres.sql

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: store multiple active tokens per user; you can also keep just one.
CREATE TABLE IF NOT EXISTS auth_tokens (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- Saved recipes per user. Anti-duplicate by (user_id, title_normalized).
-- Use JSONB so you can query later if needed.
CREATE TABLE IF NOT EXISTS user_recipes (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  title_normalized TEXT NOT NULL,
  ingredients      JSONB NOT NULL,
  steps            JSONB NOT NULL,
  image_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_recipe_title UNIQUE (user_id, title_normalized)
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_title_norm ON user_recipes(title_normalized);

COMMIT;
