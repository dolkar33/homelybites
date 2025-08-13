from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
import re

def validate_email_format(email):
    """Validate email format and check for common disposable email domains"""
    # Basic email format validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValidationError('Please enter a valid email address.')
    
    # Temporarily disable strict validation to fix registration
    return email
    
    # Check for disposable email domains (disabled temporarily)
    # disposable_domains = {
    #     'tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    #     'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getairmail.com',
    #     'mailnesia.com', 'mintemail.com', 'spam4.me', 'bccto.me', 'chacuo.net',
    #     'dispostable.com', 'maildrop.cc', 'mailnesia.com', 'mintemail.com',
    #     'spam4.me', 'bccto.me', 'chacuo.net', 'dispostable.com', 'maildrop.cc',
    #     'temp-mail.org', 'fakeinbox.com', 'sharklasers.com', 'guerrillamailblock.com',
    #     'pokemail.net', 'spamspot.com', 'binkmail.com', 'bobmail.info',
    #     'chammy.info', 'discard.email', 'dispostable.com', 'emailondeck.com',
    #     'fakeinbox.net', 'getairmail.com', 'maildrop.cc', 'mailinator.net',
    #     'mailmetrash.com', 'mintemail.com', 'mytrashmail.com', 'nwldx.com',
    #     'sharklasers.com', 'spam4.me', 'tempmailaddress.com', 'throwawayemail.com',
    #     'trashmail.net', 'wegwerfemail.de', 'yopmail.net', 'zomg.info',
    #     'mailnesia.com', 'bccto.me', 'chacuo.net', 'dispostable.com',
    #     'maildrop.cc', 'mailnesia.com', 'mintemail.com', 'spam4.me',
    #     'bccto.me', 'chacuo.net', 'dispostable.com', 'maildrop.cc'
    # }
    
    # domain = email.split('@')[1].lower()
    # if domain in disposable_domains:
    #     raise ValidationError('Disposable email addresses are not allowed. Please use a legitimate email address.')
    
    # Check for suspicious patterns (disabled temporarily)
    # suspicious_patterns = [
    #     r'^[a-z]{1,2}\d{1,3}@',  # Very short username with numbers
    #     r'^test\d*@',  # Test emails
    #     r'^admin\d*@',  # Admin emails
    #     r'^user\d*@',  # Generic user emails
    #     r'^demo\d*@',  # Demo emails
    #     r'^temp\d*@',  # Temporary emails
    #     r'^fake\d*@',  # Fake emails
    #     r'^spam\d*@',  # Spam emails
    # ]
    
    # for pattern in suspicious_patterns:
    #     if re.match(pattern, email.lower()):
    #         raise ValidationError('Suspicious email patterns are not allowed. Please use a legitimate email address.')
    
    # Check for common legitimate domains (whitelist approach for extra security) (disabled temporarily)
    # legitimate_domains = {
    #     'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    #     'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
    #     'tutanota.com', 'zoho.com', 'yandex.com', 'mail.ru', 'qq.com',
    #     '163.com', '126.com', 'sina.com', 'sohu.com', 'naver.com',
    #     'daum.net', 'hanmail.net', 'rediffmail.com', 'indiatimes.com',
    #     'sify.com', 'vsnl.net', 'bsnl.in', 'airtel.in', 'jio.com',
    #     'vodafone.in', 'idea.co.in', 'mtnl.net.in', 'bharatmail.com'
    # }
    
    # Allow legitimate domains and warn about others
    # if domain not in legitimate_domains:
    #     # Log suspicious domains for monitoring
    #     print(f"Warning: Unusual email domain detected: {domain}")
    
    # return email

