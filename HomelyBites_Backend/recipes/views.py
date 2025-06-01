from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Avg, Q
from django.contrib.auth.models import User
from rest_framework import viewsets, status, generics, filters, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny, IsAdminUser
from .models import Recipe, Category, UserProfile, UserRecipeInteraction
from .serializers import (
    RecipeSerializer, 
    RecipeListSerializer,
    CategorySerializer, 
    UserProfileSerializer, 
    UserRecipeInteractionSerializer,
    UserSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer
)
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

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

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create the user
        user = User.objects.create_user(
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
    """
    Import recipes from Spoonacular API.
    Query parameters:
    - query: Search term
    - number: Number of recipes to import (default: 10)
    - random: Set to 'true' to import random recipes
    - tags: Comma-separated tags for filtering random recipes
    """
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
    users = User.objects.all().values('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login')
    return Response(list(users))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommend_recipes(request):
    user_profile = UserProfile.objects.get(user=request.user)
    dietary_pref = user_profile.dietary_preference
    allergies = user_profile.allergies.split(',') if user_profile.allergies else []
    dislikes = user_profile.dislikes.split(',') if user_profile.dislikes else []

    # Filter recipes based on dietary preference
    recipes = Recipe.objects.all()
    if dietary_pref:
        recipes = recipes.filter(categories__name__icontains=dietary_pref)
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

