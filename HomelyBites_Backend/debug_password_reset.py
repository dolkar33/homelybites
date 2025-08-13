#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homelybites.settings')
django.setup()

from recipes.models import CustomUser, PasswordResetRequest
from recipes.services import EmailVerificationService

def debug_password_reset():
    """Debug the password reset system"""
    
    print("=== DEBUGGING PASSWORD RESET SYSTEM ===\n")
    
    try:
        # Check if PasswordResetRequest model exists
        print("1. Checking PasswordResetRequest model...")
        try:
            PasswordResetRequest.objects.all()
            print("✅ PasswordResetRequest model exists")
        except Exception as e:
            print(f"❌ PasswordResetRequest model error: {e}")
            return
        
        # Find a user to test with
        print("\n2. Finding test user...")
        try:
            user = CustomUser.objects.first()
            if user:
                print(f"✅ Found user: {user.username} ({user.email})")
            else:
                print("❌ No users found in database")
                return
        except Exception as e:
            print(f"❌ Error finding user: {e}")
            return
        
        # Check existing reset requests
        print("\n3. Checking existing reset requests...")
        existing_requests = PasswordResetRequest.objects.filter(user=user)
        print(f"Found {existing_requests.count()} existing reset requests")
        
        for req in existing_requests:
            print(f"  - Token: {req.token[:10]}..., Used: {req.is_used}, Expired: {req.is_expired()}")
        
        # Create a new password reset request
        print("\n4. Creating new password reset request...")
        try:
            reset_request = EmailVerificationService.create_password_reset_request(user)
            print(f"✅ Reset request created successfully!")
            print(f"  - Token: {reset_request.token}")
            print(f"  - Expires at: {reset_request.expires_at}")
            print(f"  - Is used: {reset_request.is_used}")
        except Exception as e:
            print(f"❌ Error creating reset request: {e}")
            return
        
        # Test token verification
        print("\n5. Testing token verification...")
        try:
            is_valid, message, verified_user = EmailVerificationService.verify_password_reset_token(reset_request.token, None)
            print(f"✅ Token verification result: {is_valid}")
            print(f"  - Message: {message}")
            print(f"  - User: {verified_user.username if verified_user else 'None'}")
        except Exception as e:
            print(f"❌ Error verifying token: {e}")
            return
        
        # Test password reset
        print("\n6. Testing password reset...")
        try:
            new_password = "TestPassword123!"
            is_valid, message, reset_user = EmailVerificationService.verify_password_reset_token(reset_request.token, new_password)
            print(f"✅ Password reset result: {is_valid}")
            print(f"  - Message: {message}")
            print(f"  - User: {reset_user.username if reset_user else 'None'}")
        except Exception as e:
            print(f"❌ Error resetting password: {e}")
            return
        
        print("\n🎉 Password reset system debug completed!")
        
    except Exception as e:
        print(f"❌ General error: {e}")

if __name__ == '__main__':
    debug_password_reset()
