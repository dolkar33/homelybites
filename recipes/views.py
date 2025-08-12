from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from .models import Recipe, UserTastePreference
from .serializers import UserTastePreferenceSerializer, RecipeSerializer
from .utils import get_content_based_recommendations

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recipes_you_would_love(request):
    """
    Return the 'Recipes You Would Love' section using content-based filtering
    (TF-IDF + cosine similarity) purely from the database.
    """
    recommended_recipes = get_content_based_recommendations(request.user)
    serializer = RecipeSerializer(recommended_recipes, many=True)
    return Response({
        "title": "Recipes You Would Love",
        "recipes": serializer.data
    })

class UserTastePreferenceView(APIView):
    """
    View to manage user taste preferences.
    * Requires token authentication.
    * A user can get, create, or update their preferences.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Retrieve the user's taste preferences.
        If they don't exist, create a default one.
        """
        preferences, created = UserTastePreference.objects.get_or_create(user=request.user)
        serializer = UserTastePreferenceSerializer(preferences)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        """
        Create or update user's taste preferences.
        This method handles both creation and updates (upsert).
        """
        preferences, created = UserTastePreference.objects.get_or_create(user=request.user)
        # Use partial=True to allow updating only some fields
        serializer = UserTastePreferenceSerializer(preferences, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return 201 if created, 200 if updated
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, *args, **kwargs):
        """
        Update user's taste preferences.
        This is an alias for POST to follow REST conventions.
        """
        return self.post(request, *args, **kwargs)     
