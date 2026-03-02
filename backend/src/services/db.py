import os
from pathlib import Path
from typing import Optional


def _truthy(value: Optional[str]) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def get_database_url() -> Optional[str]:
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    return url.strip()


def has_postgres_config() -> bool:
    return bool(get_database_url())


def _load_schema_sql() -> str:
    backend_dir = Path(__file__).resolve().parents[2]
    schema_path = backend_dir / "db" / "schema_postgres.sql"
    return schema_path.read_text(encoding="utf-8")


def _split_sql_statements(sql_text: str) -> list[str]:
    lines: list[str] = []
    for raw in sql_text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("--"):
            continue
        lines.append(raw)

    joined = "\n".join(lines)
    parts = [p.strip() for p in joined.split(";")]
    statements = [p for p in parts if p]
    # Remove explicit transaction statements; we manage our own transaction.
    cleaned: list[str] = []
    for stmt in statements:
        upper = stmt.strip().upper()
        if upper in {"BEGIN", "COMMIT", "ROLLBACK"}:
            continue
        cleaned.append(stmt)
    return cleaned


def auto_migrate_if_enabled() -> None:
    if not has_postgres_config():
        return

    if not _truthy(os.getenv("DB_AUTO_MIGRATE")):
        return

    import psycopg

    url = get_database_url()
    if not url:
        return

    schema_sql = _load_schema_sql()
    statements = _split_sql_statements(schema_sql)
    if not statements:
        return

    with psycopg.connect(url) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                for stmt in statements:
                    cur.execute(stmt)
