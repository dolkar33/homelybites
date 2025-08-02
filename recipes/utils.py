from .models import Recipe, UserRecipeInteraction
from django.db.models import Count, Q

def content_based_recommendation(user):
    liked_recipe_ids = list(UserRecipeInteraction.objects.filter(
        user=user,
        interaction_type='like'
    ).values_list('recipe', flat=True))

    if not liked_recipe_ids:
        return Recipe.objects.order_by('?')[:5]  # Fallback: random 5 recipes

    liked_recipes_qs = Recipe.objects.filter(id__in=liked_recipe_ids)
    tag_set = set()

    for recipe in liked_recipes_qs:
        if recipe.tags:
            tags = [t.strip().lower() for t in recipe.tags.split(',')]
            tag_set.update(tags)
        if recipe.ingredients:
            ingredients = [ing.strip().lower() for ing in recipe.ingredients.split(',')]
            tag_set.update(ingredients)

    if not tag_set:
        return Recipe.objects.order_by('?')[:5]  

    tag_filter = Q()
    for term in tag_set:
        tag_filter |= Q(tags__icontains=term) | Q(ingredients__icontains=term)

    recommended = Recipe.objects.filter(tag_filter).exclude(
        id__in=liked_recipe_ids
    ).annotate(
        num_likes=Count('userrecipeinteraction', filter=Q(userrecipeinteraction__interaction_type='like'))
    ).order_by('-num_likes')

    return recommended



def collaborative_recommendation(user):
    
    liked_recipes = list(UserRecipeInteraction.objects.filter(
        user=user,
        interaction_type='like'
    ).values_list('recipe', flat=True))

    similar_users = list(UserRecipeInteraction.objects.filter(
        recipe__in=liked_recipes,
        interaction_type='like'
    ).exclude(user=user).values_list('user', flat=True).distinct())

    recommended_recipe_ids = list(UserRecipeInteraction.objects.filter(
        user__in=similar_users,
        interaction_type='like'
    ).exclude(
        recipe__in=liked_recipes
    ).values_list('recipe', flat=True))

    recommended = Recipe.objects.filter(
        id__in=recommended_recipe_ids
    ).annotate(
        count_likes=Count('userrecipeinteraction', filter=Q(userrecipeinteraction__interaction_type='like'))
    ).order_by('-count_likes') 

    return recommended
