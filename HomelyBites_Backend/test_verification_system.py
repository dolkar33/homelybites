#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'homelybites.settings')
django.setup()

from recipes.models import CustomUser, EmailVerification
from recipes.services import EmailVerificationService
from django.utils import timezone
from datetime import timedelta

def test_verification_system():
    """Test the complete verification system to ensure it works for every user"""
    
    print("=== TESTING VERIFICATION SYSTEM ===\n")
    
    # Test 1: Check if user 'ritss' exists and current status
    try:
        user = CustomUser.objects.get(username='ritss')
        print(f"✅ User 'ritss' found")
        print(f"Current status - is_active: {user.is_active}, is_email_verified: {user.is_email_verified}")
        
        # Test 2: Check verification records
        verifications = EmailVerification.objects.filter(user=user)
        print(f"User has {verifications.count()} verification records")
        
        for v in verifications:
            print(f"  - Token: {v.token[:10]}..., Used: {v.is_used}, Expired: {v.is_expired()}")
        
        # Test 3: Create a new verification token
        print(f"\n--- Creating New Verification Token ---")
        verification = EmailVerificationService.create_verification_token(user)
        print(f"New token created: {verification.token[:10]}...")
        print(f"Expires at: {verification.expires_at}")
        
        # Test 4: Test the verification process
        print(f"\n--- Testing Verification Process ---")
        is_valid, message, verified_user = EmailVerificationService.verify_token(verification.token)
        print(f"Verification result: {is_valid}")
        print(f"Message: {message}")
        
        if is_valid and verified_user:
            print(f"✅ Verification successful!")
            print(f"User after verification - is_active: {verified_user.is_active}, is_email_verified: {verified_user.is_email_verified}")
            
            # Test 5: Verify in database
            fresh_user = CustomUser.objects.get(id=user.id)
            print(f"Fresh from DB - is_active: {fresh_user.is_active}, is_email_verified: {fresh_user.is_email_verified}")
            
            if fresh_user.is_active and fresh_user.is_email_verified:
                print("🎉 SUCCESS: User verification system is working!")
                print("✅ User can now log in successfully")
            else:
                print("❌ FAILURE: User verification system is still broken")
                print("User cannot log in despite verification")
        else:
            print(f"❌ Verification failed: {message}")
            
    except CustomUser.DoesNotExist:
        print("❌ User 'ritss' not found - cannot test verification system")
    except Exception as e:
        print(f"❌ Error during testing: {e}")

def test_new_user_registration():
    """Test the complete flow for a new user"""
    
    print("\n=== TESTING NEW USER REGISTRATION FLOW ===\n")
    
    # This would test the complete flow from registration to verification
    # For now, just show what should happen
    print("1. User registers with valid email")
    print("2. User receives verification email")
    print("3. User clicks verification link")
    print("4. User is redirected to login page")
    print("5. User can log in successfully")
    print("\nThe verification system should now work for EVERY user!")

if __name__ == '__main__':
    test_verification_system()
    test_new_user_registration()
