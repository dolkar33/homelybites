from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Avg, Q

from rest_framework import viewsets, status, generics, filters, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny, IsAdminUser
from .services import SpoonacularService

# Spoonacular-compatible intolerance keys and mapper (keeps CSV model intact)
SPOONACULAR_ALLERGY_SLUGS = {
    'dairy', 'egg', 'gluten', 'grain', 'peanut', 'seafood', 'sesame', 'shellfish', 'soy', 'sulfite', 'tree nut', 'wheat'
}

# Conservative keyword map for common allergens (err on side of caution)
ALLERGEN_KEYWORDS = {
    'peanut': ['peanut', 'peanuts', 'peanut butter', 'groundnut', 'ground nut', 'ground nuts'],
    'tree nut': ['almond', 'walnut', 'cashew', 'hazelnut', 'pistachio', 'pecan', 'macadamia', 'brazil nut', 'pine nut', 'tree nut', 'nut'],
    'dairy': ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'ghee', 'paneer', 'curd', 'whey', 'casein','mozzarella'],
    'egg': ['egg', 'eggs', 'albumen', 'mayonnaise', 'mayo', 'omelet', 'omelette', 'scrambled egg', 'fried egg', 'boiled egg'],
    'gluten': ['gluten', 'wheat', 'barley', 'rye', 'farina', 'spelt', 'semolina', 'malt'],
    'grain': ['grain', 'grains', 'millet', 'sorghum', 'oats', 'corn', 'maize', 'rice bran'],
    'seafood': ['seafood', 'fish', 'anchovy', 'salmon', 'tuna', 'mackerel', 'cod', 'sardine', 'trout', 'prawn', 'shrimp', 'crab', 'lobster'],
    'shellfish': ['shellfish', 'shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'clam', 'oyster', 'mussel'],
    'sesame': ['sesame', 'tahini'],
    'soy': ['soy', 'soya', 'soybean', 'soy sauce', 'edamame', 'tofu', 'tempeh', 'miso'],
    'sulfite': ['sulfite', 'sulphite'],
    'wheat': ['wheat', 'atta', 'semolina', 'durum', 'spelt']
}

# Conservative keyword map for dietary preferences (exclude recipes containing these)
DIETARY_KEYWORDS = {
    # Vegan: exclude all animal products
    'vegan': [
        # meats
        'chicken','beef','pork','lamb','mutton','turkey','bacon','ham','sausage','meat',
        # fish/seafood
        'fish','salmon','tuna','mackerel','cod','sardine','anchovy','shrimp','prawn','crab','lobster','shellfish','oyster','clam','mussel',
        # dairy/eggs/honey
        'milk','cheese','butter','cream','yogurt','ghee','paneer','whey','casein','egg','eggs','mayonnaise','mayo','honey'
    ],
    # Vegetarian: exclude meat and fish/seafood, allow dairy/eggs
    'vegetarian': [
        'chicken','beef','pork','lamb','mutton','turkey','bacon','ham','sausage','meat',
        'fish','salmon','tuna','mackerel','cod','sardine','anchovy','shrimp','prawn','crab','lobster','shellfish','oyster','clam','mussel'
    ],
    
    # Gluten-free: overlaps with allergy keywords
    'gluten-free': ['gluten','wheat','barley','rye','farina','spelt','semolina','malt','durum','atta'],
    
    # Keto: exclude high-carb staples conservatively
    'keto': ['sugar','honey','rice','bread','pasta','noodle','noodles','potato','corn','maize','oats'],
    
}

def _map_allergy_to_slug(token: str):
    if not token:
        return None
    t = str(token).strip().lower()
    if t in SPOONACULAR_ALLERGY_SLUGS:
        return t
    # Map common phrases/variants to canonical slugs
    if 'peanut' in t or 'groundnut' in t or 'ground nut' in t:
        return 'peanut'
    if 'tree nut' in t or (('nut' in t) and ('peanut' not in t)) or any(n in t for n in ['almond','walnut','cashew','hazelnut','pistachio','pecan','macadamia','brazil nut','pine nut']):
        return 'tree nut'
    if 'shellfish' in t or any(x in t for x in ['shrimp','prawn','crab','lobster','scallop','clam','oyster','mussel']):
        return 'shellfish'
    if 'seafood' in t or any(x in t for x in ['fish','anchovy','salmon','tuna','mackerel','cod','sardine','trout']):
        return 'seafood'
    if 'milk' in t or 'dairy' in t or any(x in t for x in ['cheese','yogurt','butter','cream','whey','casein','ghee','paneer','curd']):
        return 'dairy'
    if 'egg' in t or any(x in t for x in ['albumen','mayonnaise','mayo','omelet','omelette','scrambled egg','fried egg','boiled egg']):
        return 'egg'
    if 'gluten' in t or any(x in t for x in ['barley','rye','farina','spelt','semolina','malt']):
        return 'gluten'
    if 'grain' in t or any(x in t for x in ['millet','sorghum','oats','corn','maize','rice bran']):
        return 'grain'
    if 'sesame' in t or 'tahini' in t:
        return 'sesame'
    if 'soy' in t or 'soya' in t or any(x in t for x in ['soybean','soy sauce','edamame','tofu','tempeh','miso']):
        return 'soy'
    if 'sulfite' in t or 'sulphite' in t:
        return 'sulfite'
    if 'wheat' in t or 'durum' in t or 'atta' in t:
        return 'wheat'
    return None

