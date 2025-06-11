from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from recipes.models import Recipe, UserProfile
from recipes.serializers import RecipeListSerializer
from .models import UserInteraction

class RecentRecipesViewSet(viewsets.ViewSet):
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
                    recent_views__user=request.user
                ).order_by('-recent_views__viewed_at')[:8]
                
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
        recipe = Recipe.objects.get(pk=pk)
        
        if request.user.is_authenticated:
            # Create or update the user interaction
            UserInteraction.objects.update_or_create(
                user=request.user,
                recipe=recipe,
                defaults={'viewed_at': timezone.now()}
            )
        
        return Response({'status': 'success'}) 