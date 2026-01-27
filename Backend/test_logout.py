"""
Test script to verify logout endpoint works correctly
"""
import requests
import json

# Base URL
BASE_URL = "http://127.0.0.1:8000/api"

def test_logout():
    """Test the logout endpoint"""
    
    # First, login to get tokens
    login_data = {
        "email": "test@example.com",  # Replace with actual test user
        "password": "testpassword123"
    }
    
    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/accounts/student/login/", json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            refresh_token = login_result.get("refresh")
            access_token = login_result.get("access")
            
            print("Login successful!")
            print(f"Access token: {access_token[:20]}...")
            print(f"Refresh token: {refresh_token[:20]}...")
            
            # Now test logout
            headers = {"Authorization": f"Bearer {access_token}"}
            logout_data = {"refresh": refresh_token}
            
            logout_response = requests.post(
                f"{BASE_URL}/accounts/logout/", 
                json=logout_data,
                headers=headers
            )
            
            print(f"\nLogout Status: {logout_response.status_code}")
            print(f"Logout Response: {logout_response.json()}")
            
            if logout_response.status_code == 200:
                print("✅ Logout successful!")
            else:
                print("❌ Logout failed!")
                
        else:
            print(f"❌ Login failed: {login_response.json()}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_logout()
