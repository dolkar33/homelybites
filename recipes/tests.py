from django.test import TestCase
from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from .models import Recipe, UserRecipeInteraction, Like
from .utils import content_based_recommendation, collaborative_recommendation
import numpy as np

class RecipeModelTests(TestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username='user1', password='pass123')
        self.user2 = User.objects.create_user(username='user2', password='pass123')
        
        # Create recipes with different tags
        self.recipe1 = Recipe.objects.create(
            title="Spaghetti Bolognese",
            spoonacular_id="spag123",
            tags="pasta, italian, dinner"
        )
        self.recipe2 = Recipe.objects.create(
            title="Chicken Curry",
            spoonacular_id="chick456",
            tags="spicy, indian, dinner"
        )
        self.recipe3 = Recipe.objects.create(
            title="Pancakes",
            spoonacular_id="panc789",
            tags="breakfast, sweet"
        )
    
    def test_recipe_creation(self):
        self.assertEqual(self.recipe1.title, "Spaghetti Bolognese")
        self.assertEqual(self.recipe2.spoonacular_id, "chick456")
        self.assertIn("indian", self.recipe2.tags)
    
    def test_user_recipe_interaction_creation(self):
        interaction = UserRecipeInteraction.objects.create(
            user=self.user1,
            recipe=self.recipe1,
            interaction_type='like'
        )
        self.assertEqual(interaction.interaction_type, 'like')
        self.assertEqual(interaction.user, self.user1)
        self.assertEqual(interaction.recipe, self.recipe1)
    
    def test_like_model_unique_constraint(self):
        like = Like.objects.create(user=self.user1, recipe=self.recipe1)
        self.assertTrue(Like.objects.filter(user=self.user1, recipe=self.recipe1).exists())
        # Trying to create duplicate Like raises IntegrityError
        with self.assertRaises(IntegrityError):
            Like.objects.create(user=self.user1, recipe=self.recipe1)


class RecommendationFunctionTests(TestCase):
    def setUp(self):
        # Users
        self.user1 = User.objects.create_user(username='user1', password='pass123')
        self.user2 = User.objects.create_user(username='user2', password='pass123')
        self.user3 = User.objects.create_user(username='user3', password='pass123')
        
        # Recipes
        self.recipe1 = Recipe.objects.create(title="Spaghetti Bolognese", spoonacular_id="spag123", tags="pasta, italian, dinner")
        self.recipe2 = Recipe.objects.create(title="Chicken Curry", spoonacular_id="chick456", tags="spicy, indian, dinner")
        self.recipe3 = Recipe.objects.create(title="Pancakes", spoonacular_id="panc789", tags="breakfast, sweet")
        self.recipe4 = Recipe.objects.create(title="Lasagna", spoonacular_id="lasa101", tags="pasta, italian, dinner")
        self.recipe5 = Recipe.objects.create(title="Tikka Masala", spoonacular_id="tika202", tags="spicy, indian, dinner")
        
        # User 1 likes recipe1 and recipe2
        UserRecipeInteraction.objects.create(user=self.user1, recipe=self.recipe1, interaction_type='like')
        UserRecipeInteraction.objects.create(user=self.user1, recipe=self.recipe2, interaction_type='like')
        
        # User 2 likes recipe1 and recipe4 (similar taste with user1)
        UserRecipeInteraction.objects.create(user=self.user2, recipe=self.recipe1, interaction_type='like')
        UserRecipeInteraction.objects.create(user=self.user2, recipe=self.recipe4, interaction_type='like')
        
        # User 3 likes recipe3 and recipe5 (different taste)
        UserRecipeInteraction.objects.create(user=self.user3, recipe=self.recipe3, interaction_type='like')
        UserRecipeInteraction.objects.create(user=self.user3, recipe=self.recipe5, interaction_type='like')
    
    def test_content_based_recommendation(self):
        recs = content_based_recommendation(self.user1)
        # User1 liked pasta and spicy tags from recipe1 and recipe2
        # So recommended recipes should include recipe4 (pasta, italian, dinner)
        self.assertIn(self.recipe4, recs)
        # Should not include recipes user already liked
        self.assertNotIn(self.recipe1, recs)
        self.assertNotIn(self.recipe2, recs)
    
    def test_collaborative_recommendation(self):
        recs = collaborative_recommendation(self.user1)
        # User2 is similar user, liked recipe4 in addition to user1's liked recipe1
        # So recipe4 should be recommended
        self.assertIn(self.recipe4, recs)
        # Should not include recipes user already liked
        self.assertNotIn(self.recipe1, recs)
        self.assertNotIn(self.recipe2, recs)
        # Should not include recipe3 or recipe5 (liked by user3, not similar)
        self.assertNotIn(self.recipe3, recs)
        self.assertNotIn(self.recipe5, recs)

    import numpy as np

def evaluate_all_users(true_interactions, predicted_interactions, k=5):
    precision_list = []
    recall_list = []
    f1_list = []
    accuracy_list = []

    for user_id, true_items in true_interactions.items():
        predicted_items = predicted_interactions.get(user_id, [])[:k]

        true_set = set(true_items)
        predicted_set = set(predicted_items)

        tp = len(true_set & predicted_set)
        fp = len(predicted_set - true_set)
        fn = len(true_set - predicted_set)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        accuracy = tp / k if k > 0 else 0

        precision_list.append(precision)
        recall_list.append(recall)
        f1_list.append(f1)
        accuracy_list.append(accuracy)

    return {
        'Precision': np.mean(precision_list),
        'Recall': np.mean(recall_list),
        'F1': np.mean(f1_list),
        'Accuracy': np.mean(accuracy_list)
    }
