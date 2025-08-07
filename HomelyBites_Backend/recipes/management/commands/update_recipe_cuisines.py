from django.core.management.base import BaseCommand
from recipes.models import Recipe, Cuisine
from recipes.services import SpoonacularService
from slugify import slugify

class Command(BaseCommand):
    help = "Update cuisines for existing recipes from Spoonacular"

    def handle(self, *args, **kwargs):
        service = SpoonacularService()
        updated = 0
        for recipe in Recipe.objects.all():
            if not recipe.spoonacular_id:
                continue
            details = service.get_recipe_by_id(recipe.spoonacular_id)
            cuisines = details.get('cuisines', [])
            for cuisine_name in cuisines:
                slug = slugify(cuisine_name)
                cuisine, _ = Cuisine.objects.get_or_create(
                    slug=slug,
                    defaults={'name': cuisine_name}
                )
                recipe.cuisines.add(cuisine)
            recipe.save()
            updated += 1
            print(f"Updated {recipe.title} with cuisines: {cuisines}")
        print(f"Done. Updated {updated} recipes.")