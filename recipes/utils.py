from django.db.models import Count, Q
import pandas as pd
from .models import Recipe, UserTastePreference
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def get_content_based_recommendations(user):
    """
    Generates recipe recommendations for a user based on their taste preferences
    using a content-based filtering approach with TF-IDF.
    """
    try:
        preferences = UserTastePreference.objects.get(user=user)
    except UserTastePreference.DoesNotExist:
        return Recipe.objects.none() # Return no recipes if preferences are not set

    recipes = Recipe.objects.all()
    if not recipes.exists():
        return Recipe.objects.none()

    # Create a text corpus for recipes
    recipe_corpus = [
        f"{recipe.title} {recipe.tags} {recipe.ingredients}" for recipe in recipes
    ]

    # Correctly split preference strings into lists
    dietary_preferences_list = preferences.dietary_preferences.split(',') if preferences.dietary_preferences else []
    dislikes_list = preferences.dislikes.split(',') if preferences.dislikes else []
    user_allergies_list = preferences.allergies.split(',') if preferences.allergies else []

    # Create user profile text from preferences
    user_profile_text = ' '.join(dietary_preferences_list) + ' ' + ' '.join(dislikes_list)

    # If user profile is empty, we can't make a recommendation
    if not user_profile_text.strip():
        return Recipe.objects.order_by('?')[:10] # Fallback to random recipes

    # Initialize and fit the TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(stop_words='english')
    recipe_matrix = vectorizer.fit_transform(recipe_corpus)
    user_vector = vectorizer.transform([user_profile_text])

    # Calculate cosine similarity
    cosine_similarities = cosine_similarity(user_vector, recipe_matrix).flatten()

    # Get top N similar recipe indices
    num_recommendations = 20  # Get more initial recommendations to filter from
    similar_indices = cosine_similarities.argsort()[:-num_recommendations-1:-1]

    # Filter out recipes based on allergies
    recommended_recipes = []
    user_allergies = set(allergy.strip().lower() for allergy in user_allergies_list if allergy.strip())

    for i in similar_indices:
        recipe = recipes[i]
        recipe_ingredients = set(ingredient.strip().lower() for ingredient in recipe.ingredients.split(',') if ingredient.strip())

        # Check for allergies
        if not user_allergies.intersection(recipe_ingredients):
            recommended_recipes.append(recipe)

        # Limit to top 10 final recommendations
        if len(recommended_recipes) >= 10:
            break

    # We need to return a queryset, not a list, for consistency
    recommended_ids = [r.id for r in recommended_recipes]
    return Recipe.objects.filter(id__in=recommended_ids)

# The following functions are commented out as they depend on the UserRecipeInteraction model,
# which has not been implemented yet. This code will be used in a future step.

# def content_based_recommendation(user):
#     liked_recipe_ids = list(UserRecipeInteraction.objects.filter(
#         user=user,
#         interaction_type='like'
#     ).values_list('recipe', flat=True))
#
#     if not liked_recipe_ids:
#         return Recipe.objects.order_by('?')[:5]  # Fallback: random 5 recipes
#
#     liked_recipes_qs = Recipe.objects.filter(id__in=liked_recipe_ids)
#     tag_set = set()
#
#     for recipe in liked_recipes_qs:
#         if recipe.tags:
#             tags = [t.strip().lower() for t in recipe.tags.split(',')]
#             tag_set.update(tags)
#         if recipe.ingredients:
#             ingredients = [ing.strip().lower() for ing in recipe.ingredients.split(',')]
#             tag_set.update(ingredients)
#
#     if not tag_set:
#         return Recipe.objects.order_by('?')[:5]
#
#     tag_filter = Q()
#     for term in tag_set:
#         tag_filter |= Q(tags__icontains=term) | Q(ingredients__icontains=term)
#
#     recommended = Recipe.objects.filter(tag_filter).exclude(
#         id__in=liked_recipe_ids
#     ).annotate(
#         num_likes=Count('userrecipeinteraction', filter=Q(userrecipeinteraction__interaction_type='like'))
#     ).order_by('-num_likes')
#
#     return recommended
#
#
# def collaborative_recommendation(user):
#     liked_recipes = list(UserRecipeInteraction.objects.filter(
#         user=user,
#         interaction_type='like'
#     ).values_list('recipe', flat=True))
#
#     similar_users = list(UserRecipeInteraction.objects.filter(
#         recipe__in=liked_recipes,
#         interaction_type='like'
#     ).exclude(user=user).values_list('user', flat=True).distinct())
#
#     recommended_recipe_ids = list(UserRecipeInteraction.objects.filter(
#         user__in=similar_users,
#         interaction_type='like'
#     ).exclude(
#         recipe__in=liked_recipes
#     ).values_list('recipe', flat=True))
#
#     recommended = Recipe.objects.filter(
#         id__in=recommended_recipe_ids
#     ).annotate(
#         count_likes=Count('userrecipeinteraction', filter=Q(userrecipeinteraction__interaction_type='like'))
#     ).order_by('-count_likes')
#
#     return recommended



