import os
import base64
from typing import Optional
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from src.services.openai_client import OpenAIService
from src.models.schemas import (
    RecipeDetailsRequest,
    RecipeDetailsResponse,
    RecipeListResponse,
    UserRegisterRequest,
    UserLoginRequest,
    SaveRecipeRequest,
    UserRecipesResponse,
)
from src.services.user_store import (
    create_user,
    authenticate,
    get_email_by_token,
    save_recipe_for_user,
    list_recipes_for_user,
    delete_recipe_for_user,
)

load_dotenv()

app = FastAPI(title="Ricette GPT Backend")

# Allow Expo dev clients; for production, restrict origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_service = OpenAIService()


@app.get("/")
def root():
    return {"status": "ok", "service": "ricette-gpt"}


@app.post("/analyze-image", response_model=RecipeListResponse)
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"error": "Il file deve essere un'immagine."})

    image_bytes = await file.read()
    recipes = await openai_service.analyze_image_and_get_titles(image_bytes)
    return RecipeListResponse(recipes=recipes)


@app.post("/recipe-details", response_model=RecipeDetailsResponse)
async def recipe_details(body: RecipeDetailsRequest):
    details = await openai_service.get_recipe_details(body.title)
    return details


# Auth endpoints (simple file-based store)
@app.post('/register')
def register(body: UserRegisterRequest):
    token = create_user(body.email, body.password)
    if not token:
        return JSONResponse(status_code=400, content={"error": "Utente già esistente"})
    return {"token": token}


@app.post('/login')
def login(body: UserLoginRequest):
    token = authenticate(body.email, body.password)
    if not token:
        return JSONResponse(status_code=401, content={"error": "Credenziali non valide"})
    return {"token": token}


def _get_token_from_header(auth_header: Optional[str]):
    if not auth_header:
        return None
    if auth_header.lower().startswith('bearer '):
        return auth_header[7:]
    return None


from fastapi import Request


@app.post('/recipes')
async def save_recipe(req: SaveRecipeRequest, request: Request):
    auth = request.headers.get('Authorization')
    token = _get_token_from_header(auth)
    if not token:
        return JSONResponse(status_code=401, content={"error": "Missing token"})
    email = get_email_by_token(token)
    if not email:
        return JSONResponse(status_code=401, content={"error": "Invalid token"})
    saved = save_recipe_for_user(email, req.dict())
    if not saved:
        return JSONResponse(status_code=500, content={"error": "Impossibile salvare"})
    return {"ok": True}


@app.get('/recipes', response_model=UserRecipesResponse)
async def get_recipes(request: Request):
    auth = request.headers.get('Authorization')
    token = _get_token_from_header(auth)
    if not token:
        return JSONResponse(status_code=401, content={"error": "Missing token"})
    email = get_email_by_token(token)
    if not email:
        return JSONResponse(status_code=401, content={"error": "Invalid token"})
    recipes = list_recipes_for_user(email)
    return UserRecipesResponse(recipes=recipes)


@app.delete('/recipes/{index}')
async def delete_recipe(index: int, request: Request):
    auth = request.headers.get('Authorization')
    token = _get_token_from_header(auth)
    if not token:
        return JSONResponse(status_code=401, content={"error": "Missing token"})
    email = get_email_by_token(token)
    if not email:
        return JSONResponse(status_code=401, content={"error": "Invalid token"})
    # delete recipe by index
    try:
        ok = delete_recipe_for_user(email, index)
    except Exception:
        ok = False
    if not ok:
        return JSONResponse(status_code=404, content={"error": "Recipe not found"})
    return {"ok": True}
