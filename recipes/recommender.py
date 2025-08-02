import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from django.db.models import Case, When
from .models import Recipe, UserRecipeInteraction

def get_user_interacted_recipes(user_id):
    """
    Fetch all recipes that the user has interacted with (liked, viewed, etc.).
    """
    interactions = UserRecipeInteraction.objects.filter(user_id=user_id)
    recipe_ids = interactions.values_list('recipe_id', flat=True).distinct()
    return Recipe.objects.filter(id__in=recipe_ids)

def content_based_recommendations(user_id, top_n=5):
    """
    Generate content-based recipe recommendations for a user.
    Uses TF-IDF on combined text of ingredients, tags, and title.
    """
    user_recipes = get_user_interacted_recipes(user_id)
    all_recipes = Recipe.objects.all()

    if not user_recipes.exists():
        # Cold start: return random recipes if user has no interactions
        return all_recipes.order_by('?')[:top_n]

    # Prepare data for TF-IDF vectorization
    data = []
    for recipe in all_recipes:
        combined = ' '.join([
            recipe.ingredients or 'no description',
            recipe.tags or '',
            recipe.title or ''
        ])
        data.append({'id': recipe.id, 'combined': combined})

    df = pd.DataFrame(data)

    # Vectorize combined recipe text
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(df['combined'])

    # Get indices of user's interacted recipes in the dataframe
    user_recipe_indices = [df.index[df['id'] == r.id][0] for r in user_recipes]

    # Build user profile by averaging TF-IDF vectors of interacted recipes
    user_profile = tfidf_matrix[user_recipe_indices].mean(axis=0)

    # Edge case: if user_profile is empty (all zeros), fallback to random recipes
    if user_profile.nnz == 0:
        return all_recipes.order_by('?')[:top_n]

    # Compute cosine similarity between user profile and all recipes
    cosine_sim = cosine_similarity(user_profile, tfidf_matrix).flatten()

    # Rank recipes by similarity, exclude already interacted recipes
    sorted_indices = cosine_sim.argsort()[::-1]
    user_interacted_ids = set(r.id for r in user_recipes)

    recommended_ids = []
    for idx in sorted_indices:
        rid = df.iloc[idx]['id']
        if rid not in user_interacted_ids:
            recommended_ids.append(rid)
        if len(recommended_ids) >= top_n:
            break

    # Preserve order of recommended_ids in queryset
    preserved = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(recommended_ids)])
    recommended_recipes = Recipe.objects.filter(id__in=recommended_ids).order_by(preserved)

    return recommended_recipes
