from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from recipes.models import Recipe
from recipes.user_models import UserTastePreference
from recipes.utils import get_content_based_recommendations
from django.db import transaction

class Command(BaseCommand):
    help = 'Tests the recipe recommendation engine with a controlled dataset.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('--- Starting Recommendation Engine Test ---'))

        # --- 1. Setup: Create a clean test environment ---
        self.stdout.write('Step 1: Setting up clean test environment...')
        test_username = 'test_reco_user'
        User.objects.filter(username=test_username).delete()
        Recipe.objects.filter(title__icontains='Test Recipe').delete()

        user = User.objects.create_user(username=test_username, password='password')

        # --- 2. Create Sample Recipes ---
        self.stdout.write('Step 2: Creating sample recipes...')
        recipes_data = [
            {'title': 'Test Recipe: Veggie Pasta', 'tags': 'vegetarian, italian, pasta', 'ingredients': 'pasta, tomato, basil, cheese'},
            {'title': 'Test Recipe: Lemon Herb Chicken', 'tags': 'chicken, healthy, lemon', 'ingredients': 'chicken, lemon, rosemary, garlic'},
            {'title': 'Test Recipe: Grilled Salmon', 'tags': 'fish, healthy, quick', 'ingredients': 'salmon, asparagus, olive oil, dill'},
            {'title': 'Test Recipe: Spicy Tofu Stir-fry', 'tags': 'vegetarian, vegan, spicy, asian', 'ingredients': 'tofu, soy sauce, chili, broccoli, rice'},
            {'title': 'Test Recipe: Beef Tacos', 'tags': 'mexican, beef, spicy', 'ingredients': 'beef, tortilla, salsa, cheese, lettuce'}
        ]

        for data in recipes_data:
            Recipe.objects.create(**data)
        self.stdout.write(self.style.SUCCESS(f'   ...created {len(recipes_data)} recipes.'))

        # --- 3. Define User's Taste Profile ---
        self.stdout.write("Step 3: Defining user's taste profile...")
        user_prefs = {
            'dietary_preferences': 'vegetarian,vegan',
            'allergies': 'nuts',
            'dislikes': 'fish,beef'
        }
        UserTastePreference.objects.create(user=user, **user_prefs)
        self.stdout.write(self.style.SUCCESS('   ...profile created.'))
        self.stdout.write(self.style.HTTP_INFO(f"   - Preferences: {user_prefs['dietary_preferences']}"))
        self.stdout.write(self.style.HTTP_INFO(f"   - Dislikes: {user_prefs['dislikes']}"))

        # --- 4. Run Recommendation Engine ---
        self.stdout.write('Step 4: Running recommendation engine...')
        recommendations = get_content_based_recommendations(user)
        self.stdout.write(self.style.SUCCESS('   ...engine finished.'))

        # --- 5. Display Results ---
        self.stdout.write('\n--- Test Results ---')
        self.stdout.write(self.style.SUCCESS('Based on the user profile, the following recipes were recommended:'))
        if recommendations.exists():
            for recipe in recommendations:
                self.stdout.write(f'  - {recipe.title}')
        else:
            self.stdout.write(self.style.WARNING('No recommendations were returned.'))

        self.stdout.write('\n--- Verification ---')
        self.stdout.write('Expected behavior: Should recommend VEGETARIAN/VEGAN dishes.')
        self.stdout.write('Expected behavior: Should NOT recommend dishes with FISH or BEEF.')
        self.stdout.write(self.style.SUCCESS('Please verify if the output above matches the expected behavior.'))

        # --- Cleanup ---
        self.stdout.write('\n--- Cleaning up test data ---')
        User.objects.filter(username=test_username).delete()
        Recipe.objects.filter(title__icontains='Test Recipe').delete()
        self.stdout.write(self.style.SUCCESS('Test complete.'))
