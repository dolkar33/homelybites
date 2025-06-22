from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Avg, Q
from django.contrib.auth.models import User
from rest_framework import viewsets, status, generics, filters, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny, IsAdminUser
from django.utils import timezone
from .models import Recipe, Category, UserProfile, UserRecipeInteraction, CustomUser
from .serializers import (
    RecipeSerializer, 
    RecipeListSerializer,
    CategorySerializer, 
    UserProfileSerializer,
    UserRecipeInteractionSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    PasswordChangeSerializer
)
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import requests
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth import get_user_model

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'ingredients']
    ordering_fields = ['created_at', 'title', 'prep_time', 'cook_time']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RecipeListSerializer
        return RecipeSerializer
    
    def get_queryset(self):
        queryset = Recipe.objects.all()
        
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(categories__slug=category)
            
        # Filter by difficulty if provided
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
            
        # Filter by max preparation time if provided
        max_prep_time = self.request.query_params.get('max_prep_time', None)
        if max_prep_time:
            queryset = queryset.filter(prep_time__lte=int(max_prep_time))
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        Get personalized recipe recommendations for the authenticated user.
        For non-authenticated users, return popular recipes.
        """
        if request.user.is_authenticated:
            # Get user's favorite categories
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                favorite_categories = user_profile.favorite_categories.all()
                
                # Get recipes from user's favorite categories
                recommended_recipes = Recipe.objects.filter(
                    categories__in=favorite_categories
                ).distinct()
                
                # If we have less than 5 recommendations, add popular recipes
                if recommended_recipes.count() < 5:
                    popular_recipes = Recipe.objects.annotate(
                        interaction_count=Count('user_interactions')
                    ).order_by('-interaction_count')
                    
                    # Combine the two querysets without duplicates
                    recommended_recipes = (recommended_recipes | popular_recipes).distinct()[:10]
                else:
                    recommended_recipes = recommended_recipes[:10]
                    
            except UserProfile.DoesNotExist:
                # If user profile doesn't exist, return popular recipes
                recommended_recipes = Recipe.objects.annotate(
                    interaction_count=Count('user_interactions')
                ).order_by('-interaction_count')[:10]
        else:
            # For non-authenticated users, return popular recipes
            recommended_recipes = Recipe.objects.annotate(
                interaction_count=Count('user_interactions')
            ).order_by('-interaction_count')[:10]
            
        serializer = RecipeListSerializer(recommended_recipes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular recipes based on user interactions."""
        popular_recipes = Recipe.objects.annotate(
            interaction_count=Count('user_interactions')
        ).order_by('-interaction_count')[:10]
        
        serializer = RecipeListSerializer(popular_recipes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get recipes by category."""
        category_slug = request.query_params.get('slug', None)
        if not category_slug:
            return Response(
                {"error": "Category slug parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        category = get_object_or_404(Category, slug=category_slug)
        recipes = Recipe.objects.filter(categories=category)
        
        serializer = RecipeListSerializer(recipes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def interact(self, request, slug=None):
        """Record a user interaction with a recipe (view, save, rate)."""
        recipe = self.get_object()
        interaction_type = request.data.get('interaction_type')
        rating = request.data.get('rating', None)
        
        if interaction_type not in [choice[0] for choice in UserRecipeInteraction.INTERACTION_TYPES]:
            return Response(
                {"error": "Invalid interaction type"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # If rating is provided, validate it
        if rating is not None:
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    return Response(
                        {"error": "Rating must be between 1 and 5"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {"error": "Rating must be an integer"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create or update the interaction
        interaction, created = UserRecipeInteraction.objects.update_or_create(
            user=request.user,
            recipe=recipe,
            interaction_type=interaction_type,
            defaults={'rating': rating}
        )
        
        serializer = UserRecipeInteractionSerializer(interaction)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get the profile of the authenticated user."""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_favorites(self, request):
        """Update the user's favorite categories."""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        category_ids = request.data.get('category_ids', [])
        if not isinstance(category_ids, list):
            return Response(
                {"error": "category_ids must be a list"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Clear existing favorites and add new ones
        profile.favorite_categories.clear()
        for category_id in category_ids:
            try:
                category = Category.objects.get(id=category_id)
                profile.favorite_categories.add(category)
            except Category.DoesNotExist:
                pass
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def update_profile_image(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        if 'profile_image' not in request.FILES:
            return Response(
                {"error": "No image file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = UserProfileSerializer(profile, data={'profile_image': request.FILES['profile_image']}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserRegistrationView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the user
        user = CustomUser.objects.create_user(
            username=serializer.validated_data['username'],
            email=serializer.validated_data.get('email', ''),
            password=request.data.get('password'),
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', '')
        )
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return Response(
            {"message": "User registered successfully"},
            status=status.HTTP_201_CREATED
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def import_from_spoonacular(request):
    
    service = SpoonacularService()
    number = int(request.query_params.get('number', 10))
    
    if request.query_params.get('random', '').lower() == 'true':
        tags = request.query_params.get('tags', '').split(',') if request.query_params.get('tags') else None
        result = service.import_random_recipes(number=number, tags=tags)
        
        if isinstance(result, list):
            return Response({
                'message': f'Successfully imported {len(result)} random recipes',
                'count': len(result),
                'recipes': [{'id': r.id, 'title': r.title} for r in result]
            })
        else:
            return Response(result, status=400)
    else:
        query = request.query_params.get('query', '')
        if not query:
            return Response({'error': 'Query parameter is required for search'}, status=400)
            
        results = service.search_recipes(query=query, number=number)
        
        if 'results' in results:
            imported_recipes = []
            for recipe_data in results['results']:
                recipe = service.import_recipe_to_db(recipe_data)
                imported_recipes.append(recipe)
                
            return Response({
                'message': f'Successfully imported {len(imported_recipes)} recipes',
                'count': len(imported_recipes),
                'recipes': [{'id': r.id, 'title': r.title} for r in imported_recipes]
            })
        else:
            return Response(results, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user."""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login a user and return JWT tokens."""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        if user:
            refresh = RefreshToken.for_user(user)
            profile = user.profile
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'has_completed_questions': profile.has_completed_questions
                },
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Login successful'
            })
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def homepage(request):
    """Render the homepage."""
    return render(request, 'homepage.html')

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users(request):
    """List all users (admin only)."""
    users = CustomUser.objects.all().values('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login')
    return Response(list(users))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommend_recipes(request):
    user_profile = UserProfile.objects.get(user=request.user)
    dietary_prefs = user_profile.dietary_preference.split(',') if user_profile.dietary_preference else []
    allergies = user_profile.allergies.split(',') if user_profile.allergies else []
    dislikes = user_profile.dislikes.split(',') if user_profile.dislikes else []

    # Filter recipes based on dietary preferences
    recipes = Recipe.objects.all()
    if dietary_prefs:
        # Create a Q object for each dietary preference
        dietary_query = Q()
        for pref in dietary_prefs:
            dietary_query |= Q(categories__name__icontains=pref.strip())
        recipes = recipes.filter(dietary_query).distinct()
    
    # Exclude recipes with ingredients the user is allergic to or dislikes
    for allergy in allergies:
        recipes = recipes.exclude(ingredients__icontains=allergy.strip())
    for dislike in dislikes:
        recipes = recipes.exclude(ingredients__icontains=dislike.strip())

    recipes = recipes.distinct()
    serializer = RecipeListSerializer(recipes, many=True)
    return Response(serializer.data)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    user_profile, created = UserProfile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        serializer = UserProfileSerializer(user_profile)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(user_profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_recipes(request):
    # Get the search query from user
    search_query = request.GET.get('q', '').strip()
    
    # Get time and calorie filters
    max_cooking_time = request.GET.get('max_time')  # in minutes
    min_calories = request.GET.get('min_calories')
    max_calories = request.GET.get('max_calories')
    
    # Get user preferences if authenticated
    user_preferences = {}
    if request.user.is_authenticated:
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            user_preferences = {
                'dietary_preference': user_profile.dietary_preference,
                'allergies': user_profile.allergies.split(',') if user_profile.allergies else [],
                'dislikes': user_profile.dislikes.split(',') if user_profile.dislikes else [],
                'favorite_categories': [cat.name for cat in user_profile.favorite_categories.all()]
            }
        except UserProfile.DoesNotExist:
            pass
    print("User dietary preference:", user_preferences.get('dietary_preference'))
    print("User allergies:", user_preferences.get('allergies'))
    print("User dislikes:", user_preferences.get('dislikes'))

    # Build Spoonacular API query
    api_key = settings.SPOONACULAR_API_KEY
    endpoint = "https://api.spoonacular.com/recipes/complexSearch"
    params = {
        "apiKey": api_key,
        "number": 20,
        "addRecipeInformation": True,
        "fillIngredients": True,
        "instructionsRequired": True,
        "addRecipeNutrition": True,
    }
    
    # If user provided a search query, use it
    if search_query:
        if ',' in search_query:
            params['includeIngredients'] = search_query.lower()
            params['sort'] = 'max-used-ingredients'
        else:
            params["query"] = search_query.lower()
    
    # Add time and calorie filters
    if max_cooking_time:
        params["maxReadyTime"] = max_cooking_time
    if min_calories:
        params["minCalories"] = min_calories
    if max_calories:
        params["maxCalories"] = max_calories
    
    # Add user preferences to search parameters if available
    if user_preferences:
        if user_preferences['dietary_preference']:
            params["diet"] = user_preferences['dietary_preference']
        if user_preferences['allergies']:
            params["intolerances"] = ",".join(user_preferences['allergies'])
        if user_preferences['favorite_categories']:
            params["cuisine"] = ",".join(user_preferences['favorite_categories'])

    # Call Spoonacular API
    response = requests.get(endpoint, params=params)
    dietary_fallback = False

    def process_results(data):
        filtered_results = []
        calories_list = []
        for recipe in data.get('results', []):
            # Strictly filter by dietary preference if set
            if user_preferences.get('dietary_preference') and not dietary_fallback:
                if user_preferences['dietary_preference'].lower() not in [d.lower() for d in recipe.get('diets', [])]:
                    continue
            # Format recipe timing information
            recipe['timing'] = {
                'prep_time': f"{recipe.get('preparationMinutes', 0)} Minutes",
                'cook_time': f"{recipe.get('cookingMinutes', 0)} Minutes",
                'total_time': f"{recipe.get('readyInMinutes', 0)} Minutes",
                'servings': f"{recipe.get('servings', 0)} Servings"
            }
            # Format nutrition information
            calories = None
            if 'nutrition' in recipe:
                nutrition = recipe['nutrition']
                calories = next((n['amount'] for n in nutrition.get('nutrients', []) if n['name'] == 'Calories'), 0)
                recipe['nutrition_summary'] = {
                    'calories': calories,
                    'protein': next((n['amount'] for n in nutrition.get('nutrients', []) if n['name'] == 'Protein'), 0),
                    'carbs': next((n['amount'] for n in nutrition.get('nutrients', []) if n['name'] == 'Carbohydrates'), 0),
                    'fat': next((n['amount'] for n in nutrition.get('nutrients', []) if n['name'] == 'Fat'), 0)
                }
            if calories is not None:
                calories_list.append(calories)
            # Format ingredients in a clear list
            if 'extendedIngredients' in recipe:
                recipe['ingredients'] = [
                    {
                        'name': ing['name'],
                        'amount': ing['amount'],
                        'unit': ing['unit'],
                        'original': ing['original'],
                        'formatted': f"{ing['amount']} {ing['unit']} {ing['name']}"
                    }
                    for ing in recipe['extendedIngredients']
                ]
            # Format instructions into clear steps
            if 'analyzedInstructions' in recipe and recipe['analyzedInstructions']:
                steps = recipe['analyzedInstructions'][0].get('steps', [])
                recipe['instructions'] = [
                    {
                        'step': step['number'],
                        'instruction': step['step'],
                        'ingredients': [ing['name'] for ing in step.get('ingredients', [])],
                        'equipment': [eq['name'] for eq in step.get('equipment', [])]
                    }
                    for step in steps
                ]
            # Add recipe metadata
            recipe['metadata'] = {
                'title': recipe.get('title', ''),
                'image': recipe.get('image', ''),
                'description': recipe.get('summary', ''),
                'cuisines': recipe.get('cuisines', []),
                'dishTypes': recipe.get('dishTypes', []),
                'diets': recipe.get('diets', []),
                'occasions': recipe.get('occasions', []),
                'source': {
                    'name': recipe.get('sourceName', ''),
                    'url': recipe.get('sourceUrl', '')
                }
            }
            filtered_results.append(recipe)
        min_calories = min(calories_list) if calories_list else None
        max_calories = max(calories_list) if calories_list else None
        return filtered_results, min_calories, max_calories

    if response.status_code == 200:
        data = response.json()
        filtered_results, min_calories, max_calories = process_results(data)
        # If no results and dietary preference was set, try fallback
        if not filtered_results and user_preferences.get('dietary_preference'):
            dietary_fallback = True
            params.pop('diet', None)
            response2 = requests.get(endpoint, params=params)
            if response2.status_code == 200:
                data2 = response2.json()
                filtered_results, min_calories, max_calories = process_results(data2)
                return Response({
                    'results': filtered_results,
                    'min_calories': min_calories,
                    'max_calories': max_calories,
                    'dietary_fallback': True,
                    'message': 'No recipes found matching your dietary preference. Showing all results instead.'
                })
        return Response({
            'results': filtered_results,
            'min_calories': min_calories,
            'max_calories': max_calories,
            'dietary_fallback': False
        })
    else:
        return Response({"error": "Failed to fetch recipes from Spoonacular"}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = CustomUser.objects.filter(email=email).first()
            if not user:
                return Response({'message': 'If an account exists with this email, you will receive a password reset link.'})
            
            # Generate a random token
            token = default_token_generator.make_token(user)
            
            # Store the token in the user model
            user.password_reset_token = token
            user.save()
            
            # Create reset link
            reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            
            # Send email
            send_mail(
                'Password Reset Request',
                f'Click the following link to reset your password: {reset_link}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'Password reset email has been sent.'})
        except CustomUser.DoesNotExist:
            return Response({'message': 'If an account exists with this email, you will receive a password reset link.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        try:
            # Get the token from the request data
            token = serializer.validated_data['token']
            
            # Find the user by the token
            user = CustomUser.objects.get(password_reset_token=token)
            
            # Set the new password
            user.set_password(serializer.validated_data['password'])
            user.password_reset_token = None  # Clear the token
            user.save()
            
            return Response({'message': 'Password has been reset successfully.'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_user_questions(request):
    profile = request.user.profile
    data = request.data
    
    # Save dietary preferences (store as comma-separated string)
    if 'dietary' in data and data['dietary']:
        # Convert to lowercase and join with commas
        preferences = [p.strip().lower() for p in data['dietary']]
        profile.dietary_preference = ','.join(preferences)
    
    # Save allergies
    if 'allergies' in data:
        profile.allergies = ','.join(data['allergies']) if isinstance(data['allergies'], list) else data['allergies']
    
    # Save dislikes
    if 'dislikes' in data:
        profile.dislikes = ','.join(data['dislikes']) if isinstance(data['dislikes'], list) else data['dislikes']
    
    profile.has_completed_questions = True
    profile.save()
    
    return Response({
        'message': 'Questions completed! User profile updated.',
        'dietary_preferences': profile.dietary_preference.split(',') if profile.dietary_preference else [],
        'allergies': profile.allergies.split(',') if profile.allergies else [],
        'dislikes': profile.dislikes.split(',') if profile.dislikes else []
    })

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update user profile information."""
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    try:
        # Update user information with validation
        if 'first_name' in request.data:
            if not request.data['first_name'].strip():
                return Response({'error': 'First name cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            user.first_name = request.data['first_name'].strip()
            
        if 'last_name' in request.data:
            if not request.data['last_name'].strip():
                return Response({'error': 'Last name cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            user.last_name = request.data['last_name'].strip()
            
        if 'email' in request.data:
            email = request.data['email'].strip()
            if not email:
                return Response({'error': 'Email cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            if CustomUser.objects.exclude(id=user.id).filter(email=email).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email
            
        user.save()
        
        # Update profile information with validation
        if 'dietary_preference' in request.data:
            profile.dietary_preference = request.data['dietary_preference'].strip()
            
        if 'allergies' in request.data:
            profile.allergies = request.data['allergies'].strip()
            
        if 'dislikes' in request.data:
            profile.dislikes = request.data['dislikes'].strip()
            
        if 'profile_image' in request.FILES:
            # Validate image file
            image = request.FILES['profile_image']
            if image.size > 5 * 1024 * 1024:  # 5MB limit
                return Response({'error': 'Image size must be less than 5MB'}, status=status.HTTP_400_BAD_REQUEST)
            if not image.content_type.startswith('image/'):
                return Response({'error': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)
            profile.profile_image = image
            
        profile.save()
        
        # Log the update
        print(f"Profile updated for user {user.username} at {timezone.now()}")
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'profile': {
                'dietary_preference': profile.dietary_preference,
                'allergies': profile.allergies,
                'dislikes': profile.dislikes,
                'profile_image': profile.profile_image.url if profile.profile_image else None
            },
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        print(f"Error updating profile for user {user.username}: {str(e)}")
        return Response(
            {'error': 'An error occurred while updating the profile'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password."""
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        
        # Check if old password is correct
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

