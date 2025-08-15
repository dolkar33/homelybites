from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Recipe, Category, UserProfile, CustomUser, 
    UserRecipeInteraction, ContactMessage, Cuisine,
    EmailVerification, EmailChangeRequest, PasswordResetRequest
)
from .utils import auto_assign_cuisines_for_recipe, _similarities_tfidf, _build_recipe_text, estimate_times_for_recipe

from django.contrib.admin.sites import NotRegistered
from django.db.models import Count

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

class HasCuisinesFilter(admin.SimpleListFilter):
    title = 'has cuisines'
    parameter_name = 'has_cuisines'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Yes'),
            ('no', 'No'),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == 'yes':
            return queryset.annotate(c_count=Count('cuisines')).filter(c_count__gt=0)
        if value == 'no':
            return queryset.annotate(c_count=Count('cuisines')).filter(c_count=0)
        return queryset

class HasCuisinesFilter(admin.SimpleListFilter):
    title = 'has cuisines'
    parameter_name = 'has_cuisines'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Yes'),
            ('no', 'No'),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == 'yes':
            return queryset.annotate(c_count=Count('cuisines')).filter(c_count__gt=0)
        if value == 'no':
            return queryset.annotate(c_count=Count('cuisines')).filter(c_count=0)
        return queryset

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'prep_time', 'cook_time', 'created_at')
    list_filter = ('difficulty', 'categories', 'cuisines', HasCuisinesFilter)
    search_fields = ('title', 'ingredients')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('categories', 'cuisines')
    actions = ['retag_selected_recipes', 'retag_selected_recipes_lenient', 'retag_missing_cuisines', 'preview_cuisine_scores', 'force_assign_top_cuisine', 'preview_time_estimates', 'auto_estimate_times_fill_missing']

    @admin.action(description="Auto-retag cuisines for selected recipes")
    def retag_selected_recipes(self, request, queryset):
        updated = 0
        results = []
        for recipe in queryset:
            assigned = auto_assign_cuisines_for_recipe(recipe)
            if assigned:
                updated += 1
                results.append(f"{recipe.slug}: {', '.join(c.slug for c in assigned)}")
        self.message_user(request, f"Retagged {updated} recipes. Details: {'; '.join(results) if results else 'none'}")

    @admin.action(description="Auto-retag cuisines (lenient: top_k=3, threshold=0.0)")
    def retag_selected_recipes_lenient(self, request, queryset):
        updated = 0
        results = []
        for recipe in queryset:
            assigned = auto_assign_cuisines_for_recipe(recipe, top_k=3, threshold=0.0)
            if assigned:
                updated += 1
                results.append(f"{recipe.slug}: {', '.join(c.slug for c in assigned)}")
        self.message_user(request, f"Retagged (lenient) {updated} recipes. Details: {'; '.join(results) if results else 'none'}")

    @admin.action(description="Auto-retag recipes with no cuisines")
    def retag_missing_cuisines(self, request, queryset):
        # Restrict to those with empty cuisines within the selection
        qs = queryset.annotate(c_count=Count('cuisines')).filter(c_count=0)
        updated = 0
        for recipe in qs:
            assigned = auto_assign_cuisines_for_recipe(recipe)
            if assigned:
                updated += 1
        self.message_user(request, f"Retagged {updated} recipes that had no cuisines.")

    @admin.action(description="Preview top cuisine scores (no changes)")
    def preview_cuisine_scores(self, request, queryset):
        lines = []
        for recipe in queryset[:20]:
            doc = _build_recipe_text(recipe)
            if not doc.strip():
                lines.append(f"{recipe.slug}: <empty text>")
                continue
            scores = sorted(_similarities_tfidf(doc), key=lambda x: x[1], reverse=True)[:3]
            pretty = ", ".join([f"{lab}:{score:.2f}" for lab, score in scores])
            lines.append(f"{recipe.slug}: {pretty}")
        msg = " | ".join(lines) if lines else "No selection"
        self.message_user(request, msg)

    @admin.action(description="Force-assign top cuisine (ignores score)")
    def force_assign_top_cuisine(self, request, queryset):
        from slugify import slugify as _slugify
        updated = 0
        details = []
        for recipe in queryset:
            doc = _build_recipe_text(recipe)
            if not doc.strip():
                details.append(f"{recipe.slug}: skipped (empty text)")
                continue
            scores = sorted(_similarities_tfidf(doc), key=lambda x: x[1], reverse=True)
            if not scores:
                details.append(f"{recipe.slug}: no scores")
                continue
            top_label, top_score = scores[0]
            name = top_label.replace('-', ' ').title()
            cuisine, _ = Cuisine.objects.get_or_create(slug=_slugify(top_label), defaults={'name': name})
            if not recipe.cuisines.filter(pk=cuisine.pk).exists():
                recipe.cuisines.add(cuisine)
                updated += 1
                details.append(f"{recipe.slug}: +{cuisine.slug} ({top_score:.2f})")
            else:
                details.append(f"{recipe.slug}: already has {cuisine.slug}")
        self.message_user(request, f"Force-assigned top cuisine to {updated} recipes. Details: {'; '.join(details[:10])}{'...' if len(details)>10 else ''}")

    @admin.action(description="Preview time estimates (no changes)")
    def preview_time_estimates(self, request, queryset):
        lines = []
        for r in queryset[:50]:
            prep, cook = estimate_times_for_recipe(r)
            cur_p = getattr(r, 'prep_time', None)
            cur_c = getattr(r, 'cook_time', None)
            lines.append(f"{r.slug}: est prep={prep}m, cook={cook}m | current prep={cur_p}, cook={cur_c}")
        msg = " | ".join(lines) if lines else "No selection"
        self.message_user(request, msg)

    @admin.action(description="Auto-estimate times (fill missing only)")
    def auto_estimate_times_fill_missing(self, request, queryset):
        updated = 0
        details = []
        for r in queryset:
            prep, cook = estimate_times_for_recipe(r)
            changed = False
            if getattr(r, 'prep_time', None) in (None, 0):
                r.prep_time = prep
                changed = True
            if getattr(r, 'cook_time', None) in (None, 0):
                r.cook_time = cook
                changed = True
            if changed:
                r.save(update_fields=['prep_time', 'cook_time'])
                updated += 1
                details.append(f"{r.slug}: set prep={r.prep_time}, cook={r.cook_time}")
        self.message_user(request, f"Estimated times for {updated} recipes (filled missing only). Details: {'; '.join(details[:10])}{'...' if len(details)>10 else ''}")

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
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

