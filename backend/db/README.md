# Database schema

This folder contains SQL schemas to create the tables needed to replace the current JSON file store.

## SQLite (local/dev)

```powershell
cd backend
# create a db file in backend/data
sqlite3 .\data\app.db ".read db/schema_sqlite.sql"
```

## PostgreSQL (prod)

```powershell
# DATABASE_URL example: postgresql://user:pass@host:5432/ricettegpt
psql "$env:DATABASE_URL" -f backend/db/schema_postgres.sql
```

## Tables

- `users`: accounts with `email` and `password_hash`
- `auth_tokens`: bearer tokens (optional, supports multiple sessions)
- `user_recipes`: saved recipes per user, **deduplicated** via `(user_id, title_normalized)`

Notes:
- `title_normalized` should be the lowercased/trimmed title.
- In SQLite schema, ingredients/steps are stored as JSON strings (`ingredients_json`, `steps_json`).
- In Postgres schema, ingredients/steps are stored as `JSONB`.
