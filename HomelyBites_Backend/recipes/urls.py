from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt

from rest_framework.routers import DefaultRouter
from . import views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserProfile, Recipe
from .serializers import RecipeListSerializer, UserProfileSerializer
from .views import RecipeViewSet, CategoryViewSet, UserProfileViewSet, CuisineViewSet
#from .views import UserProfileViewSet

router = DefaultRouter()
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'categories', CategoryViewSet)
router.register(r'cuisines', CuisineViewSet)
router.register(r'user-profiles', UserProfileViewSet)#Views nikalera try gara paxi

urlpatterns = [
    # Specific paths for function-based views
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('verify-email/<str:token>/', views.verify_email, name='verify_email'),
    path('activate/<str:uidb64>/<str:token>/', views.activate_user, name='activate_user'),
    path('confirm-email-change/<str:token>/', views.confirm_email_change, name='confirm_email_change'),
    path('resend-verification/', views.resend_verification_email, name='resend_verification_email'),
    path('users/', views.list_users, name='list_users'),
    path('homepage/', views.homepage, name='homepage'),
    path('recommendations/', views.recommend_recipes, name='recommend_recipes'),
    path('search/', views.search_recipes, name='search_recipes'),
    path('import_from_spoonacular/', views.import_from_spoonacular, name='import_from_spoonacular'),
    path('import-cuisines/', views.import_cuisines_from_spoonacular, name='import_cuisines_from_spoonacular'),
    path('password-reset/', views.password_reset_request, name='password_reset_request'),
    path('password-reset-confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    path('change-password/', views.change_password, name='change_password'),
    path('complete-user-questions/', views.complete_user_questions, name='complete_user_questions'),
    path('user-profiles/my_profile/', views.my_profile, name='my_profile'),
    path('user-profiles/update/', views.update_user_profile, name='update_user_profile'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('verify-password-reset/<str:token>/', views.verify_password_reset, name='verify_password_reset'),
    path('reset-password/<str:token>/', views.reset_password, name='reset_password'),

    # Router-generated paths (should be last)
    path('', include(router.urls)),
]
