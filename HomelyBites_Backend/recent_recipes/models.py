from django.db import models
from django.conf import settings
from recipes.models import Recipe
from homelybites import settings

class UserInteraction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recent_views')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='recent_views')
    viewed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'recipe')
        ordering = ['-viewed_at']
        
    def __str__(self):
        return f"{self.user.username} viewed {self.recipe.title} at {self.viewed_at}" 