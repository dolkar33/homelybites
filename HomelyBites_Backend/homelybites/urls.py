"""
URL configuration for homelybites project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from recipes.views import ContactMessageViewSet
from rest_framework import routers
from django.http import HttpResponse

router = routers.DefaultRouter()
router.register(r'contact-messages', ContactMessageViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('recipes.urls')),
    path('api/', include(router.urls)),
    
    # Simple activation result pages
    path('activation-success/', lambda request: HttpResponse('Email verified successfully! You can now log in. <a href="/login">Go to Login</a>')),
    path('activation-error/', lambda request: HttpResponse('Activation failed. Please check your email or try registering again. <a href="/register">Register Again</a>')),
    
    # Email change result pages
    path('email-change-success/', lambda request: HttpResponse('Email changed successfully! Your new email is now active. <a href="/login">Go to Login</a>')),
    path('email-change-error/', lambda request: HttpResponse('Email change failed. Please try updating your profile again. <a href="/profile">Update Profile</a>')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