class Cuisine(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Cuisines"

def validate_image_size(image):
    max_size = 5 * 1024 * 1024  # 5MB
    if image.size > max_size:
        from django.core.exceptions import ValidationError
        raise ValidationError("Image size cannot exceed 5MB")

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"

class Recipe(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    cuisines = models.ManyToManyField('Cuisine', related_name='recipes', blank=True)
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    ingredients = models.TextField(null=True, blank=True)
    instructions = models.TextField()
    prep_time = models.IntegerField(help_text="Preparation time in minutes", null=True, blank=True)
    cook_time = models.IntegerField(help_text="Cooking time in minutes", null=True, blank=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    image_url = models.URLField(blank=True, null=True)
    categories = models.ManyToManyField(Category, related_name='recipes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    spoonacular_id = models.IntegerField(null=True, blank=True)

    # Nutritional Information fields
    calories = models.CharField(max_length=50, blank=True, null=True)
    fat = models.CharField(max_length=50, blank=True, null=True)
    sugar = models.CharField(max_length=50, blank=True, null=True)
    protein = models.CharField(max_length=50, blank=True, null=True)
    carbohydrates = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return self.title

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True, validators=[validate_email_format])
    password_reset_token = models.CharField(max_length=100, null=True, blank=True)
    is_email_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(
        upload_to='profile_images/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif']), validate_image_size]
    )
    bio = models.TextField(blank=True)
    posts_count = models.IntegerField(default=0)
    following_count = models.IntegerField(default=0)
    followers_count = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.profile_picture:
            try:
                from PIL import Image
                img = Image.open(self.profile_picture.path)
                if img.height > 400 or img.width > 400:
                    output_size = (400, 400)
                    img.thumbnail(output_size, Image.Resampling.LANCZOS)
                    img.save(self.profile_picture.path, quality=85, optimize=True)
            except Exception:
                pass

    class Meta:
        app_label = 'recipes'
        verbose_name = _('user')
        verbose_name_plural = _('users')

def validate_image_size(image):
    max_size = 5 * 1024 * 1024  # 5MB
    if image.size > max_size:
        from django.core.exceptions import ValidationError
        raise ValidationError("Image size cannot exceed 5MB")

class UserProfile(models.Model):
    DIETARY_CHOICES = [
        ('vegetarian', 'Vegetarian'),
        ('vegan', 'Vegan'),
        ('pescatarian', 'Pescatarian'),
        ('gluten-free', 'Gluten Free'),
        ('dairy-free', 'Dairy Free'),
        ('keto', 'Keto'),
        ('paleo', 'Paleo'),
        ('none', 'No Specific Plan'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    profile_image = models.ImageField(
        upload_to='profile_images/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif']), validate_image_size],
        help_text='Upload a profile image (jpg, jpeg, png, or gif)'
    )
    favorite_categories = models.ManyToManyField(Category, blank=True, related_name='user_favorites')
    dietary_preference = models.TextField(
        blank=True,
        null=True,
        help_text='User\'s dietary preferences (comma-separated)'
    )
    allergies = models.TextField(
        blank=True,
        null=True,
        help_text='List of user\'s allergies'
    )
    dislikes = models.TextField(
        blank=True,
        null=True,
        help_text='List of foods user dislikes'
    )
    has_completed_questions = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"

    def save(self, *args, **kwargs):
        # Clean and validate data before saving
        if self.dietary_preference:
            # Convert to lowercase and strip whitespace
            preferences = [p.strip().lower() for p in self.dietary_preference.split(',')]
            # Remove duplicates and join back
            self.dietary_preference = ','.join(list(dict.fromkeys(preferences)))
        if self.allergies:
            self.allergies = self.allergies.strip()
        if self.dislikes:
            self.dislikes = self.dislikes.strip()
            
        # Handle profile image cleanup
        if self.pk:
            try:
                old_instance = UserProfile.objects.get(pk=self.pk)
                if old_instance.profile_image and old_instance.profile_image != self.profile_image:
                    old_instance.profile_image.delete(save=False)
            except UserProfile.DoesNotExist:
                pass
                
        super().save(*args, **kwargs)
        # Auto-resize profile image
        if self.profile_image:
            try:
                from PIL import Image
                img = Image.open(self.profile_image.path)
                if img.height > 400 or img.width > 400:
                    output_size = (400, 400)
                    img.thumbnail(output_size, Image.Resampling.LANCZOS)
                    img.save(self.profile_image.path, quality=85, optimize=True)
            except Exception:
                pass

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['-last_updated']

class UserRecipeInteraction(models.Model):
    INTERACTION_TYPES = [
        ('view', 'Viewed'),
        ('save', 'Saved'),
        ('rate', 'Rated'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='recipe_interactions')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='user_interactions')
    interaction_type = models.CharField(max_length=10, choices=INTERACTION_TYPES)
    rating = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'recipe', 'interaction_type')

class ContactMessage(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message from {self.name} - {self.subject}"
    
    class Meta:
        ordering = ['-created_at']


class EmailVerification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def __str__(self):
        return f"Email verification for {self.user.email}"


class EmailChangeRequest(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    old_email = models.EmailField()
    new_email = models.EmailField()
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def __str__(self):
        return f"Email change request for {self.user.username}: {self.old_email} -> {self.new_email}"


class PasswordResetRequest(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def __str__(self):
        return f"Password reset request for {self.user.username}"        
        