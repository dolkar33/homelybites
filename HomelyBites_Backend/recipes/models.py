from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from django.utils.translation import gettext_lazy as _

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
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    ingredients = models.TextField()
    instructions = models.TextField()
    prep_time = models.IntegerField(help_text="Preparation time in minutes", null=True, blank=True)
    cook_time = models.IntegerField(help_text="Cooking time in minutes", null=True, blank=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    image_url = models.URLField(blank=True, null=True)
    categories = models.ManyToManyField(Category, related_name='recipes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    spoonacular_id = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return self.title

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    password_reset_token = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        app_label = 'recipes'
        verbose_name = _('user')
        verbose_name_plural = _('users')

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
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])],
        help_text='Upload a profile image (jpg, jpeg, png, or gif)'
    )
    favorite_categories = models.ManyToManyField(Category, blank=True, related_name='user_favorites')
    dietary_preference = models.CharField(
        max_length=50,
        choices=DIETARY_CHOICES,
        blank=True,
        null=True,
        help_text='User\'s dietary preference'
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
            self.dietary_preference = self.dietary_preference.strip().lower()
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
        