from django.contrib import admin
from .models import Recipe, Category, UserProfile, UserRecipeInteraction, ContactMessage

# Register your models here.

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
    list_display = ('user', 'get_favorite_categories')
    filter_horizontal = ('favorite_categories',)
    
    def get_favorite_categories(self, obj):
        return ", ".join([category.name for category in obj.favorite_categories.all()])
    get_favorite_categories.short_description = 'Favorite Categories'

@admin.register(UserRecipeInteraction)
class UserRecipeInteractionAdmin(admin.ModelAdmin):
    list_display = ('user', 'recipe', 'interaction_type', 'rating', 'timestamp')
    list_filter = ('interaction_type', 'timestamp')
    search_fields = ('user__username', 'recipe__title')

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
