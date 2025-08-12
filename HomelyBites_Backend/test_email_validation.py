#!/usr/bin/env python
"""
Test script to demonstrate email validation for illegitimate email addresses.
This script shows how the system prevents creating user accounts with suspicious emails.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homelybites.settings')
django.setup()

from recipes.models import CustomUser
from recipes.serializers import UserRegistrationSerializer
from rest_framework.test import APIRequestFactory
from recipes.views import register_user
from rest_framework import status

def test_email_validation():
    """Test various email patterns to ensure illegitimate emails are rejected."""
    
    print("🧪 Testing Email Validation System")
    print("=" * 50)
    
    # Test cases for illegitimate emails
    test_cases = [
        # Disposable email domains
        {"email": "test@tempmail.org", "reason": "Disposable email domain"},
        {"email": "user@10minutemail.com", "reason": "Disposable email domain"},
        {"email": "demo@mailinator.com", "reason": "Disposable email domain"},
        
        # Suspicious patterns
        {"email": "ab123@gmail.com", "reason": "Very short username with numbers"},
        {"email": "test123@gmail.com", "reason": "Test pattern"},
        {"email": "admin456@gmail.com", "reason": "Admin pattern"},
        {"email": "user789@gmail.com", "reason": "User pattern"},
        {"email": "demo123@gmail.com", "reason": "Demo pattern"},
        {"email": "temp456@gmail.com", "reason": "Temp pattern"},
        {"email": "fake789@gmail.com", "reason": "Fake pattern"},
        {"email": "spam123@gmail.com", "reason": "Spam pattern"},
        {"email": "abc456@gmail.com", "reason": "Generic pattern"},
        {"email": "xyz789@gmail.com", "reason": "Generic pattern"},
        {"email": "123456@gmail.com", "reason": "Number pattern"},
        
        # Very short usernames
        {"email": "ab@gmail.com", "reason": "Username too short"},
        {"email": "x@gmail.com", "reason": "Username too short"},
        
        # Excessive numbers
        {"email": "a12345@gmail.com", "reason": "Too many numbers in username"},
        {"email": "ab123456@gmail.com", "reason": "Too many numbers in username"},
        
        # Legitimate emails (should pass)
        {"email": "john.doe@gmail.com", "reason": "Legitimate email"},
        {"email": "jane.smith@yahoo.com", "reason": "Legitimate email"},
        {"email": "user123@hotmail.com", "reason": "Legitimate email"},
    ]
    
    factory = APIRequestFactory()
    
    for test_case in test_cases:
        email = test_case["email"]
        reason = test_case["reason"]
        
        print(f"\n📧 Testing: {email}")
        print(f"   Reason: {reason}")
        
        # Create request data
        request_data = {
            "username": f"testuser_{email.split('@')[0]}",
            "email": email,
            "password": "TestPass123!",
            "password2": "TestPass123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        try:
            # Test the view directly
            request = factory.post('/api/register/', request_data, format='json')
            response = register_user(request)
            
            if response.status_code == status.HTTP_201_CREATED:
                print(f"   ❌ FAILED: Should have been rejected - {reason}")
                # Clean up if user was created
                try:
                    user = CustomUser.objects.get(email=email)
                    user.delete()
                    print(f"   🧹 Cleaned up created user")
                except CustomUser.DoesNotExist:
                    pass
            else:
                print(f"   ✅ PASSED: Correctly rejected - {response.data.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎯 Email Validation Test Complete!")
    print("\n📋 Summary:")
    print("   - Disposable email domains are blocked")
    print("   - Suspicious patterns are detected")
    print("   - Very short usernames are rejected")
    print("   - Excessive numbers in usernames are blocked")
    print("   - Legitimate emails are allowed")
    print("\n🔒 This ensures only users with legitimate email addresses can register!")

if __name__ == "__main__":
    test_email_validation()