def _get_user_allergy_slugs(user):
    """Return a set of normalized allergy slugs for an authenticated user."""
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        return set()
    if not profile.allergies:
        return set()
    slugs = set()
    for a in str(profile.allergies).split(','):
        slug = _map_allergy_to_slug(a)
        if slug:
            slugs.add(slug)
    return slugs

def _filter_recipes_by_allergies(qs, user, allergy_filter_toggle: bool = True):
    """
    Given a Recipe queryset, exclude recipes that contain any ingredient keyword
    matching the authenticated user's allergy slugs. Returns (filtered_qs, counts_dict).
    """
    if not allergy_filter_toggle or not user or not user.is_authenticated:
        return qs, {"original": qs.count(), "safe": qs.count(), "filtered_out": 0}
    slugs = _get_user_allergy_slugs(user)
    if not slugs:
        return qs, {"original": qs.count(), "safe": qs.count(), "filtered_out": 0}
    keywords = []
    for s in slugs:
        keywords.extend(ALLERGEN_KEYWORDS.get(s, [s]))
    # Build OR query of all keywords, then exclude
    original_count = qs.count()
    if keywords:
        or_q = Q()
        for kw in set(k.strip().lower() for k in keywords if k):
            # Check ingredients, title, and instructions to be conservative
            or_q |= Q(ingredients__icontains=kw) | Q(title__icontains=kw) | Q(instructions__icontains=kw)
        qs = qs.exclude(or_q)
    safe_count = qs.count()
    return qs, {"original": original_count, "safe": safe_count, "filtered_out": max(original_count - safe_count, 0)}

def _get_user_diet_slugs(user):
    """Return normalized diet slugs from `UserProfile.dietary_preference` (comma-separated)."""
    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        return []
    if not profile.dietary_preference:
        return []
    raw = [p.strip().lower() for p in str(profile.dietary_preference).split(',') if p and str(p).strip()]
    # Normalize common variants
    norm = []
    for d in raw:
        if d in ('vegan','vegetarian','pescatarian','gluten-free','dairy-free','keto','paleo'):
            norm.append(d)
        elif d == 'gluten free':
            norm.append('gluten-free')
        elif d == 'dairy free':
            norm.append('dairy-free')
    # Deduplicate while preserving order
    seen = set()
    result = []
    for d in norm:
        if d not in seen:
            seen.add(d)
            result.append(d)
    return result

def _filter_recipes_by_diet(qs, user, diet_filter_toggle: bool = True):
    """Exclude recipes that violate the user's dietary preferences."""
    if not diet_filter_toggle or not user or not user.is_authenticated:
        return qs, {"original": qs.count(), "safe": qs.count(), "filtered_out": 0}
    diets = _get_user_diet_slugs(user)
    if not diets:
        return qs, {"original": qs.count(), "safe": qs.count(), "filtered_out": 0}
    keywords = []
    for d in diets:
        keywords.extend(DIETARY_KEYWORDS.get(d, []))
    original_count = qs.count()
    if keywords:
        or_q = Q()
        for kw in set(k.strip().lower() for k in keywords if k):
            or_q |= Q(ingredients__icontains=kw) | Q(title__icontains=kw) | Q(instructions__icontains=kw)
        qs = qs.exclude(or_q)
    safe_count = qs.count()
    return qs, {"original": original_count, "safe": safe_count, "filtered_out": max(original_count - safe_count, 0)}

