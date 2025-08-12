from django.core.management.base import BaseCommand
from django.conf import settings
from recipes.models import Recipe
import requests

class Command(BaseCommand):
    help = "Fetch recipes from Spoonacular API and update nutrition info"

    def handle(self, *args, **kwargs):
        api_key = settings.SPOONACULAR_API_KEY
        url = f"https://api.spoonacular.com/recipes/complexSearch"
        params = {
            "apiKey": api_key,
            "number": 5,
        }

        response = requests.get(url, params=params)
        print("Status code:", response.status_code)
        if response.status_code != 200:
            self.stderr.write("Failed to fetch data")
            return

        data = response.json()
        print("Response:", data)

        for item in data.get("results", []):
            spoonacular_id = item["id"]

            if Recipe.objects.filter(spoonacular_id=spoonacular_id).exists():
                self.stdout.write(f"Recipe with ID {spoonacular_id} already exists. Skipping.")
                continue

            
            detail_url = f"https://api.spoonacular.com/recipes/{spoonacular_id}/nutritionWidget.json"
            detail_params = {"apiKey": api_key}
            detail_response = requests.get(detail_url, params=detail_params)

            if detail_response.status_code != 200:
                self.stderr.write(f"Failed to fetch details for recipe {spoonacular_id}")
                continue

            nutrition = detail_response.json()

            recipe = Recipe(
                spoonacular_id=spoonacular_id,
                title=item.get("title"),
                image=item.get("image"),
                calories=float(nutrition.get("calories", "0").replace("kcal", "").strip()),
                fat=float(nutrition.get("fat", "0").replace("g", "").strip()),
                protein=float(nutrition.get("protein", "0").replace("g", "").strip()),
                carbs=float(nutrition.get("carbs", "0").replace("g", "").strip()),
            )
            recipe.save()
            self.stdout.write(f"Saved: {recipe.title}")
