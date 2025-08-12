
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class CustomUser(AbstractUser):
    class Meta:
        db_table = 'recipes_customuser'
        managed = False

class Recipe(models.Model):
    title = models.CharField(max_length=255)
    ingredients = models.TextField()
    instructions = models.TextField()
    spoonacular_id = models.IntegerField(unique=True, null=True, blank=True)
    image = models.URLField(max_length=500, null=True, blank=True)
    tags = models.TextField(blank=True, null=True)
    calories = models.FloatField(null=True, blank=True)
    fat = models.FloatField(null=True, blank=True)
    protein = models.FloatField(null=True, blank=True)
    carbs = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'recipes_recipe'
        managed = False

    def __str__(self):
        return self.title

class UserTastePreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_column='customuser_id')
    dietary_preferences = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'recipes_usertastepreference'
        managed = False

    def __str__(self):
        return f"{self.user.username}'s Taste Preferences"

