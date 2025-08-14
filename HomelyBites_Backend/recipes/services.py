import requests
import os
from django.conf import settings
from .models import Recipe, Category, Cuisine
from .utils import auto_assign_cuisines_for_recipe
from slugify import slugify

class SpoonacularService:
    BASE_URL = "https://api.spoonacular.com"
    
    def import_cuisines_from_recipes(self, recipes):
        """
        Given a list of recipe dicts (from Spoonacular), extract and save unique cuisines.
        """
        from slugify import slugify
        cuisines_added = []
        for recipe in recipes:
            for cuisine_name in recipe.get('cuisines', []):
                slug = slugify(cuisine_name)
                cuisine, created = Cuisine.objects.get_or_create(
                    slug=slug,
                    defaults={'name': cuisine_name}
                )
                if created:
                    cuisines_added.append(cuisine.name)
        return cuisines_added
    
    def __init__(self):
        # Get API key from settings
        self.api_key = settings.SPOONACULAR_API_KEY
    
    def search_recipes(self, query=None, cuisine=None, diet=None, number=10, offset=0):
        """
        Search for recipes using the Spoonacular API
        """
        endpoint = f"{self.BASE_URL}/recipes/complexSearch"
        
        params = {
            "apiKey": self.api_key,
            "number": number,
            "offset": offset,
            "addRecipeInformation": True,
            "fillIngredients": True,
            "includeNutrition": True,
        }
        
        if query:
            params["query"] = query
        if cuisine:
            params["cuisine"] = cuisine
        if diet:
            params["diet"] = diet
            
        response = requests.get(endpoint, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            # Handle API errors
            return {"error": f"API Error: {response.status_code}", "message": response.text}
    
    def get_recipe_by_id(self, recipe_id):
        """
        Get detailed recipe information by ID
        """
        endpoint = f"{self.BASE_URL}/recipes/{recipe_id}/information"
        
        params = {
            "apiKey": self.api_key,
            "includeNutrition": True,
        }
        
        response = requests.get(endpoint, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            # Handle API errors
            return {"error": f"API Error: {response.status_code}", "message": response.text}
    
    def get_nutrition_widget(self, recipe_id):
        """
        Get nutrition widget data for a recipe by ID
        """
        endpoint = f"{self.BASE_URL}/recipes/{recipe_id}/nutritionWidget.json"
        params = {"apiKey": self.api_key}
        response = requests.get(endpoint, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            return None  # or handle error as needed

    def import_recipe_to_db(self, recipe_data):

        recipe_id = recipe_data['id']
        # Check if recipe already exists
        if Recipe.objects.filter(spoonacular_id=recipe_id).exists():
            return Recipe.objects.get(spoonacular_id=recipe_id)

        # Fetch full recipe details
        details = self.get_recipe_by_id(recipe_id)
        if not details or 'error' in details:
            print(f"Error fetching details for recipe {recipe_id}: {details.get('message', 'Unknown error') if details else 'No details'}")
            return None

        # Fetch nutrition widget (for more user-friendly nutrition info)
        nutrition_widget = self.get_nutrition_widget(recipe_id)

        # DEBUG: Print details and nutrition_widget for troubleshooting
        import pprint
        print("=== Spoonacular Details ===")
        pprint.pprint(details)
        print("=== Nutrition Widget ===")
        pprint.pprint(nutrition_widget)

        # Create recipe instance
        recipe = Recipe(
            title=details['title'],
            slug=slugify(details['title']),
            spoonacular_id=recipe_id,
            image_url=details.get('image', ''),
            prep_time=details.get('preparationMinutes', details.get('readyInMinutes', 30)),
            cook_time=details.get('cookingMinutes', 30),
            difficulty='medium',  # You can adjust this logic
        )

        # Ingredients
        ingredients_list = []
        for ingredient in details.get('extendedIngredients', []):
            ingredients_list.append(
                f"{ingredient.get('amount', '')} {ingredient.get('unit', '')} {ingredient.get('name', '')}"
            )
        recipe.ingredients = "\n".join(ingredients_list)


        # Instructions (robust, multi-section, fallback)
        instructions_text = ''
        if 'analyzedInstructions' in details and details['analyzedInstructions']:
            instructions_sections = []
            for section in details['analyzedInstructions']:
                steps = section.get('steps', [])
                if steps:
                    instructions_sections.extend([step.get('step', '') for step in steps if step.get('step')])
            instructions_text = "\n".join(instructions_sections)
        if not instructions_text:
            instructions_text = details.get('instructions', '') or recipe_data.get('instructions', '')
        recipe.instructions = instructions_text

        # Nutrition (from details['nutrition'] if present, else from widget, fallback to recipe_data)
        nutrition_data = details.get('nutrition', {}).get('nutrients', [])
        if not nutrition_data:
            nutrition_data = recipe_data.get('nutrition', {}).get('nutrients', [])
        for nutrient in nutrition_data:
            if nutrient.get('name') == 'Calories':
                recipe.calories = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"
            elif nutrient.get('name') == 'Fat':
                recipe.fat = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"
            elif nutrient.get('name') == 'Sugar':
                recipe.sugar = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"
            elif nutrient.get('name') == 'Protein':
                recipe.protein = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"
            elif nutrient.get('name') == 'Carbohydrates':
                recipe.carbohydrates = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"

        # If widget data is available, optionally overwrite for user-friendly values
        if nutrition_widget:
            recipe.calories = nutrition_widget.get('calories', recipe.calories)
            recipe.fat = nutrition_widget.get('fat', recipe.fat)
            recipe.sugar = nutrition_widget.get('sugar', recipe.sugar)
            recipe.protein = nutrition_widget.get('protein', recipe.protein)
            recipe.carbohydrates = nutrition_widget.get('carbs', recipe.carbohydrates)

        recipe.save()

        # Categories
        if 'dishTypes' in details:
            for dish_type in details['dishTypes']:
                category_slug = slugify(dish_type)
                category, created = Category.objects.get_or_create(
                    slug=category_slug,
                    defaults={'name': dish_type.title()}
                )
                recipe.categories.add(category)

        # Link cuisines to recipe (from API)
        attached = 0
        if 'cuisines' in details:
            for cuisine_name in details['cuisines']:
                slug = slugify(cuisine_name)
                cuisine, _ = Cuisine.objects.get_or_create(
                    slug=slug,
                    defaults={'name': cuisine_name}
                )
                if not recipe.cuisines.filter(pk=cuisine.pk).exists():
                    recipe.cuisines.add(cuisine)
                    attached += 1
        # If still no cuisines, auto-assign using TF-IDF similarity
        if attached == 0 and recipe.cuisines.count() == 0:
            auto_assign_cuisines_for_recipe(recipe)
        return recipe

    def import_random_recipes(self, number=10, tags=None):
        """
        Import random recipes from Spoonacular API
        """
        endpoint = f"{self.BASE_URL}/recipes/random"
        
        params = {
            "apiKey": self.api_key,
            "number": number,
            "includeNutrition": True,
        }
        
        if tags:
            params["tags"] = ",".join(tags)
            
        response = requests.get(endpoint, params=params)
        
        if response.status_code == 200:
            data = response.json()
            imported_recipes = []
            
            for recipe_data in data.get('recipes', []):
                recipe = self.import_recipe_to_db(recipe_data)
                imported_recipes.append(recipe)
                
            return imported_recipes
        else:
            # Handle API errors
            return {"error": f"API Error: {response.status_code}", "message": response.text}
