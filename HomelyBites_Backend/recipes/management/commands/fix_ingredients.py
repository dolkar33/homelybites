import requests
from django.core.management.base import BaseCommand
from recipes.models import Recipe

SPOONACULAR_API_KEY = 'b4b8be0a733f497789c7bcd463aa556e'  # <-- Replace with your actual API key

def fetch_ingredients_from_spoonacular(spoonacular_id):
    url = f"https://api.spoonacular.com/recipes/{spoonacular_id}/information"
    params = {"apiKey": SPOONACULAR_API_KEY}
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        ingredients_list = []
        for ingredient in data.get('extendedIngredients', []):
            ingredients_list.append(
                f"{ingredient.get('amount', '')} {ingredient.get('unit', '')} {ingredient.get('name', '')}"
            )
        return "\n".join(ingredients_list)
    return ""

class Command(BaseCommand):
    help = 'Bulk-fix recipes with "ingredients" as the value, fetching real ingredients from Spoonacular'

    def handle(self, *args, **options):
        recipes = Recipe.objects.filter(ingredients__iexact="ingredients")
        count = 0
        for recipe in recipes:
            if recipe.spoonacular_id:
                real_ingredients = fetch_ingredients_from_spoonacular(recipe.spoonacular_id)
                if real_ingredients:
                    recipe.ingredients = real_ingredients
                    recipe.save()
                    count += 1
        self.stdout.write(self.style.SUCCESS(f"Fixed {count} recipes with real ingredients."))
