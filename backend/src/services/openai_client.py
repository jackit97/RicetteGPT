import os
import base64
import urllib.parse
from typing import List

from pydantic import BaseModel

try:
    from openai import OpenAI
except Exception:
    OpenAI = None  # type: ignore

from src.models.schemas import RecipeDetailsResponse

# Simple prints for diagnostics so developers can see when fallbacks are used

DEFAULT_TITLES = [
    "Pasta veloce con pomodori e basilico",
    "Insalata ricca con ingredienti del frigo",
    "Toast gourmet con crema e verdure"
]

class OpenAIService:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.images_model = os.getenv("OPENAI_IMAGES_MODEL", "gpt-image-1")
        self.generate_dish_image = os.getenv("OPENAI_GENERATE_DISH_IMAGE", "0").strip().lower() in ("1", "true", "yes")
        self.client = OpenAI(api_key=self.api_key) if (OpenAI and self.api_key) else None
        print(
            f"[OpenAIService] initialized: client={'yes' if self.client else 'no'}, model={self.model}, images_model={self.images_model}, "
            f"generate_dish_image={'yes' if self.generate_dish_image else 'no'}, has_api_key={'yes' if bool(self.api_key) else 'no'}"
        )

    async def analyze_image_and_get_titles(self, image_bytes: bytes) -> List[str]:
        # Fallback if API not configured
        if not self.client:
            print("[OpenAIService] analyze_image_and_get_titles: no client configured, returning DEFAULT_TITLES")
            return DEFAULT_TITLES

        b64 = base64.b64encode(image_bytes).decode("utf-8")
        image_data_url = f"data:image/jpeg;base64,{b64}"

        prompt = (
            "In base agli ingredienti che vedi in foto, consigliami 3 ricette. "
            "Voglio solo il titolo, ma abbastanza esplicativo, quindi senza specificare per forza il nome del piatto. "
            "Rispondi con una lista di 3 titoli, uno per riga, senza numeri o punteggiatura extra."
        )

        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Sei un assistente culinario che propone idee di ricette concise e chiare."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_data_url, "detail": "low"}},
                        ],
                    },
                ],
                temperature=0.3,
                max_tokens=120,
            )
            text = resp.choices[0].message.content or ""
            print(f"[OpenAIService] analyze_image_and_get_titles: OpenAI response snippet: {text[:300]}")
            lines = [l.strip("- ") for l in text.splitlines() if l.strip()]
            # Ensure exactly 3
            if len(lines) < 3:
                lines += DEFAULT_TITLES[len(lines):]
            return lines[:3]
        except Exception as e:
            print(f"[OpenAIService] analyze_image_and_get_titles exception: {e}")
            return DEFAULT_TITLES

    async def get_recipe_details(self, title: str) -> RecipeDetailsResponse:
        # Fallback content
        if not self.client:
            print(f"[OpenAIService] get_recipe_details: no client configured, returning fallback for title={title}")
            return RecipeDetailsResponse(
                title=title,
                ingredients=[
                    "Olio extravergine d'oliva",
                    "Sale e pepe",
                    "Pomodori",
                    "Basilico fresco",
                    "Aglio",
                    "Pasta secca",
                ],
                steps=[
                    "Porta a bollore una pentola d'acqua salata e cuoci la pasta.",
                    "Taglia i pomodori e trita l'aglio, saltali in padella con olio.",
                    "Scola la pasta al dente e uniscila al condimento.",
                    "Aggiungi basilico spezzettato, regola di sale e pepe.",
                    "Servi caldo con un filo d'olio a crudo.",
                ],
                image_url="https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1080&q=80&auto=format&fit=crop",
            )

        details_prompt = (
            "Scrivimi tutti gli ingredienti, anche quelli base, e tutti i passaggi per fare al meglio la ricetta che ti ho scritto. "
            "Rispondi in JSON con chiavi: ingredients (array di stringhe) e steps (array di stringhe). Ricetta: " + title
        )

        try:
            comp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Sei uno chef. Rispondi in JSON pulito e valido."},
                    {"role": "user", "content": details_prompt},
                ],
                temperature=0.4,
                max_tokens=900,
                response_format={"type": "json_object"},
            )
            content = comp.choices[0].message.content or "{}"
            print(f"[OpenAIService] get_recipe_details: OpenAI response snippet: {str(content)[:500]}")
        except Exception:
            import traceback
            print(f"[OpenAIService] get_recipe_details: exception calling OpenAI:\n{traceback.format_exc()}")
            content = "{}"

        import json
        import re
        ingredients: List[str] = []
        steps: List[str] = []
        # Clean common wrappers (markdown code fences, leading/trailing text)
        def _clean_content(txt: str) -> str:
            if not isinstance(txt, str):
                return txt
            # extract first fenced JSON block ```json ... ``` or ``` ... ```
            m = re.search(r"```(?:json)?\s*(.*?)```", txt, re.S | re.I)
            if m:
                return m.group(1).strip()
            # otherwise try to extract the first {...} object in the text
            start = txt.find('{')
            end = txt.rfind('}')
            if start != -1 and end != -1 and end > start:
                return txt[start:end+1]
            return txt

        cleaned = _clean_content(content)
        print(f"[OpenAIService] get_recipe_details: cleaned OpenAI response snippet: {str(cleaned)[:500]}")
        try:
            data = json.loads(cleaned)
            # Coerce to list of strings
            ingredients = [str(x) for x in data.get("ingredients", [])][:50]
            steps = [str(x) for x in data.get("steps", [])][:50]
        except Exception:
            print(f"[OpenAIService] get_recipe_details: failed to parse JSON from OpenAI response: {content[:300]}")
            ingredients = []
            steps = []

        # If OpenAI returned empty arrays or '{}', provide sensible defaults
        if not ingredients:
            ingredients = [
                "Olio extravergine d'oliva",
                "Sale e pepe",
                "Pomodori",
                "Basilico fresco",
                "Aglio",
                "Pasta secca",
            ]
        if not steps:
            steps = [
                "Porta a bollore una pentola d'acqua salata e cuoci la pasta.",
                "Taglia i pomodori e trita l'aglio, saltali in padella con olio.",
                "Scola la pasta al dente e uniscila al condimento.",
                "Aggiungi basilico spezzettato, regola di sale e pepe.",
                "Servi caldo con un filo d'olio a crudo.",
            ]

        if self.generate_dish_image:
            image_url = await self._generate_dish_image_url(title)
        else:
            safe_q = urllib.parse.quote_plus(title)
            image_url = f"https://source.unsplash.com/featured/?{safe_q}"
        return RecipeDetailsResponse(title=title, ingredients=ingredients, steps=steps, image_url=image_url)

    async def _generate_dish_image_url(self, title: str) -> str:
        # Try to generate an image; fallback to stock if failure
        if not self.client:
            return "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1080&q=80&auto=format&fit=crop"

        try:
            prompt = (
                f"Foto realistica, luminosa, del piatto completo: {title}. "
                "Stile fotografico food, sfondo neutro, alta qualità."
            )
            print(f"[OpenAIService] _generate_dish_image_url: generating image for '{title}' using model={self.images_model}")
            img = self.client.images.generate(model=self.images_model, prompt=prompt, size="1024x1024")
            # Some SDKs return different shapes; guard access
            b64 = None
            try:
                b64 = getattr(img.data[0], 'b64_json', None) or img.data[0].get('b64_json')
            except Exception:
                try:
                    b64 = img.data[0]['b64_json']
                except Exception:
                    b64 = None
            if not b64:
                raise RuntimeError("No image data from OpenAI")
            return f"data:image/png;base64,{b64}"
        except Exception:
            import traceback
            print(f"[OpenAIService] _generate_dish_image_url: image generation failed: {traceback.format_exc()}")
            # Fallback: use Unsplash featured image for the recipe query (no API key required)
            safe_q = urllib.parse.quote_plus(title)
            return f"https://source.unsplash.com/featured/?{safe_q}"
