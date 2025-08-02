from django.contrib import admin
from .models import Recipe, UserRecipeInteraction

admin.site.register(Recipe)
admin.site.register(UserRecipeInteraction)
