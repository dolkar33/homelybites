from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Recipe, Category, UserProfile, CustomUser, UserRecipeInteraction, ContactMessage, Cuisine

class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['id', 'name', 'slug']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class RecipeSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    cuisines = CuisineSerializer(many=True, read_only=True)
    
    class Meta:
        model = Recipe
        fields = '__all__'

class RecipeListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    cuisines = CuisineSerializer(many=True, read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
    'id', 'title', 'slug', 'image_url', 'prep_time', 'cook_time', 'difficulty', 'categories', 'cuisines',
    'instructions', 'calories', 'fat', 'sugar', 'protein', 'carbohydrates'
]

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
    dietary_preference = serializers.CharField(required=False)
    allergies = serializers.CharField(required=False)

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'profile_image', 'favorite_categories', 'dietary_preference', 'allergies', 'has_completed_questions']
        read_only_fields = ['id', 'user', 'has_completed_questions']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Ensure absolute URL for image
        request = self.context.get('request', None)
        if instance.profile_image and request:
            rep['profile_image'] = request.build_absolute_uri(instance.profile_image.url)
        elif not instance.profile_image:
            rep['profile_image'] = None
        # Convert CSV strings to lists for response
        rep['dietary_preference'] = [s.strip() for s in (instance.dietary_preference or '').split(',') if s.strip()]
        rep['allergies'] = [s.strip() for s in (instance.allergies or '').split(',') if s.strip()]
        return rep

    def validate(self, attrs):
        """Normalize incoming list or CSV strings into CSV strings for storage."""
        def normalize(value, lower=False):
            if value is None:
                return None
            if isinstance(value, list):
                items = [str(v).strip() for v in value if str(v).strip()]
                if lower:
                    items = [v.lower() for v in items]
                return ','.join(items)
            if isinstance(value, str):
                parts = [p.strip() for p in value.split(',') if p.strip()]
                if lower:
                    parts = [p.lower() for p in parts]
                return ','.join(parts)
            raise serializers.ValidationError('Expected list or comma-separated string for preferences.')

        if 'dietary_preference' in attrs:
            attrs['dietary_preference'] = normalize(attrs.get('dietary_preference'), lower=True)
        if 'allergies' in attrs:
            attrs['allergies'] = normalize(attrs.get('allergies'), lower=False)
        return attrs

    def update(self, instance, validated_data):
        # Handle image replacement
        if 'profile_image' in validated_data:
            if instance.profile_image:
                instance.profile_image.delete(save=False)
            instance.profile_image = validated_data['profile_image']

        # Apply normalized CSV strings
        if 'dietary_preference' in validated_data:
            instance.dietary_preference = validated_data['dietary_preference']
        if 'allergies' in validated_data:
            instance.allergies = validated_data['allergies']

        instance.save()
        return instance

class UserRecipeInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRecipeInteraction
        fields = ['id', 'user', 'recipe', 'interaction_type', 'rating', 'timestamp']

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

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        
        # Password validation
        if len(data['new_password']) < 8:
            raise serializers.ValidationError({
                'new_password': 'Password must be at least 8 characters long'
            })
        
        if not any(char.isupper() for char in data['new_password']):
            raise serializers.ValidationError({
                'new_password': 'Password must contain at least one uppercase letter'
            })
        
        if not any(char.islower() for char in data['new_password']):
            raise serializers.ValidationError({
                'new_password': 'Password must contain at least one lowercase letter'
            })
        
        if not any(char.isdigit() for char in data['new_password']):
            raise serializers.ValidationError({
                'new_password': 'Password must contain at least one number'
            })
        
        if not any(char in '!@#$%^&*()_+-=[]{};\':"|,.<>?/' for char in data['new_password']):
            raise serializers.ValidationError({
                'new_password': 'Password must contain at least one special character'
            })
        
        return data

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']
        read_only_fields = ['created_at']