def get_user_preferences(user):
    try:
        preferences = UserTastePreference.objects.get(user=user)
        return {
            "diet": preferences.diet,
            "allergies": preferences.allergies.split(","),
            "dislikes": preferences.dislikes.split(","),
        }
    except UserTastePreference.DoesNotExist:
        return {
            "diet": "None",
            "allergies": [],
            "dislikes": [],
        }



def build_training_dataframe():
    recipes = Recipe.objects.exclude(
        calories__isnull=True
    ).exclude(
        fat__isnull=True
    ).exclude(
        protein__isnull=True
    ).exclude(
        carbs__isnull=True
    ).exclude(
        likes__isnull=True
    )

    data = []
    for r in recipes:
        data.append({
            'calories': r.calories,
            'fat': r.fat,
            'protein': r.protein,
            'carbs': r.carbs,
            'likes': r.likes
        })

    return pd.DataFrame(data)

def get_similar_users_recipes(user):
    user_prefs = UserTastePreference.objects.filter(user=user).first()
    if not user_prefs:
        return Recipe.objects.none()
    
    similar_users_qs = UserTastePreference.objects.filter(diet=user_prefs.diet).exclude(user=user)
    
    for allergy in (user_prefs.allergies or "").split(','):
        allergy = allergy.strip()
        if allergy:
            similar_users_qs = similar_users_qs.exclude(allergies__icontains=allergy)
    
    for dislike in (user_prefs.dislikes or "").split(','):
        dislike = dislike.strip()
        if dislike:
            similar_users_qs = similar_users_qs.exclude(dislikes__icontains=dislike)
    
    similar_user_ids = [pref.user.id for pref in similar_users_qs]
    
    return Recipe.objects.filter(
        userrecipeinteraction__user_id__in=similar_user_ids
    ).distinct()

                    
def filter_recipes_by_preferences(user, recipes, tag=None):
    preferences = UserTastePreference.objects.filter(user=user).first()
    if not preferences:
        return recipes
    
    filtered_recipes = recipes
    
    # Filter by dislikes (real ingredient matching)
    if preferences.dislikes:
        for ingredient in preferences.dislikes.split(','):
            ingredient = ingredient.strip()
            if ingredient and ingredient.lower() != 'none':
                # More sophisticated ingredient matching
                ingredient_terms = ingredient.lower().split()
                for term in ingredient_terms:
                    if len(term) > 2:  # Only filter meaningful terms
                        filtered_recipes = filtered_recipes.exclude(ingredients__icontains=term)
    
    # Filter by allergies (real ingredient matching)
    if preferences.allergies:
        for allergy in preferences.allergies.split(','):
            allergy = allergy.strip()
            if allergy and allergy.lower() != 'none':
                # Map allergy names to common ingredient terms
                allergy_mapping = {
                    'lactose intolerance': ['milk', 'cheese', 'cream', 'butter', 'yogurt', 'lactose'],
                    'nut allergy': ['peanut', 'almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'nut'],
                    'gluten intolerance': ['wheat', 'gluten', 'barley', 'rye', 'flour'],
                    'shellfish allergy': ['shrimp', 'crab', 'lobster', 'oyster', 'clam', 'mussel', 'shellfish']
                }
                
                allergy_terms = allergy_mapping.get(allergy.lower(), [allergy.lower()])
                for term in allergy_terms:
                    filtered_recipes = filtered_recipes.exclude(ingredients__icontains=term)
    
    # Filter by diet (real tag matching)
    if preferences.diet and preferences.diet.lower() != 'none':
        diet_mapping = {
            'vegetarian': ['vegetarian', 'veggie'],
            'vegan': ['vegan'],
            'keto': ['keto', 'ketogenic', 'low-carb'],
            'gluten-free': ['gluten-free', 'gluten free']
        }
        
        diet_terms = diet_mapping.get(preferences.diet.lower(), [preferences.diet.lower()])
        diet_filter = Q()
        for term in diet_terms:
            diet_filter |= Q(tags__icontains=term) | Q(title__icontains=term)
        
        filtered_recipes = filtered_recipes.filter(diet_filter)
    
    # Filter by tag if provided
    if tag:
        filtered_recipes = filtered_recipes.filter(tags__icontains=tag.lower())
    
    return filtered_recipes

   