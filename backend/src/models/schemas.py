from typing import List
from pydantic import BaseModel

class RecipeListResponse(BaseModel):
    recipes: List[str]

class RecipeDetailsRequest(BaseModel):
    title: str

class RecipeDetailsResponse(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    image_url: str


class UserRegisterRequest(BaseModel):
    email: str
    password: str


class UserLoginRequest(BaseModel):
    email: str
    password: str


class SaveRecipeRequest(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    image_url: str


class UserRecipesResponse(BaseModel):
    recipes: List[RecipeDetailsResponse]
