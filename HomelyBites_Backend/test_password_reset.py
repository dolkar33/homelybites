#!/usr/bin/env python
"""
Test password reset endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_forgot_password():
    """Test forgot password endpoint"""
    print("=== TESTING FORGOT PASSWORD ===")
    
    url = f"{BASE_URL}/api/forgot-password/"
    data = {"email": "ritika@gmail.com"}
    
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Forgot password endpoint working!")
        else:
            print("❌ Forgot password endpoint failed!")
            
    except Exception as e:
        print(f"Error: {e}")

def test_reset_password(token):
    """Test reset password endpoint"""
    print(f"\n=== TESTING RESET PASSWORD WITH TOKEN: {token} ===")
    
    url = f"{BASE_URL}/api/reset-password/{token}/"
    data = {
        "new_password": "newpassword123",
        "confirm_password": "newpassword123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Reset password endpoint working!")
        else:
            print("❌ Reset password endpoint failed!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Password Reset System...")
    
    # Test forgot password
    test_forgot_password()
    
    # Test reset password with your token
    token = "b_mdsllA5lBq0P8Evv-ljkOxCcU2WsMUOqTjq7ayZXw"
    test_reset_password(token)
    
    print("\n=== TESTING COMPLETE ===")
