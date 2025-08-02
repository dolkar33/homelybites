from django.db import models
from django.core.validators import FileExtensionValidator
from django.utils import timezone
from recipes.models import CustomUser


class Tag(models.Model):
    """Model for hashtags/tags used in posts"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"#{self.name}"
    
    class Meta:
        ordering = ['name']


class Post(models.Model):
    """Model for community posts"""
    CATEGORY_CHOICES = [
        ('recipe', 'Recipe'),
        ('tip', 'Cooking Tip'),
        ('review', 'Restaurant Review'),
        ('general', 'General Discussion'),
        ('question', 'Question'),
    ]
    
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(
        upload_to='community_posts/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif'])]
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    tags = models.ManyToManyField(Tag, through='PostTag', blank=True)
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} by {self.author.username}"
    
    def update_likes_count(self):
        """Update the likes count based on actual likes"""
        self.likes_count = self.likes.count()
        self.save(update_fields=['likes_count'])
    
    class Meta:
        ordering = ['-created_at']


class PostTag(models.Model):
    """Through model for Post-Tag many-to-many relationship"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('post', 'tag')


class Follow(models.Model):
    """Model for user following relationships"""
    follower = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='following'
    )
    following = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='followers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"
    
    class Meta:
        unique_together = ('follower', 'following')
        constraints = [
            models.CheckConstraint(
                check=~models.Q(follower=models.F('following')),
                name='prevent_self_follow'
            )
        ]


class Like(models.Model):
    """Model for post likes"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='liked_posts')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} likes {self.post.title}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the post's likes count
        self.post.update_likes_count()
    
    def delete(self, *args, **kwargs):
        post = self.post
        super().delete(*args, **kwargs)
        # Update the post's likes count after deletion
        post.update_likes_count()
    
    class Meta:
        unique_together = ('user', 'post')


class SavedPost(models.Model):
    """Model for saved posts"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='saved_posts')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} saved {self.post.title}"
    
    class Meta:
        unique_together = ('user', 'post')
        ordering = ['-created_at']


class SuggestedUser(models.Model):
    """Model for user suggestions based on interests and activity"""
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='suggestions_for'
    )
    suggested_user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='suggested_to'
    )
    reason = models.CharField(
        max_length=100, 
        help_text="Reason for suggestion (e.g., 'similar interests', 'mutual followers')"
    )
    score = models.FloatField(
        default=0.0, 
        help_text="Relevance score for the suggestion"
    )
    is_dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Suggest {self.suggested_user.username} to {self.user.username}"
    
    class Meta:
        unique_together = ('user', 'suggested_user')
        ordering = ['-score', '-created_at']
        constraints = [
            models.CheckConstraint(
                check=~models.Q(user=models.F('suggested_user')),
                name='prevent_self_suggestion'
            )
        ]
