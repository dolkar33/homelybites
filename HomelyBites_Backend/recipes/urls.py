from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RecipeViewSet, CategoryViewSet, UserProfileViewSet, ContactMessageViewSet,
    register_user, login_user, list_users, homepage, import_from_spoonacular
)

router = DefaultRouter()
router.register(r'recipes', RecipeViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'contact-messages', ContactMessageViewSet)

urlpatterns = [
    # Specific paths for function-based views
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('users/', list_users, name='list_users'),
    path('homepage/', homepage, name='homepage'),
    path('recommendations/', views.recommend_recipes, name='recommend_recipes'),
    path('search/', views.search_recipes, name='search_recipes'),
    path('import_from_spoonacular/', import_from_spoonacular, name='import_from_spoonacular'),
    path('password-reset/', views.password_reset_request, name='password_reset_request'),
    path('password-reset-confirm/', views.password_reset_confirm, name='password_reset_confirm'),
    path('change-password/', views.change_password, name='change_password'),
    path('complete-user-questions/', views.complete_user_questions, name='complete_user_questions'),
    path('user-profiles/my_profile/', views.my_profile, name='my_profile'),
    path('user-profiles/update/', views.update_user_profile, name='update_user_profile'),

    # Router-generated paths (should be last)
    path('', include(router.urls)),
]
