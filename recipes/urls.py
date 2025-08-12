from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # JWT Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Core recommendation endpoint
    path('recommendations/you-would-love/', views.recipes_you_would_love, name='recipes_you_would_love'),
    
    # User preferences management
    path('preferences/', views.UserTastePreferenceView.as_view(), name='user-preferences'),
]
