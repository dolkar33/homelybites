from rest_framework import serializers
from .models import Recipe, UserRecipeInteraction
from .models import Recipe

class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = '__all__'  # serialize all fields

class UserRecipeInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRecipeInteraction
        fields = '__all__'

        from rest_framework import serializers
from .models import Recipe

class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = [
            'id',
            'title',
            'ingredients',      
            'instructions',     
            'spoonacular_id',
            'image',
            'tags',
        ]

