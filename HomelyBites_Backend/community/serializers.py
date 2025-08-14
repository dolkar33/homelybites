from rest_framework import serializers
from django.db.models import Count
from recipes.models import CustomUser
from .models import Post, Tag, PostTag, Follow, Like, SavedPost, SuggestedUser


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model"""
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for CustomUser with community-related counts to match frontend structure"""
    name = serializers.SerializerMethodField()  # matches frontend 'name' field
    avatar = serializers.SerializerMethodField()  # matches frontend 'avatar' field
    posts = serializers.SerializerMethodField()  # matches frontend 'posts' field
    followers = serializers.SerializerMethodField()  # matches frontend 'followers' field
    following = serializers.SerializerMethodField()  # matches frontend 'following' field
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'name', 'avatar', 'bio', 
            'posts', 'followers', 'following', 'is_following'
        ]
        read_only_fields = ['id', 'posts', 'followers', 'following', 'is_following']
    
    def get_name(self, obj):
        """Return full name or username if no first/last name"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username
    
    def get_avatar(self, obj):
        """Return full URL for user's avatar.
        Prefer `obj.profile.profile_image` (from `UserProfile`).
        Fallback to `obj.profile_picture` if it exists on `CustomUser`.
        """
        request = self.context.get('request')
        # Primary: via related UserProfile.profile_image
        try:
            profile = getattr(obj, 'profile', None)
            if profile and getattr(profile, 'profile_image', None):
                url = profile.profile_image.url
                return request.build_absolute_uri(url) if request else url
        except Exception:
            pass

        # Fallback: direct field on CustomUser if present
        if hasattr(obj, 'profile_picture') and getattr(obj, 'profile_picture'):
            try:
                url = obj.profile_picture.url
                return request.build_absolute_uri(url) if request else url
            except Exception:
                pass
        return None
    
    def get_posts(self, obj):
        """Return posts count"""
        return obj.posts.count()
    
    def get_followers(self, obj):
        """Return followers count"""
        return obj.followers.count()
    
    def get_following(self, obj):
        """Return following count"""
        return obj.following.count()
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post model to match exact frontend data structure"""
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    likes = serializers.SerializerMethodField()  # matches frontend 'likes' field
    isLiked = serializers.SerializerMethodField()  # matches frontend 'isLiked' field
    isSaved = serializers.SerializerMethodField()  # matches frontend 'isSaved' field

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        request = self.context.get('request')
        if instance.image and request:
            rep['image'] = request.build_absolute_uri(instance.image.url)
        elif not instance.image:
            rep['image'] = None
        return rep

    image = serializers.ImageField(required=False, allow_null=True)  # accepts uploads
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'title', 'description', 'image', 'category',
            'tags', 'tag_names', 'likes', 'isLiked', 'isSaved',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'likes', 'created_at', 'updated_at']
    
    def get_likes(self, obj):
        """Return likes count to match frontend 'likes' field"""
        return obj.likes_count
    
    def get_isLiked(self, obj):
        """Return if current user liked this post"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False
    
    def get_isSaved(self, obj):
        """Return if current user saved this post"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return SavedPost.objects.filter(user=request.user, post=obj).exists()
        return False
    
    def get_image(self, obj):
        """Return full URL for post image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None
    
    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        post = Post.objects.create(**validated_data)
        
        # Handle tags
        for tag_name in tag_names:
            tag_name = tag_name.lower().strip()
            if tag_name:
                tag, created = Tag.objects.get_or_create(
                    name=tag_name,
                    defaults={'slug': tag_name.replace(' ', '-')}
                )
                PostTag.objects.get_or_create(post=post, tag=tag)
        
        return post
    
    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        
        # Update post fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle tags if provided
        if tag_names is not None:
            # Clear existing tags
            PostTag.objects.filter(post=instance).delete()
            
            # Add new tags
            for tag_name in tag_names:
                tag_name = tag_name.lower().strip()
                if tag_name:
                    tag, created = Tag.objects.get_or_create(
                        name=tag_name,
                        defaults={'slug': tag_name.replace(' ', '-')}
                    )
                    PostTag.objects.get_or_create(post=instance, tag=tag)
        
        return instance


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for Follow model"""
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    following_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'following_id', 'created_at']
        read_only_fields = ['id', 'follower', 'created_at']
    
    def validate_following_id(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if value == request.user.id:
                raise serializers.ValidationError("You cannot follow yourself.")
            
            if Follow.objects.filter(follower=request.user, following_id=value).exists():
                raise serializers.ValidationError("You are already following this user.")
        
        return value
    
    def create(self, validated_data):
        validated_data['follower'] = self.context['request'].user
        validated_data['following_id'] = validated_data.pop('following_id')
        return super().create(validated_data)


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for Like model"""
    user = UserSerializer(read_only=True)
    post_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'post_id', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def validate_post_id(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if Like.objects.filter(user=request.user, post_id=value).exists():
                raise serializers.ValidationError("You have already liked this post.")
        return value
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['post_id'] = validated_data.pop('post_id')
        return super().create(validated_data)


class SavedPostSerializer(serializers.ModelSerializer):
    """Serializer for SavedPost model"""
    user = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)
    post_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SavedPost
        fields = ['id', 'user', 'post', 'post_id', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def validate_post_id(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if SavedPost.objects.filter(user=request.user, post_id=value).exists():
                raise serializers.ValidationError("You have already saved this post.")
        return value
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['post_id'] = validated_data.pop('post_id')
        return super().create(validated_data)


class SuggestedUserSerializer(serializers.ModelSerializer):
    """Serializer for SuggestedUser model"""
    suggested_user = UserSerializer(read_only=True)
    
    class Meta:
        model = SuggestedUser
        fields = ['id', 'suggested_user', 'reason', 'score', 'created_at']
        read_only_fields = ['id', 'suggested_user', 'reason', 'score', 'created_at']
