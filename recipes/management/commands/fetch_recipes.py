from django.core.management.base import BaseCommand
from recipes.models import Recipe
from django.conf import settings
import requests

class Command(BaseCommand):
    help = 'Fetches recipes from Spoonacular API and saves them to the database'

    def handle(self, *args, **kwargs):
        API_KEY = settings.SPOONACULAR_API_KEY
        url = f"https://api.spoonacular.com/recipes/random?number=10&apiKey={API_KEY}"
        response = requests.get(url)

        if response.status_code != 200:
            self.stdout.write(self.style.ERROR(f"Error: {response.status_code}"))
            return

        data = response.json()
        saved_count = 0

        for item in data.get('recipes', []):
            spoonacular_id = item.get('id') 
            title = item.get('title')
            image = item.get('image')
            instructions = item.get('instructions') or ''
            ingredients_list = [ing['original'] for ing in item.get('extendedIngredients', [])]
            ingredients = ', '.join(ingredients_list)
            tags = ', '.join(item.get('dishTypes', []))
            
            if not Recipe.objects.filter(spoonacular_id=spoonacular_id).exists():
                Recipe.objects.create(
                    spoonacular_id=spoonacular_id,
                    title=title,
                    image=image,
                    instructions=instructions,
                    ingredients=ingredients,
                    tags=tags
                    )
                saved_count += 1
                self.stdout.write(self.style.SUCCESS(f"{saved_count} new recipes saved!"))


    import requests
from django.conf import settings

def fetch_spoonacular_recipes():
    url = "https://api.spoonacular.com/recipes/complexSearch"
    params = {
        "apiKey": settings.SPOONACULAR_API_KEY,
        "maxReadyTime": 20,
        "number": 5,
        "cuisine": "indian,asian",
        "addRecipeInformation": "true"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        return None

        
