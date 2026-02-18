import json
import os
import hashlib
import uuid
from typing import Optional

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
    data = _load()
    for email, u in data.get('users', {}).items():
        if u.get('token') == token:
            return email
    return None

def save_recipe_for_user(email: str, recipe: dict):
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
    data = _load()
    users = data.get('users', {})
    return users.get(email, {}).get('recipes', [])


def delete_recipe_for_user(email: str, index: int) -> bool:
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
