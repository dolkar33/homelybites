from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Recipe, Category, UserProfile, CustomUser, 
    UserRecipeInteraction, ContactMessage, Cuisine,
    EmailVerification, EmailChangeRequest
)
from django.contrib.admin.sites import NotRegistered

# Unregister the default User model if it's already registered
from django.contrib.auth import get_user_model
try:
    admin.site.unregister(get_user_model())
except admin.sites.NotRegistered:
    pass

# Custom UserAdmin for CustomUser
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_active', 'is_email_verified', 'date_joined')
    list_filter = ('is_active', 'is_email_verified', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Email Verification', {
            'fields': ('is_email_verified',)
        }),
    )

# Register your CustomUser with custom UserAdmin
admin.site.register(CustomUser, CustomUserAdmin)

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'prep_time', 'cook_time', 'created_at')
    list_filter = ('difficulty', 'categories')
    search_fields = ('title', 'ingredients')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('categories',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'dietary_preference', 'has_completed_questions', 'last_updated', 'get_favorite_categories')
    list_filter = ('dietary_preference', 'has_completed_questions', 'last_updated')
    search_fields = ('user__username', 'user__email', 'allergies', 'dislikes')
    filter_horizontal = ('favorite_categories',)
    readonly_fields = ('last_updated',)
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'profile_image')
        }),
        ('Preferences', {
            'fields': ('dietary_preference', 'favorite_categories', 'allergies', 'dislikes')
        }),
        ('Status', {
            'fields': ('has_completed_questions', 'last_updated')
        }),
    )
    
    def get_favorite_categories(self, obj):
        return ", ".join([category.name for category in obj.favorite_categories.all()])
    get_favorite_categories.short_description = 'Favorite Categories'

@admin.register(UserRecipeInteraction)
class UserRecipeInteractionAdmin(admin.ModelAdmin):
    list_display = ('user', 'recipe', 'interaction_type', 'rating', 'timestamp')
    list_filter = ('interaction_type', 'timestamp')
    search_fields = ('user__username', 'recipe__title')
    readonly_fields = ('timestamp',)

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'created_at', 'expires_at', 'is_used')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('user__username', 'user__email', 'token')
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(EmailChangeRequest)
class EmailChangeRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'old_email', 'new_email', 'created_at', 'expires_at', 'is_used']
    list_filter = ['is_used', 'created_at']
    search_fields = ['user__username', 'user__email', 'old_email', 'new_email']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