@api_view(['POST'])
@permission_classes([IsAdminUser])
def import_cuisines_from_spoonacular(request):
    """
    Fetch recipes from Spoonacular and import unique cuisines.
    """
    service = SpoonacularService()
    number = int(request.data.get('number', 50))
    # Fetch random recipes (or use search)
    result = service.search_recipes(number=number)
    recipes = result.get('results', [])
    cuisines_added = service.import_cuisines_from_recipes(recipes)
    return Response({
        "added": cuisines_added,
        "count": len(cuisines_added)
    })

from django.utils import timezone
from .models import Recipe, Category, UserProfile, UserRecipeInteraction, CustomUser, ContactMessage, Cuisine
from .serializers import (
    RecipeSerializer, 
    RecipeListSerializer,
    CategorySerializer, 
    UserProfileSerializer,
    UserRecipeInteractionSerializer,
    UserSerializer,
    ContactMessageSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    PasswordChangeSerializer,
    CuisineSerializer
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

class CuisineViewSet(viewsets.ModelViewSet):
    queryset = Cuisine.objects.all()
    serializer_class = CuisineSerializer
    lookup_field = 'slug'

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
    _allergy_counts = None
    _diet_counts = None
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RecipeListSerializer
        return RecipeSerializer
    
    def get_queryset(self):
        queryset = Recipe.objects.all()
        
        # Filter by category if provided (accept slug or display name, case-insensitive)
        category_param = self.request.query_params.get('category', None)
        if category_param:
            normalized = category_param.strip().lower().replace(' ', '-')
            queryset = queryset.filter(
                Q(categories__slug=normalized) | Q(categories__name__iexact=category_param.strip())
            )
            
        # Filter by difficulty if provided
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
            
        # Filter by max preparation time if provided
        max_prep_time = self.request.query_params.get('max_prep_time', None)
        if max_prep_time:
            queryset = queryset.filter(prep_time__lte=int(max_prep_time))
        
        # Filter by cuisine if provided (accept slug or name)
        cuisine_param = self.request.query_params.get('cuisine', None)
        if cuisine_param:
            cuisine_norm = cuisine_param.strip().lower().replace(' ', '-')
            queryset = queryset.filter(
                Q(cuisines__slug=cuisine_norm) | Q(cuisines__name__iexact=cuisine_param.strip())
            )

        # Filter by calories if provided
        min_calories = self.request.query_params.get('min_calories', None)
        max_calories = self.request.query_params.get('max_calories', None)
        if min_calories is not None:
            queryset = queryset.filter(calories__isnull=False).extra(where=["CAST(calories as INTEGER) >= %s"], params=[int(min_calories)])
        if max_calories is not None:
            queryset = queryset.filter(calories__isnull=False).extra(where=["CAST(calories as INTEGER) <= %s"], params=[int(max_calories)])

        # Apply allergy filtering for authenticated users unless disabled
        try:
            toggle = self.request.query_params.get('allergy_filter', 'true').lower() not in ('false', '0', 'no')
        except Exception:
            toggle = True
        queryset, a_counts = _filter_recipes_by_allergies(queryset, self.request.user, toggle)
        # Apply diet filter
        try:
            diet_toggle = self.request.query_params.get('diet_filter', 'true').lower() not in ('false','0','no')
        except Exception:
            diet_toggle = True
        queryset, d_counts = _filter_recipes_by_diet(queryset, self.request.user, diet_toggle)
        # stash counts for list() to emit headers
        self._allergy_counts = a_counts
        self._diet_counts = d_counts
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        counts = getattr(self, '_allergy_counts', None)
        if counts:
            response["X-Allergy-Original"] = str(counts.get('original', 0))
            response["X-Allergy-Safe"] = str(counts.get('safe', 0))
            response["X-Allergy-Filtered"] = str(counts.get('filtered_out', 0))
        dcounts = getattr(self, '_diet_counts', None)
        if dcounts:
            response["X-Diet-Original"] = str(dcounts.get('original', 0))
            response["X-Diet-Safe"] = str(dcounts.get('safe', 0))
            response["X-Diet-Filtered"] = str(dcounts.get('filtered_out', 0))
        return response
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        Personalized recommendations. Respects query filters and pagination.
        - If explicit filters (e.g., category) are provided, use them via get_queryset().
        - Otherwise, for authenticated users, prioritize favorite categories; fall back to popular.
        - Uses DRF pagination instead of slicing.
        """
        # Start from filtered queryset to respect incoming filters (category, cuisine, etc.)
        base_qs = self.get_queryset()

        explicit_filter = any([
            request.query_params.get('category'),
            request.query_params.get('difficulty'),
            request.query_params.get('cuisine'),
            request.query_params.get('min_calories'),
            request.query_params.get('max_calories'),
            request.query_params.get('max_prep_time'),
        ])

        if explicit_filter:
            qs = base_qs.order_by('-created_at')
        else:
            if request.user.is_authenticated:
                try:
                    user_profile = UserProfile.objects.get(user=request.user)
                    favorite_categories = user_profile.favorite_categories.all()
                    qs = Recipe.objects.filter(categories__in=favorite_categories).distinct()
                    if qs.count() < 5:
                        popular = Recipe.objects.annotate(
                            interaction_count=Count('user_interactions')
                        ).order_by('-interaction_count')
                        qs = (qs | popular).distinct()
                except UserProfile.DoesNotExist:
                    qs = Recipe.objects.annotate(
                        interaction_count=Count('user_interactions')
                    ).order_by('-interaction_count')
            else:
                qs = Recipe.objects.annotate(
                    interaction_count=Count('user_interactions')
                ).order_by('-interaction_count')

        # Apply allergy filter before pagination
        toggle = request.query_params.get('allergy_filter', 'true').lower() not in ('false', '0', 'no')
        qs, a_counts = _filter_recipes_by_allergies(qs, request.user, toggle)
        diet_toggle = request.query_params.get('diet_filter', 'true').lower() not in ('false','0','no')
        qs, d_counts = _filter_recipes_by_diet(qs, request.user, diet_toggle)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = RecipeListSerializer(page, many=True)
            resp = self.get_paginated_response(serializer.data)
            resp["X-Allergy-Original"] = str(a_counts.get('original', 0))
            resp["X-Allergy-Safe"] = str(a_counts.get('safe', 0))
            resp["X-Allergy-Filtered"] = str(a_counts.get('filtered_out', 0))
            resp["X-Diet-Original"] = str(d_counts.get('original', 0))
            resp["X-Diet-Safe"] = str(d_counts.get('safe', 0))
            resp["X-Diet-Filtered"] = str(d_counts.get('filtered_out', 0))
            return resp

        serializer = RecipeListSerializer(qs, many=True)
        resp = Response(serializer.data)
        resp["X-Allergy-Original"] = str(a_counts.get('original', 0))
        resp["X-Allergy-Safe"] = str(a_counts.get('safe', 0))
        resp["X-Allergy-Filtered"] = str(a_counts.get('filtered_out', 0))
        resp["X-Diet-Original"] = str(d_counts.get('original', 0))
        resp["X-Diet-Safe"] = str(d_counts.get('safe', 0))
        resp["X-Diet-Filtered"] = str(d_counts.get('filtered_out', 0))
        return resp
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular recipes based on user interactions."""
        popular_recipes = Recipe.objects.annotate(
            interaction_count=Count('user_interactions')
        ).order_by('-interaction_count')
        # Apply allergy filtering and then limit
        toggle = request.query_params.get('allergy_filter', 'true').lower() not in ('false', '0', 'no')
        filtered_qs, a_counts = _filter_recipes_by_allergies(popular_recipes, request.user, toggle)
        diet_toggle = request.query_params.get('diet_filter', 'true').lower() not in ('false','0','no')
        filtered_qs, d_counts = _filter_recipes_by_diet(filtered_qs, request.user, diet_toggle)
        filtered_qs = filtered_qs[:10]
        serializer = RecipeListSerializer(filtered_qs, many=True)
        resp = Response(serializer.data)
        resp["X-Allergy-Original"] = str(a_counts.get('original', 0))
        resp["X-Allergy-Safe"] = str(a_counts.get('safe', 0))
        resp["X-Allergy-Filtered"] = str(a_counts.get('filtered_out', 0))
        resp["X-Diet-Original"] = str(d_counts.get('original', 0))
        resp["X-Diet-Safe"] = str(d_counts.get('safe', 0))
        resp["X-Diet-Filtered"] = str(d_counts.get('filtered_out', 0))
        return resp
    
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
        toggle = request.query_params.get('allergy_filter', 'true').lower() not in ('false', '0', 'no')
        recipes, a_counts = _filter_recipes_by_allergies(recipes, request.user, toggle)
        diet_toggle = request.query_params.get('diet_filter', 'true').lower() not in ('false','0','no')
        recipes, d_counts = _filter_recipes_by_diet(recipes, request.user, diet_toggle)
        
        serializer = RecipeListSerializer(recipes, many=True)
        resp = Response(serializer.data)
        resp["X-Allergy-Original"] = str(a_counts.get('original', 0))
        resp["X-Allergy-Safe"] = str(a_counts.get('safe', 0))
        resp["X-Allergy-Filtered"] = str(a_counts.get('filtered_out', 0))
        resp["X-Diet-Original"] = str(d_counts.get('original', 0))
        resp["X-Diet-Safe"] = str(d_counts.get('safe', 0))
        resp["X-Diet-Filtered"] = str(d_counts.get('filtered_out', 0))
        return resp
    
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

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recently viewed recipes for the authenticated user.
        For non-authenticated users, return recently added recipes.
        """
        if request.user.is_authenticated:
            # Get user's recently viewed recipes
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                recent_recipes = Recipe.objects.filter(
                    user_interactions__user=request.user
                ).order_by('-user_interactions__viewed_at')[:8]
                
                # If we have less than 8 recent recipes, add recently added recipes
                if recent_recipes.count() < 8:
                    recent_added = Recipe.objects.order_by('-created_at')[:8]
                    # Combine the two querysets without duplicates
                    recent_recipes = (recent_recipes | recent_added).distinct()[:8]
            except UserProfile.DoesNotExist:
                # If user profile doesn't exist, return recently added recipes
                recent_recipes = Recipe.objects.order_by('-created_at')[:8]
        else:
            # For non-authenticated users, return recently added recipes
            recent_recipes = Recipe.objects.order_by('-created_at')[:8]
            
        serializer = RecipeListSerializer(recent_recipes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def track_view(self, request, pk=None):
        """
        Track when a user views a recipe.
        """
        recipe = self.get_object()
        
        if request.user.is_authenticated:
            # Create or update the user interaction
            UserInteraction.objects.update_or_create(
                user=request.user,
                recipe=recipe,
                defaults={'viewed_at': timezone.now()}
            )
        
        return Response({'status': 'success'})

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
        serializer = UserProfileSerializer(profile, data={'profile_image': request.FILES['profile_image']}, partial=True, context={'request': request})
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
    print("Login attempt received:", request.data)  # Debug log
    
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        username_or_email = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        print(f"Attempting login with: {username_or_email}")  # Debug log
        
        # Check if input is an email
        if '@' in username_or_email:
            try:
                user = CustomUser.objects.get(email=username_or_email)
                username = user.username
                print(f"Found user by email: {username}")  # Debug log
            except CustomUser.DoesNotExist:
                print(f"No user found with email: {username_or_email}")  # Debug log
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
        else:
            username = username_or_email
            print(f"Using username directly: {username}")  # Debug log
        
        user = authenticate(username=username, password=password)
        print(f"Authentication result: {user}")  # Debug log
        
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

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]  # Allow anyone to submit contact messages
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"message": "Thank you for your message. We will get back to you soon!"},
            status=status.HTTP_201_CREATED
        )

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
        serializer = UserProfileSerializer(user_profile, context={'request': request})
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(user_profile, data=request.data, partial=True, context={'request': request})
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
    mapped_allergy_slugs = []
    if user_preferences:
        if user_preferences['dietary_preference']:
            params["diet"] = user_preferences['dietary_preference']
        allergies_list = user_preferences.get('allergies', [])
        if allergies_list:
            seen = set()
            for a in allergies_list:
                slug = _map_allergy_to_slug(a)
                if slug and slug not in seen:
                    seen.add(slug)
                    mapped_allergy_slugs.append(slug)
            if mapped_allergy_slugs:
                params["intolerances"] = ",".join(mapped_allergy_slugs)
                print("Applied intolerances:", params["intolerances"])  # debug
        if user_preferences['favorite_categories']:
            params["cuisine"] = ",".join(user_preferences['favorite_categories'])

    # Respect allergy filter toggle (default true)
    allergy_filter_toggle = request.query_params.get('allergy_filter', 'true').lower() not in ('false', '0', 'no')

    # Add intolerances if user has allergies and filtering is enabled
    if allergy_filter_toggle:
        allergies_list = user_preferences.get('allergies', [])
        if allergies_list and not mapped_allergy_slugs:
            seen = set()
            for a in allergies_list:
                slug = _map_allergy_to_slug(a)
                if slug and slug not in seen:
                    seen.add(slug)
                    mapped_allergy_slugs.append(slug)
        if mapped_allergy_slugs:
            params["intolerances"] = ",".join(mapped_allergy_slugs)
            print("Applied intolerances (toggle):", params["intolerances"])  # debug

    # Call Spoonacular API
    response = requests.get(endpoint, params=params)
    dietary_fallback = False

    def process_results(data):
        filtered_results = []
        calories_list = []
        # Build simple keyword lists for strict filtering for common allergens
        allergen_keywords = {}
        if allergy_filter_toggle and mapped_allergy_slugs:
            for slug in mapped_allergy_slugs:
                if slug == 'peanut':
                    allergen_keywords[slug] = ['peanut', 'peanuts', 'peanut butter', 'groundnut', 'ground nuts', 'groundnut', 'ground nuts']
                elif slug == 'egg':
                    allergen_keywords[slug] = ['egg', 'eggs', 'albumen', 'mayonnaise', 'mayonaise']
                elif slug == 'gluten':
                    allergen_keywords[slug] = ['gluten', 'gluten-free', 'gluten free', 'glutenfree', 'gluten free']
                elif slug == 'grain':
                    allergen_keywords[slug] = ['grain', 'grains', 'grainy', 'grainy', 'grainy', 'grainy']
                elif slug == 'peanut':
                    allergen_keywords[slug] = ['peanut', 'peanuts', 'peanut butter', 'groundnut', 'ground nuts', 'groundnut', 'ground nuts']
                elif slug == 'seafood':
                    allergen_keywords[slug] = ['seafood']
                elif slug == 'sesame':
                    allergen_keywords[slug] = ['sesame']
                elif slug == 'shellfish':
                    allergen_keywords[slug] = ['shellfish']
                elif slug == 'soy':
                    allergen_keywords[slug] = ['soy']
                elif slug == 'sulfite':
                    allergen_keywords[slug] = ['sulfite']
                elif slug == 'tree nut':
                    allergen_keywords[slug] = ['tree nut']
                elif slug == 'wheat':
                    allergen_keywords[slug] = ['wheat']
                elif slug == 'dairy':
                    allergen_keywords[slug] = ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'butter']
                # add more mappings as needed for other slugs
        for recipe in data.get('results', []):
            # Strictly filter by dietary preference if set
            if user_preferences.get('dietary_preference') and not dietary_fallback:
                if user_preferences['dietary_preference'].lower() not in [d.lower() for d in recipe.get('diets', [])]:
                    continue
            # Strict allergy exclusion by ingredients (defense-in-depth)
            if allergy_filter_toggle and allergen_keywords:
                ing_text = ''
                if 'extendedIngredients' in recipe:
                    names = []
                    for ing in recipe.get('extendedIngredients', []) or []:
                        try:
                            names.append(str(ing.get('name', '')))
                            names.append(str(ing.get('original', '')))
                        except Exception:
                            pass
                    ing_text = " ".join(names).lower()
                title_text = str(recipe.get('title', '')).lower()
                haystack = f"{title_text} {ing_text}"
                violates = False
                for slug, kws in allergen_keywords.items():
                    if any(kw in haystack for kw in kws):
                        violates = True
                        break
                if violates:
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
            dietary = request.data['dietary_preference']
            if isinstance(dietary, list):
                profile.dietary_preference = ','.join([d.strip().lower() for d in dietary])
            else:
                profile.dietary_preference = dietary.strip().lower()
        if 'allergies' in request.data:
            allergies = request.data['allergies']
            if isinstance(allergies, list):
                normalized = [a.strip().lower() for a in allergies if a and str(a).strip()]
                if not normalized or 'none' in normalized:
                    profile.allergies = ''
                else:
                    profile.allergies = ','.join(normalized)
            else:
                val = str(allergies).strip().lower()
                profile.allergies = '' if (val == '' or val == 'none') else val
        if 'profile_image' in request.FILES:
            image = request.FILES['profile_image']
            if image.size > 5 * 1024 * 1024:
                return Response({'error': 'Image size must be less than 5MB'}, status=status.HTTP_400_BAD_REQUEST)
            if not image.content_type.startswith('image/'):
                return Response({'error': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)
            # Save to both UserProfile and CustomUser
            profile.profile_image = image
            user.profile_picture = image  # This will save to the CustomUser model
            user.save()
        profile.save()
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            },
            'profile': {
                'dietary_preference': profile.dietary_preference.split(',') if profile.dietary_preference else [],
                'allergies': profile.allergies.split(',') if profile.allergies else [],
                'profile_image': profile.profile_image.url if profile.profile_image else None
            },
            'message': 'Profile updated successfully'
        })
    except Exception as e:
        print(f"Error updating profile for user {user.username}: {str(e)}")
        return Response({'error': 'An error occurred while updating the profile'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
