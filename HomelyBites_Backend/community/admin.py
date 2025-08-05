from django.contrib import admin
from django.db.models import Count
from .models import Post, Tag, PostTag, Follow, Like, SavedPost, SuggestedUser


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at', 'post_count']
    search_fields = ['name']
    readonly_fields = ['created_at']
    prepopulated_fields = {'slug': ('name',)}
    
    def post_count(self, obj):
        return obj.post_set.count()
    post_count.short_description = 'Posts Count'


class PostTagInline(admin.TabularInline):
    model = PostTag
    extra = 1


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'likes_count', 'created_at']
    list_filter = ['category', 'created_at', 'author']
    search_fields = ['title', 'description', 'author__username']
    readonly_fields = ['likes_count', 'created_at', 'updated_at']
    inlines = [PostTagInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('author')


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'following', 'created_at']
    list_filter = ['created_at']
    search_fields = ['follower__username', 'following__username']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('follower', 'following')


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__title']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post')


@admin.register(SavedPost)
class SavedPostAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__title']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'post')


@admin.register(SuggestedUser)
class SuggestedUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'suggested_user', 'reason', 'score', 'is_dismissed', 'created_at']
    list_filter = ['is_dismissed', 'reason', 'created_at']
    search_fields = ['user__username', 'suggested_user__username']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'suggested_user')
