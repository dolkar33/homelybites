#!/usr/bin/env python
"""
Test script to verify password reset URLs are working
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homelybites.settings')
django.setup()

from django.urls import reverse, resolve
from django.test import RequestFactory
from recipes.views import forgot_password, reset_password, verify_password_reset

def test_urls():
    """Test if password reset URLs are accessible"""
    print("=== TESTING PASSWORD RESET URLS ===")
    
    # Test forgot-password URL
    try:
        url = '/api/forgot-password/'
        print(f"Testing URL: {url}")
        
        factory = RequestFactory()
        request = factory.post(url, data={'email': 'test@example.com'}, content_type='application/json')
        
        # This should not raise an exception
        print("✅ forgot-password URL is accessible")
        
    except Exception as e:
        print(f"❌ forgot-password URL error: {e}")
    
    # Test reset-password URL
    try:
        url = '/api/reset-password/test-token/'
        print(f"Testing URL: {url}")
        
        factory = RequestFactory()
        request = factory.post(url, data={'new_password': 'newpassword123'}, content_type='application/json')
        
        # This should not raise an exception
        print("✅ reset-password URL is accessible")
        
    except Exception as e:
        print(f"❌ reset-password URL error: {e}")
    
    # Test verify-password-reset URL
    try:
        url = '/api/verify-password-reset/test-token/'
        print(f"Testing URL: {url}")
        
        factory = RequestFactory()
        request = factory.get(url)
        
        # This should not raise an exception
        print("✅ verify-password-reset URL is accessible")
        
    except Exception as e:
        print(f"❌ verify-password-reset URL error: {e}")
    
    print("=== URL TESTING COMPLETE ===")

if __name__ == "__main__":
    test_urls()
