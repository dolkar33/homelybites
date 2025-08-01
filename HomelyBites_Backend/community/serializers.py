from rest_framework import serializers
from .models import Post
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'user', 'title', 'content', 'image', 'created_at', 'updated_at', 'likes_count']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def create(self, validated_data):
        user = self.context['request'].user
        return Post.objects.create(**validated_data) 