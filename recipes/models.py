
from django.db import models
from django.contrib.auth.models import User

class Recipe(models.Model):
    title = models.CharField(max_length=255)
    ingredients = models.TextField(blank=True)  
    instructions = models.TextField(blank=True)
    spoonacular_id = models.CharField(max_length=50, unique=True)
    image = models.URLField(max_length=500, blank=True, null=True)
    tags = models.TextField(blank=True)

    def __str__(self):
        return self.title


class UserRecipeInteraction(models.Model):
    INTERACTION_CHOICES = [
        ('like', 'Like'),
        ('view', 'View'),
        ('save', 'Save'),

        ('favorite', 'Favorite'),
        ('history', 'History'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    interaction_type = models.CharField(max_length=10, choices=INTERACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']  # Recent interactions first
        verbose_name = 'User Recipe Interaction'
        verbose_name_plural = 'User Recipe Interactions'

    def __str__(self):
        return f"{self.user.username} - {self.interaction_type} - {self.recipe.title}"
    
    from django.db import models
from django.contrib.auth.models import User

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recipe = models.ForeignKey('Recipe', on_delete=models.CASCADE)
    liked_at = models.DateTimeField(auto_now_add=True)
    

    class Meta:
        unique_together = ('user', 'recipe')  

    def __str__(self):
        return f"{self.user.username} likes {self.recipe.title}"

    
    



    


    

   
