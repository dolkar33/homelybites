from django.core.management.base import BaseCommand
from django.conf import settings
from recipes.models import Recipe
import requests

class Command(BaseCommand):
    help = 'Import recipes from Spoonacular based on ingredients'

    def handle(self, *args, **kwargs):
        ingredients = "onion,rice,egg,tomato"
        url = f"https://api.spoonacular.com/recipes/findByIngredients?ingredients={ingredients}&number=5&apiKey={settings.SPOONACULAR_API_KEY}"
        
        response = requests.get(url)
        if response.status_code != 200:
            self.stdout.write(self.style.ERROR("Failed to fetch data from Spoonacular"))
            return

        data = response.json()

        for item in data:
            spoonacular_id = item.get('id')
            title = item.get('title')
            image = item.get('image')

            recipe, created = Recipe.objects.get_or_create(
                spoonacular_id=spoonacular_id,
                defaults={
                    'title': title,
                    'image': image
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f" Created recipe: {title}"))
            else:
                self.stdout.write(self.style.WARNING(f" Already exists: {title}"))
