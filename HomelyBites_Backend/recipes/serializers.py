from rest_framework import serializers
<<<<<<< HEAD
from django.contrib.auth.models import User
from .models import Recipe, Category, UserProfile, UserRecipeInteraction, ContactMessage
=======
from django.contrib.auth.password_validation import validate_password
from .models import Recipe, Category, UserProfile, CustomUser, UserRecipeInteraction
>>>>>>> main

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class RecipeSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Recipe
        fields = '__all__'

class RecipeListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Recipe
        fields = ['id', 'title', 'slug', 'image_url', 'prep_time', 'cook_time', 'difficulty', 'categories']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    favorite_categories = CategorySerializer(many=True, read_only=True)
    profile_image = serializers.ImageField(max_length=None, allow_empty_file=True, required=False)
    has_completed_questions = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'profile_image', 'favorite_categories', 'dietary_preference', 'allergies', 'dislikes', 'has_completed_questions']
        read_only_fields = ['id', 'user', 'has_completed_questions']

    def update(self, instance, validated_data):
        if 'profile_image' in validated_data:
            if instance.profile_image:
                instance.profile_image.delete(save=False)
            instance.profile_image = validated_data['profile_image']
        instance.dietary_preference = validated_data.get('dietary_preference', instance.dietary_preference)
        instance.allergies = validated_data.get('allergies', instance.allergies)
        instance.dislikes = validated_data.get('dislikes', instance.dislikes)
        instance.save()
        return instance

class UserRecipeInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRecipeInteraction
        fields = ['id', 'user', 'recipe', 'interaction_type', 'rating', 'timestamp']

<<<<<<< HEAD
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']
        read_only_fields = ['created_at']
=======
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    token = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
>>>>>>> main
