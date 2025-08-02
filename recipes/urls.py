from django.urls import path
from . import views
from .views import register_user, login_user
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import recipes_by_category
from .views import list_recipes
urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('recommend-recipes/', views.recommend_recipe, name='recommend_recipe'),
    path('recommendations/hybrid/', views.hybrid_recommendation, name='hybrid_recommendation'),
    path('recipes/trending/', views.trending_recipes, name='trending_recipes'),
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    
    path('recipes/category/<str:category_name>/', recipes_by_category, name='recipes_by_category'),
    path('recipes/<int:recipe_id>/like/', views.toggle_like, name='like_recipe'),
    path('recipes/', list_recipes, name='list_recipes'),
    
]





    


     




