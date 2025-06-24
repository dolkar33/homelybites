import requests
import os
from django.conf import settings
from .models import Recipe, Category
from slugify import slugify

class SpoonacularService:
    BASE_URL = "https://api.spoonacular.com"
    
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
    
    def import_recipe_to_db(self, recipe_data):
        """
        Import a recipe from Spoonacular API to the database
        """
        # Check if recipe already exists
        if Recipe.objects.filter(spoonacular_id=recipe_data['id']).exists():
            return Recipe.objects.get(spoonacular_id=recipe_data['id'])
        
        # Create recipe
        recipe = Recipe(
            title=recipe_data['title'],
            slug=slugify(recipe_data['title']),
            spoonacular_id=recipe_data['id'],
            image_url=recipe_data.get('image', ''),
            prep_time=recipe_data.get('preparationMinutes', recipe_data.get('readyInMinutes', 30)),
            cook_time=recipe_data.get('cookingMinutes', 30),
            difficulty='medium',  # Default value, adjust based on your logic
        )
        
        # Process ingredients
        ingredients_list = []
        for ingredient in recipe_data.get('extendedIngredients', []):
            ingredients_list.append(f"{ingredient.get('amount', '')} {ingredient.get('unit', '')} {ingredient.get('name', '')}")
        
        recipe.ingredients = "\n".join(ingredients_list)
        
        # Process instructions
        if 'analyzedInstructions' in recipe_data and recipe_data['analyzedInstructions']:
            steps = recipe_data['analyzedInstructions'][0].get('steps', [])
            instructions_list = [step['step'] for step in steps]
            recipe.instructions = "\n".join(instructions_list)
        else:
            recipe.instructions = recipe_data.get('instructions', '')
        
        # Process nutritional information
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
        
        recipe.save()
        
        # Process categories
        if 'dishTypes' in recipe_data:
            for dish_type in recipe_data['dishTypes']:
                category_slug = slugify(dish_type)
                category, created = Category.objects.get_or_create(
                    slug=category_slug,
                    defaults={'name': dish_type.title()}
                )
                recipe.categories.add(category)
        
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
