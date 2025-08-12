from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .models import Recipe, Category, UserProfile, CustomUser, UserRecipeInteraction, ContactMessage, Cuisine
import re
import requests

# Spoonacular-compatible intolerance keys
SPOONACULAR_ALLERGY_SLUGS = {
    'dairy', 'egg', 'gluten', 'grain', 'peanut', 'seafood', 'sesame', 'shellfish', 'soy', 'sulfite', 'tree nut', 'wheat'
}


def _map_allergy_to_slug(token: str):
    """Map free-text allergy tokens to Spoonacular-compatible slugs.
    Returns a slug or None if not recognized.
    """
    if not token:
        return None
    t = str(token).strip().lower()

    # direct hit
    if t in SPOONACULAR_ALLERGY_SLUGS:
        return t

    # heuristics / synonyms
    if 'peanut' in t:
        return 'peanut'
    if 'tree nut' in t or (('nut' in t) and ('peanut' not in t)):
        return 'tree nut'
    if 'shellfish' in t:
        return 'shellfish'
    if 'seafood' in t:
        return 'seafood'
    if 'milk' in t or 'dairy' in t:
        return 'dairy'
    if 'egg' in t:
        return 'egg'
    if 'gluten' in t:
        return 'gluten'
    if 'grain' in t:
        return 'grain'
    if 'sesame' in t:
        return 'sesame'
    if 'soy' in t:
        return 'soy'
    if 'sulfite' in t or 'sulphite' in t:
        return 'sulfite'
    if 'wheat' in t:
        return 'wheat'
    return None


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
        """Normalize incoming list or CSV strings into CSV strings for storage.
        Also maps free-text allergy entries to Spoonacular slugs and filters unknowns.
        """
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
            # normalize to list first
            raw = attrs.get('allergies')
            if isinstance(raw, str):
                tokens = [p.strip() for p in raw.split(',') if p.strip()]
            elif isinstance(raw, list):
                tokens = [str(p).strip() for p in raw if str(p).strip()]
            else:
                tokens = []
            # map to slugs and de-duplicate
            mapped = []
            seen = set()
            for tok in tokens:
                slug = _map_allergy_to_slug(tok)
                if slug and slug not in seen:
                    seen.add(slug)
                    mapped.append(slug)
            attrs['allergies'] = ','.join(mapped)
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
    email = serializers.EmailField(
        required=True, 
        validators=[EmailValidator(message="Please enter a valid email address.")]
    )

    class Meta:
        model = CustomUser
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate_email(self, value):
        # Normalize email to avoid duplicates due to case/whitespace
        value = value.strip().lower()
        
        # Check if email already exists
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email address is already in use.")

        # Abstract API validation to check email deliverability
        api_key = getattr(settings, 'ABSTRACT_API_KEY', None)
        if not api_key:
            raise serializers.ValidationError("Email verification service is not configured.")
        
        try:
            response = requests.get(
                "https://emailvalidation.abstractapi.com/v1/",
                params={"api_key": api_key, "email": value},
                timeout=6,
            )
            data = response.json() if response.ok else {}
        except requests.RequestException:
            raise serializers.ValidationError("Unable to verify email at the moment. Please try again.")

        if data.get('deliverability') != 'DELIVERABLE':
            raise serializers.ValidationError("Please enter a valid, deliverable email address.")
        
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        user.is_active = False  # User can't login until email is verified
        user.save()
        UserProfile.objects.create(user=user)
        
        # Attempt to send verification email; rollback user on failure
        try:
            self.send_verification_email(user)
        except Exception as exc:
            # Delete the user to prevent inactive accounts without a verification email
            try:
                user.delete()
            finally:
                raise serializers.ValidationError({"email": "Failed to send verification email. Please try again later."})
        
        return user

    def send_verification_email(self, user):
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        # Prefer backend activation endpoint directly to avoid frontend routing issues
        backend_base_url = getattr(settings, 'BACKEND_BASE_URL', 'http://127.0.0.1:8000')
        activation_link = f"{backend_base_url}/api/activate/{uid}/{token}/"
        
        # Create a more user-friendly email
        subject = 'Welcome to HomelyBites! Please verify your email'
        message = f"""
Hello {user.first_name}!

Welcome to HomelyBites! To complete your registration and start exploring delicious recipes, please click the link below to verify your email address:

{activation_link}

After clicking the link, you'll be able to log in to your account and start your culinary journey!

If you didn't create an account with HomelyBites, please ignore this email.

Best regards,
The HomelyBites Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )


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
