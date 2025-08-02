import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homely_bites.settings')

import django
django.setup()

from recipes.tests import evaluate_all_users
from django.contrib.auth.models import User
from recipes.models import UserRecipeInteraction, Recipe
from recipes.utils import content_based_recommendation, collaborative_recommendation

def get_true_interactions():
    true_interactions = {}

    users = User.objects.all()
    for user in users:
        interacted_recipes = UserRecipeInteraction.objects.filter(
            user=user,
            interaction_type__in=['like', 'save', 'favorite']
        ).values_list('recipe__spoonacular_id', flat=True).distinct()

        # Filter out empty or None IDs
        filtered_ids = [rid for rid in interacted_recipes if rid and rid.strip() != '']

        true_interactions[user.username] = filtered_ids

    return true_interactions



def get_model_predictions(model_func):
    predicted_recommendations = {}

    users = User.objects.all()
    for user in users:
        recs = model_func(user)
        rec_ids = [recipe.spoonacular_id for recipe in recs if recipe.spoonacular_id and recipe.spoonacular_id.strip() != '']
        predicted_recommendations[user.username] = rec_ids

    return predicted_recommendations


if __name__ == "__main__":
    true_interactions = get_true_interactions()
    print("True Interactions:", true_interactions)

    content_based_preds = get_model_predictions(content_based_recommendation)
    print("Content-Based Predictions:", content_based_preds)

    collaborative_preds = get_model_predictions(collaborative_recommendation)
    print("Collaborative Predictions:", collaborative_preds)

    hybrid_preds = {}
    for user in true_interactions.keys():
        content_recs = content_based_preds.get(user, [])[:5]
        collab_recs = collaborative_preds.get(user, [])
        collab_filtered = [r for r in collab_recs if r not in content_recs]
        hybrid_preds[user] = content_recs + collab_filtered[:5]

    print("\nContent-Based Model Metrics:")
    metrics_cb = evaluate_all_users(true_interactions, content_based_preds, k=5)
    for metric, value in metrics_cb.items():
        print(f"{metric}: {value:.4f}")

    print("\nCollaborative Filtering Model Metrics:")
    metrics_cf = evaluate_all_users(true_interactions, collaborative_preds, k=5)
    for metric, value in metrics_cf.items():
        print(f"{metric}: {value:.4f}")

    print("\nHybrid Model Metrics:")
    metrics_hybrid = evaluate_all_users(true_interactions, hybrid_preds, k=5)
    for metric, value in metrics_hybrid.items():
        print(f"{metric}: {value:.4f}")
