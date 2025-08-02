from django.http import HttpResponse
from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Recipe
from .serializers import RecipeSerializer
from .utils import content_based_recommendation, collaborative_recommendation
import requests
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import status
from .models import Recipe, Like
from django.shortcuts import get_object_or_404
from .serializers import RecipeSerializer
from .recommender import content_based_recommendations


def homepage(request):
    return HttpResponse("<h1>Welcome to Homely Bites!</h1><p>This is the homepage.</p>")


@api_view(['POST'])
def register_user(request):
    data = request.data
    try:
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', '')
        )
        return Response({"message": "User registered successfully."}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['POST'])
def login_user(request):
    from django.contrib.auth import authenticate
    from rest_framework_simplejwt.tokens import RefreshToken

    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=401)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hybrid_recommendation(request):
    user = request.user
    content_rec = content_based_recommendation(user, top_n=5)
    collab_rec = collaborative_recommendation(user, top_n=5).exclude(id__in=content_rec.values_list('id', flat=True))
    combined = list(content_rec) + list(collab_rec)

    serializer = RecipeSerializer(combined, many=True)
    return Response({
        "title": "Recipes You Would Love",
        "recipes": serializer.data
    })


@api_view(['GET'])
def trending_recipes(request):
    trending = Recipe.objects.annotate(
    popularity=Count('userrecipeinteraction', filter=Q(userrecipeinteraction__interaction_type='like')) +
               Count('userrecipeinteraction', filter=Q(userrecipeinteraction__interaction_type='save')) +
               Count('userrecipeinteraction', filter=Q(userrecipeinteraction__interaction_type='favorite')) +
               Count('userrecipeinteraction', filter=Q(userrecipeinteraction__interaction_type='view'))
).order_by('-popularity')[:6]


    serializer = RecipeSerializer(trending, many=True)
    return Response({
        "title": "What Others Are Cooking",
        "recipes": serializer.data
    })
@api_view(['POST'])
def recommend_recipe(request):
    ingredients = request.data.get('ingredients', [])
    if not ingredients or not isinstance(ingredients, list):
        return Response({"error": "Please provide a list of ingredients."}, status=400)
    ingredients_str = ",".join(ingredients)
    find_url = "https://api.spoonacular.com/recipes/findByIngredients"
    params = {
        "ingredients": ingredients_str,
        "number": 5,
        "apiKey": settings.SPOONACULAR_API_KEY
    }
    try:
        response = requests.get(find_url, params=params)
        response.raise_for_status()
        data = response.json()

        recipes = []
        for item in data:
            spoonacular_id = item.get("id")
            title = item.get("title")
            image = item.get("image")

            #Fetch detailed info from Spoonacular
            detail_url = f"https://api.spoonacular.com/recipes/{spoonacular_id}/information"
            detail_params = {
                "apiKey": settings.SPOONACULAR_API_KEY
            }

            detail_response = requests.get(detail_url, params=detail_params)
            detail_data = detail_response.json()

            #Extract more detailed fields
            instructions = detail_data.get("instructions", "")
            ingredients_list = [
                ing.get("original", "") for ing in detail_data.get("extendedIngredients", [])
            ]
            ingredients_text = ", ".join(ingredients_list)

            # You can customize how you extract tags
            tags = ", ".join(detail_data.get("dishTypes", []))

            # Save to DB (skip duplicates)
            recipe, created = Recipe.objects.get_or_create(
                spoonacular_id=spoonacular_id,
                defaults={
                    "title": title,
                    "image": image,
                    "instructions": instructions,
                    "ingredients": ingredients_text,
                    "tags": tags,
                }
            )

            recipes.append({
                "id": recipe.id,
                "title": recipe.title,
                "ingredients": recipe.ingredients,
                "instructions": recipe.instructions,
                "spoonacular_id": recipe.spoonacular_id,
                "image": recipe.image,
                "tags": recipe.tags,
            })

        return Response({
            "input_ingredients": ingredients,
            "recommended_recipes": recipes
        })

    except requests.exceptions.RequestException as e:
        return Response({"error": f"External API request failed: {str(e)}"}, status=502) 
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hybrid_recommendation(request):
    user = request.user

    content_rec = content_based_recommendation(user)[:5]  # get top 5
    content_ids = list(content_rec.values_list('id', flat=True))

    collab_rec = collaborative_recommendation(user).exclude(id__in=content_ids)[:5]

    combined = list(content_rec) + list(collab_rec)

    serializer = RecipeSerializer(combined, many=True)
    return Response({
        "title": "Recipes You Would Love",
        "recipes": serializer.data
    })


@api_view(['GET'])
def recipes_by_category(request, category_name):
    recipes = Recipe.objects.filter(tags__icontains=category_name).order_by('-id')[:10]
    serializer = RecipeSerializer(recipes, many=True)
    return Response({
        "title": f"{category_name} Recipes",
        "recipes": serializer.data
    })
    
    
@api_view(['GET'])
def list_recipes(request):
    recipes = Recipe.objects.all()
    serializer = RecipeSerializer(recipes, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like(request, recipe_id):
    try:
        recipe = Recipe.objects.get(id=recipe_id)
    except Recipe.DoesNotExist:
        return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)

    like, created = Like.objects.get_or_create(user=request.user, recipe=recipe)

    if not created:
        like.delete()
        return Response({'message': 'Unliked'}, status=status.HTTP_200_OK)
    else:
        return Response({'message': 'Liked'}, status=status.HTTP_201_CREATED)
    
    from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import RecipeSerializer
from .recommender import content_based_recommendations

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def content_based_recommendation_view(request):
    user = request.user
    recommended_recipes = content_based_recommendations(user.id, top_n=5)
    serializer = RecipeSerializer(recommended_recipes, many=True)
    return Response({
        "title": "Recommended Recipes for You",
        "recipes": serializer.data
    })

   
   