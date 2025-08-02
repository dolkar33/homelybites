from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet, TagViewSet, UserViewSet, FollowViewSet, SuggestedUserViewSet,
    CategoryListView, TrendingHashtagsView, SearchView
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'hashtags', TagViewSet, basename='hashtag')
router.register(r'users', UserViewSet, basename='user')
router.register(r'follows', FollowViewSet, basename='follow')
router.register(r'suggestions', SuggestedUserViewSet, basename='suggestion')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),  # Remove api/ prefix since it's added in main urls.py
    path('community-categories/', CategoryListView.as_view(), name='community-categories'),
    path('hashtags/trending/', TrendingHashtagsView.as_view(), name='trending-hashtags'),
    path('saved-posts/', PostViewSet.as_view({'get': 'saved'}), name='saved-posts'),
    path('search/', SearchView.as_view(), name='search'),
]

# Available endpoints:
# GET /api/posts/ - List all posts
# POST /api/posts/ - Create a new post
# GET /api/posts/{id}/ - Get a specific post
# PUT /api/posts/{id}/ - Update a post (author only)
# DELETE /api/posts/{id}/ - Delete a post (author only)
# POST /api/posts/{id}/like/ - Like/unlike a post
# POST /api/posts/{id}/save/ - Save/unsave a post
# GET /api/posts/feed/ - Get personalized feed
# GET /api/posts/saved/ - Get saved posts

# GET /api/tags/ - List all tags
# GET /api/tags/popular/ - Get popular tags

# GET /api/users/ - List users (with search)
# GET /api/users/{username}/ - Get user profile
# GET /api/users/{username}/posts/ - Get user's posts
# GET /api/users/{username}/followers/ - Get user's followers
# GET /api/users/{username}/following/ - Get users followed by user

# GET /api/follows/ - List user's follows
# POST /api/follows/ - Follow a user
# DELETE /api/follows/{id}/ - Unfollow a user
# POST /api/follows/toggle/ - Toggle follow status

# GET /api/suggestions/ - Get user suggestions
# POST /api/suggestions/{id}/dismiss/ - Dismiss a suggestion
