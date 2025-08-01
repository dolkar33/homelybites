from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecentRecipesViewSet

# Although we are registering a ViewSet, we will explicitly define the 'recent' list action
# to ensure its URL is correctly recognized.
urlpatterns = [
    path('recent/', RecentRecipesViewSet.as_view({'get': 'recent'}), name='recent-recipes-list'),
    path('recent/<int:pk>/track_view/', RecentRecipesViewSet.as_view({'post': 'track_view'}), name='recent-recipes-track-view'),
]

# You can still use the router for other actions if you have them, but for 'recent'
# and 'track_view', we are being explicit.
# router = DefaultRouter()
# router.register(r'recent', RecentRecipesViewSet, basename='recent-recipes')
# urlpatterns += router.urls # Add other router URLs if necessary 