#!/usr/bin/env python
"""
Simple test to verify Abstract API email validation is working.
"""

import os
import django
import requests

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homelybites.settings')
django.setup()

from django.conf import settings

def test_abstract_api():
    """Test the Abstract API directly."""
    
    print("🧪 Testing Abstract API Email Validation...")
    print("=" * 50)
    
    api_key = getattr(settings, 'ABSTRACT_API_KEY', None)
    print(f"API Key: {api_key[:10]}..." if api_key else "No API key found")
    
    # Test cases
    test_emails = [
        'john.doe@gmail.com',  # Should be DELIVERABLE
        'fake@tempmail.org',   # Should be NOT_DELIVERABLE
        'test@example.com',    # Should be NOT_DELIVERABLE
        'user123@test.com',    # Should be NOT_DELIVERABLE
    ]
    
    for email in test_emails:
        print(f"\nTesting: {email}")
        
        try:
            response = requests.get(
                "https://emailvalidation.abstractapi.com/v1/",
                params={"api_key": api_key, "email": email},
                timeout=10,
            )
            
            if response.ok:
                data = response.json()
                deliverability = data.get('deliverability', 'UNKNOWN')
                print(f"  ✅ Response: {deliverability}")
                
                if deliverability == 'DELIVERABLE':
                    print(f"  ✅ {email} is a valid email")
                else:
                    print(f"  ❌ {email} is NOT a valid email")
                    
            else:
                print(f"  ❌ API Error: {response.status_code}")
                print(f"  Response: {response.text}")
                
        except Exception as e:
            print(f"  ❌ Exception: {str(e)}")

if __name__ == '__main__':
    test_abstract_api()
