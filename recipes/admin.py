from django.contrib import admin
from .models import Recipe, UserTastePreference

admin.site.register(Recipe)
admin.site.register(UserTastePreference)
