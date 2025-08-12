#!/usr/bin/env python
"""
Test script to debug the registration process and see what's causing the 400 error.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homelybites.settings')
django.setup()

from django.conf import settings
from recipes.serializers import UserRegistrationSerializer
from rest_framework.test import APIRequestFactory
from rest_framework import status

def test_registration_flow():
    """Test the registration flow to identify issues."""
    
    print("🧪 Testing Registration Flow...")
    print("=" * 50)
    
    # Test 1: Check API key configuration
    print("1. Checking Abstract API key configuration...")
    api_key = getattr(settings, 'ABSTRACT_API_KEY', None)
    if api_key and api_key != 'your_actual_abstract_api_key_here':
        print(f"   ✅ API key is configured: {api_key[:10]}...")
    else:
        print("   ❌ API key is not configured or using placeholder")
        print("   Please get your API key from: https://www.abstractapi.com/email-verification-validation-api")
        return
    
    # Test 2: Test serializer validation
    print("\n2. Testing serializer validation...")
    
    # Sample registration data
    test_data = {
        'username': 'testuser123',
        'email': 'john.doe@gmail.com',
        'password': 'TestPass123!',
        'password2': 'TestPass123!',
        'first_name': 'John',
        'last_name': 'Doe'
    }
    
    try:
        serializer = UserRegistrationSerializer(data=test_data)
        if serializer.is_valid():
            print("   ✅ Serializer validation passed")
            print(f"   Validated data: {serializer.validated_data}")
        else:
            print("   ❌ Serializer validation failed")
            print(f"   Errors: {serializer.errors}")
            
            # Check specific field errors
            for field, errors in serializer.errors.items():
                print(f"   Field '{field}': {errors}")
                
    except Exception as e:
        print(f"   ❌ Exception during validation: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Test 3: Test email validation specifically
    print("\n3. Testing email validation...")
    try:
        email_validator = UserRegistrationSerializer()
        validated_email = email_validator.validate_email('john.doe@gmail.com')
        print(f"   ✅ Email validation passed: {validated_email}")
    except Exception as e:
        print(f"   ❌ Email validation failed: {str(e)}")
        import traceback
        traceback.print_exc()

def test_without_api_key():
    """Test what happens when API key is not configured."""
    
    print("\n🔑 Testing without API key...")
    print("=" * 30)
    
    # Temporarily remove API key
    original_key = settings.ABSTRACT_API_KEY
    settings.ABSTRACT_API_KEY = None
    
    try:
        email_validator = UserRegistrationSerializer()
        validated_email = email_validator.validate_email('john.doe@gmail.com')
        print(f"   ✅ Email validation passed: {validated_email}")
    except Exception as e:
        print(f"   ❌ Email validation failed: {str(e)}")
    
    # Restore original key
    settings.ABSTRACT_API_KEY = original_key

if __name__ == '__main__':
    print("🚀 Starting registration debugging...")
    print()
    
    test_registration_flow()
    test_without_api_key()
    
    print("\n✨ Debugging completed!")
    print("\n📝 Next steps:")
    print("1. Get your Abstract API key from https://www.abstractapi.com/email-verification-validation-api")
    print("2. Update the ABSTRACT_API_KEY in your settings.py")
    print("3. Test registration again")

