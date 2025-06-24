from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet, CategoryViewSet, UserProfileViewSet, UserRegistrationView, import_from_spoonacular,homepage

router = DefaultRouter()
router.register(r'', RecipeViewSet, basename='recipe')
router.register(r'categories', CategoryViewSet)
router.register(r'profiles', UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', UserRegistrationView.as_view(), name='user-registration'),
    path('import-recipes/', import_from_spoonacular, name='import-recipes'),
    path('homepage/', homepage)
]
