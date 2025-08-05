from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from recipes.models import CustomUser
from .models import Post, Tag, Follow, Like, SavedPost, SuggestedUser
from .serializers import (
    PostSerializer, TagSerializer, UserSerializer, FollowSerializer,
    LikeSerializer, SavedPostSerializer, SuggestedUserSerializer
)


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for managing posts"""
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Post.objects.select_related('author').prefetch_related('tags', 'likes')
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by tag
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__name__icontains=tag)
        
        # Filter by author
        author = self.request.query_params.get('author')
        if author:
            queryset = queryset.filter(author__username=author)
        
        # Search in title and description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    def perform_update(self, serializer):
        # Only allow author to update their own posts
        if serializer.instance.author != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own posts.")
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only allow author to delete their own posts
        if instance.author != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own posts.")
        instance.delete()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """Like or unlike a post"""
        post = self.get_object()
        like_obj, created = Like.objects.get_or_create(user=request.user, post=post)
        
        if not created:
            like_obj.delete()
            return Response({'message': 'Post unliked', 'liked': False}, status=status.HTTP_200_OK)
        
        return Response({'message': 'Post liked', 'liked': True}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        """Save or unsave a post"""
        post = self.get_object()
        saved_obj, created = SavedPost.objects.get_or_create(user=request.user, post=post)
        
        if not created:
            saved_obj.delete()
            return Response({'message': 'Post unsaved', 'saved': False}, status=status.HTTP_200_OK)
        
        return Response({'message': 'Post saved', 'saved': True}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def feed(self, request):
        """Get personalized feed for authenticated user"""
        # Get posts from followed users
        following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        # Include user's own posts and posts from followed users
        queryset = Post.objects.filter(
            Q(author=request.user) | Q(author__in=following_users)
        ).select_related('author').prefetch_related('tags', 'likes').order_by('-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def saved(self, request):
        """Get user's saved posts"""
        saved_posts = SavedPost.objects.filter(user=request.user).select_related('post__author')
        posts = [saved.post for saved in saved_posts]
        
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular posts this week"""
        from datetime import datetime, timedelta
        week_ago = datetime.now() - timedelta(days=7)
        
        queryset = Post.objects.filter(
            created_at__gte=week_ago
        ).select_related('author').prefetch_related('tags', 'likes').order_by('-likes_count')[:20]
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_posts(self, request):
        """Get current user's posts"""
        queryset = Post.objects.filter(
            author=request.user
        ).select_related('author').prefetch_related('tags', 'likes').order_by('-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for tags (read-only)"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular tags based on usage"""
        popular_tags = Tag.objects.annotate(
            post_count=Count('post')
        ).filter(post_count__gt=0).order_by('-post_count')[:20]
        
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for users (read-only)"""
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'username'
    
    def get_queryset(self):
        queryset = CustomUser.objects.all()
        
        # Search users
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search)
            )
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def posts(self, request, username=None):
        """Get posts by a specific user"""
        user = self.get_object()
        posts = Post.objects.filter(author=user).select_related('author').prefetch_related('tags', 'likes')
        
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def followers(self, request, username=None):
        """Get user's followers"""
        user = self.get_object()
        followers = Follow.objects.filter(following=user).select_related('follower')
        users = [follow.follower for follow in followers]
        
        page = self.paginate_queryset(users)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def following(self, request, username=None):
        """Get users that this user is following"""
        user = self.get_object()
        following = Follow.objects.filter(follower=user).select_related('following')
        users = [follow.following for follow in following]
        
        page = self.paginate_queryset(users)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class FollowViewSet(viewsets.ModelViewSet):
    """ViewSet for managing follows"""
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(follower=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle follow status for a user"""
        following_id = request.data.get('following_id')
        if not following_id:
            return Response({'error': 'following_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            following_user = CustomUser.objects.get(id=following_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if following_user == request.user:
            return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow_obj, created = Follow.objects.get_or_create(
            follower=request.user,
            following=following_user
        )
        
        if not created:
            follow_obj.delete()
            return Response({'message': 'Unfollowed', 'following': False}, status=status.HTTP_200_OK)
        
        return Response({'message': 'Followed', 'following': True}, status=status.HTTP_201_CREATED)


class SuggestedUserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user suggestions"""
    serializer_class = SuggestedUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SuggestedUser.objects.filter(
            user=self.request.user,
            is_dismissed=False
        ).select_related('suggested_user')
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a user suggestion"""
        suggestion = self.get_object()
        suggestion.is_dismissed = True
        suggestion.save()
        return Response({'message': 'Suggestion dismissed'}, status=status.HTTP_200_OK)


class CategoryListView(APIView):
    """API view to return available post categories"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Return list of available categories"""
        categories = [choice[1] for choice in Post.CATEGORY_CHOICES]
        return Response(categories)


class TrendingHashtagsView(APIView):
    """API view to return trending hashtags"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Return trending hashtags based on usage"""
        trending_tags = Tag.objects.annotate(
            post_count=Count('post')
        ).filter(post_count__gt=0).order_by('-post_count')[:10]
        
        hashtags = [f"#{tag.name}" for tag in trending_tags]
        return Response(hashtags)


class SearchView(APIView):
    """Global search endpoint for posts, users, and hashtags"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        """Search across posts, users, and hashtags"""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'posts': [], 'users': [], 'hashtags': []})
        
        # Search posts
        posts = Post.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query)
        ).select_related('author').prefetch_related('tags', 'likes')[:10]
        
        # Search users
        users = CustomUser.objects.filter(
            Q(username__icontains=query) | 
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query)
        )[:10]
        
        # Search hashtags
        hashtags = Tag.objects.filter(
            name__icontains=query
        )[:10]
        
        # Serialize results
        post_serializer = PostSerializer(posts, many=True, context={'request': request})
        user_serializer = UserSerializer(users, many=True, context={'request': request})
        hashtag_serializer = TagSerializer(hashtags, many=True)
        
        return Response({
            'posts': post_serializer.data,
            'users': user_serializer.data,
            'hashtags': hashtag_serializer.data
        })
