import json
import os
import hashlib
import uuid
from typing import Optional


def _truthy(value: Optional[str]) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def _get_database_url() -> Optional[str]:
    url = os.getenv("DATABASE_URL")
    if not url:
        return None
    return url.strip()


def _use_postgres() -> bool:
    # Use Postgres whenever DATABASE_URL is configured.
    return bool(_get_database_url())

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'users.json')

def _ensure_data_dir():
    d = os.path.dirname(DATA_FILE)
    if not os.path.exists(d):
        os.makedirs(d, exist_ok=True)

def _load():
    _ensure_data_dir()
    if not os.path.exists(DATA_FILE):
        return {"users": {}}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except Exception:
            return {"users": {}}

def _save(data):
    _ensure_data_dir()
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def create_user(email: str, password: str) -> Optional[str]:
    if _use_postgres():
        return _pg_create_user(email, password)
    data = _load()
    users = data.setdefault('users', {})
    if email in users:
        return None
    pwd = _hash_password(password)
    token = str(uuid.uuid4())
    users[email] = {"password": pwd, "token": token, "recipes": []}
    _save(data)
    return token

def authenticate(email: str, password: str) -> Optional[str]:
    if _use_postgres():
        return _pg_authenticate(email, password)
    data = _load()
    users = data.get('users', {})
    user = users.get(email)
    if not user:
        return None
    if user.get('password') != _hash_password(password):
        return None
    # return existing token
    token = user.get('token')
    if not token:
        token = str(uuid.uuid4())
        user['token'] = token
        _save(data)
    return token

def get_email_by_token(token: str) -> Optional[str]:
    if _use_postgres():
        return _pg_get_email_by_token(token)
    data = _load()
    for email, u in data.get('users', {}).items():
        if u.get('token') == token:
            return email
    return None

def save_recipe_for_user(email: str, recipe: dict):
    if _use_postgres():
        return _pg_save_recipe_for_user(email, recipe)
    data = _load()
    users = data.setdefault('users', {})
    if email not in users:
        return False
    recipes = users[email].setdefault('recipes', [])
    title = (recipe.get('title') or '').strip().lower()
    # replace existing recipe with same title (case-insensitive) to avoid duplicates
    replaced = False
    for idx, r in enumerate(recipes):
        existing_title = (r.get('title') or '').strip().lower()
        if title and existing_title == title:
            recipes[idx] = recipe
            replaced = True
            break
    if not replaced:
        recipes.append(recipe)
    _save(data)
    return True

def list_recipes_for_user(email: str):
    if _use_postgres():
        return _pg_list_recipes_for_user(email)
    data = _load()
    users = data.get('users', {})
    return users.get(email, {}).get('recipes', [])


def delete_recipe_for_user(email: str, index: int) -> bool:
    if _use_postgres():
        return _pg_delete_recipe_for_user(email, index)
    data = _load()
    users = data.setdefault('users', {})
    user = users.get(email)
    if not user:
        return False
    recipes = user.setdefault('recipes', [])
    if index < 0 or index >= len(recipes):
        return False
    recipes.pop(index)
    _save(data)
    return True


def _pg_conn():
    import psycopg

    url = _get_database_url()
    if not url:
        raise RuntimeError("DATABASE_URL not set")
    return psycopg.connect(url)


def _pg_get_user_id(cur, email: str) -> Optional[int]:
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cur.fetchone()
    return int(row[0]) if row else None


def _pg_create_user(email: str, password: str) -> Optional[str]:
    from psycopg.errors import UniqueViolation

    password_hash = _hash_password(password)
    token = str(uuid.uuid4())

    with _pg_conn() as conn:
        try:
            with conn.transaction():
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
                        (email, password_hash),
                    )
                    user_id = cur.fetchone()[0]
                    cur.execute(
                        "INSERT INTO auth_tokens (user_id, token) VALUES (%s, %s)",
                        (user_id, token),
                    )
            return token
        except UniqueViolation:
            return None


def _pg_authenticate(email: str, password: str) -> Optional[str]:
    password_hash = _hash_password(password)

    with _pg_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, password_hash FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row:
                return None
            user_id, stored_hash = row
            if stored_hash != password_hash:
                return None

        # return latest active token if any, else create one
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT token
                    FROM auth_tokens
                    WHERE user_id = %s
                      AND revoked_at IS NULL
                      AND (expires_at IS NULL OR expires_at > NOW())
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (user_id,),
                )
                row = cur.fetchone()
                if row and row[0]:
                    return row[0]

                token = str(uuid.uuid4())
                cur.execute(
                    "INSERT INTO auth_tokens (user_id, token) VALUES (%s, %s)",
                    (user_id, token),
                )
                return token


def _pg_get_email_by_token(token: str) -> Optional[str]:
    with _pg_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.email
                FROM auth_tokens t
                JOIN users u ON u.id = t.user_id
                WHERE t.token = %s
                  AND t.revoked_at IS NULL
                  AND (t.expires_at IS NULL OR t.expires_at > NOW())
                LIMIT 1
                """,
                (token,),
            )
            row = cur.fetchone()
            return row[0] if row else None


def _pg_save_recipe_for_user(email: str, recipe: dict) -> bool:
    from psycopg.types.json import Jsonb

    title = (recipe.get("title") or "").strip()
    if not title:
        return False

    title_normalized = title.strip().lower()
    ingredients = recipe.get("ingredients") or []
    steps = recipe.get("steps") or []
    image_url = recipe.get("image_url")

    with _pg_conn() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                user_id = _pg_get_user_id(cur, email)
                if not user_id:
                    return False

                cur.execute(
                    """
                    INSERT INTO user_recipes (user_id, title, title_normalized, ingredients, steps, image_url)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, title_normalized)
                    DO UPDATE SET
                      title = EXCLUDED.title,
                      ingredients = EXCLUDED.ingredients,
                      steps = EXCLUDED.steps,
                      image_url = EXCLUDED.image_url,
                      updated_at = NOW()
                    """,
                    (user_id, title, title_normalized, Jsonb(ingredients), Jsonb(steps), image_url),
                )
        return True


def _pg_list_recipes_for_user(email: str):
    with _pg_conn() as conn:
        with conn.cursor() as cur:
            user_id = _pg_get_user_id(cur, email)
            if not user_id:
                return []
            cur.execute(
                """
                SELECT title, ingredients, steps, COALESCE(image_url, '') AS image_url
                FROM user_recipes
                WHERE user_id = %s
                ORDER BY updated_at DESC, id DESC
                """,
                (user_id,),
            )
            rows = cur.fetchall()
            return [
                {
                    "title": r[0],
                    "ingredients": r[1],
                    "steps": r[2],
                    "image_url": r[3],
                }
                for r in rows
            ]


def _pg_delete_recipe_for_user(email: str, index: int) -> bool:
    if index < 0:
        return False

    with _pg_conn() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                user_id = _pg_get_user_id(cur, email)
                if not user_id:
                    return False

                cur.execute(
                    """
                    SELECT id
                    FROM user_recipes
                    WHERE user_id = %s
                    ORDER BY updated_at DESC, id DESC
                    """,
                    (user_id,),
                )
                ids = [r[0] for r in cur.fetchall()]
                if index >= len(ids):
                    return False
                recipe_id = ids[index]
                cur.execute("DELETE FROM user_recipes WHERE id = %s AND user_id = %s", (recipe_id, user_id))
                return cur.rowcount > 0
