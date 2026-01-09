#!/usr/bin/env python3
"""
Backend Authentication API Testing
Tests the authentication endpoints as requested:
1. POST /api/auth/register - Create new user
2. POST /api/auth/login - Login user  
3. GET /api/auth/me - Get current user info
4. Verify CORS headers are present
"""

import requests
import json
import sys
from datetime import datetime
import time

# Get backend URL from environment (using the configured URL)
BACKEND_URL = "https://api-connector-37.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{status}] {message}")

def check_cors_headers(response):
    """Check if CORS headers are present in response"""
    cors_headers = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
    }
    
    missing_headers = []
    for header, value in cors_headers.items():
        if not value:
            missing_headers.append(header)
        else:
            log_test(f"  ✅ {header}: {value}")
    
    if missing_headers:
        log_test(f"  ⚠️ Missing CORS headers: {missing_headers}", "WARNING")
        return False
    else:
        log_test("  ✅ All required CORS headers present")
        return True

def test_register_endpoint():
    """Test POST /api/auth/register endpoint"""
    log_test("Testing POST /api/auth/register endpoint")
    
    # Create unique test user with timestamp
    timestamp = int(time.time())
    test_email = f"test-user-{timestamp}@example.com"
    test_password = "Test123!"
    test_full_name = "Test User"
    
    url = f"{API_BASE}/auth/register"
    payload = {
        "email": test_email,
        "password": test_password,
        "full_name": test_full_name
    }
    
    log_test(f"Making POST request to: {url}")
    log_test(f"Test user email: {test_email}")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        # Check CORS headers
        log_test("Checking CORS headers:")
        cors_ok = check_cors_headers(response)
        
        # Check status code (should be 201 for register)
        if response.status_code != 201:
            log_test(f"❌ Expected status 201, got {response.status_code}", "ERROR")
            log_test(f"Response body: {response.text}", "ERROR")
            return None, False
        
        log_test("✅ Correct status code 201 (Created)")
        
        # Parse response
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            log_test(f"❌ Failed to parse JSON response: {str(e)}", "ERROR")
            return None, False
        
        # Verify response structure
        required_fields = ["access_token", "user"]
        missing_fields = []
        
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            log_test(f"❌ Missing required fields in response: {missing_fields}", "ERROR")
            return None, False
        
        # Verify access_token
        access_token = data.get("access_token")
        if not access_token or len(access_token) < 10:
            log_test(f"❌ Invalid access_token: {access_token}", "ERROR")
            return None, False
        
        log_test(f"✅ Valid access_token received (length: {len(access_token)})")
        
        # Verify user object
        user = data.get("user", {})
        user_required_fields = ["id", "email", "full_name", "role"]
        user_missing_fields = []
        
        for field in user_required_fields:
            if field not in user:
                user_missing_fields.append(field)
        
        if user_missing_fields:
            log_test(f"❌ Missing required user fields: {user_missing_fields}", "ERROR")
            return None, False
        
        # Verify user data matches input
        if user.get("email") != test_email:
            log_test(f"❌ User email mismatch: expected {test_email}, got {user.get('email')}", "ERROR")
            return None, False
        
        if user.get("full_name") != test_full_name:
            log_test(f"❌ User full_name mismatch: expected {test_full_name}, got {user.get('full_name')}", "ERROR")
            return None, False
        
        log_test(f"✅ User object correct: {user.get('email')}, {user.get('full_name')}")
        log_test(f"✅ User ID: {user.get('id')}")
        log_test(f"✅ User role: {user.get('role')}")
        
        # Return test credentials and success status
        test_credentials = {
            "email": test_email,
            "password": test_password,
            "access_token": access_token,
            "user": user
        }
        
        return test_credentials, cors_ok
        
    except requests.exceptions.RequestException as e:
        log_test(f"❌ Request failed: {str(e)}", "ERROR")
        return None, False
    except Exception as e:
        log_test(f"❌ Unexpected error: {str(e)}", "ERROR")
        return None, False

def test_login_endpoint(test_credentials):
    """Test POST /api/auth/login endpoint"""
    log_test("Testing POST /api/auth/login endpoint")
    
    if not test_credentials:
        log_test("❌ No test credentials available from register test", "ERROR")
        return None, False
    
    url = f"{API_BASE}/auth/login"
    payload = {
        "email": test_credentials["email"],
        "password": test_credentials["password"]
    }
    
    log_test(f"Making POST request to: {url}")
    log_test(f"Login email: {test_credentials['email']}")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        # Check CORS headers
        log_test("Checking CORS headers:")
        cors_ok = check_cors_headers(response)
        
        # Check status code (should be 200 for login)
        if response.status_code != 200:
            log_test(f"❌ Expected status 200, got {response.status_code}", "ERROR")
            log_test(f"Response body: {response.text}", "ERROR")
            return None, False
        
        log_test("✅ Correct status code 200 (OK)")
        
        # Parse response
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            log_test(f"❌ Failed to parse JSON response: {str(e)}", "ERROR")
            return None, False
        
        # Verify response structure (same as register)
        required_fields = ["access_token", "user"]
        missing_fields = []
        
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            log_test(f"❌ Missing required fields in response: {missing_fields}", "ERROR")
            return None, False
        
        # Verify access_token
        access_token = data.get("access_token")
        if not access_token or len(access_token) < 10:
            log_test(f"❌ Invalid access_token: {access_token}", "ERROR")
            return None, False
        
        log_test(f"✅ Valid access_token received (length: {len(access_token)})")
        
        # Verify user object
        user = data.get("user", {})
        if user.get("email") != test_credentials["email"]:
            log_test(f"❌ User email mismatch: expected {test_credentials['email']}, got {user.get('email')}", "ERROR")
            return None, False
        
        # Verify user ID matches (should be same user)
        if user.get("id") != test_credentials["user"]["id"]:
            log_test(f"❌ User ID mismatch: expected {test_credentials['user']['id']}, got {user.get('id')}", "ERROR")
            return None, False
        
        log_test(f"✅ Login successful for user: {user.get('email')}")
        log_test(f"✅ User ID matches: {user.get('id')}")
        
        # Return updated credentials with new token
        login_credentials = {
            "email": test_credentials["email"],
            "password": test_credentials["password"],
            "access_token": access_token,
            "user": user
        }
        
        return login_credentials, cors_ok
        
    except requests.exceptions.RequestException as e:
        log_test(f"❌ Request failed: {str(e)}", "ERROR")
        return None, False
    except Exception as e:
        log_test(f"❌ Unexpected error: {str(e)}", "ERROR")
        return None, False

def test_me_endpoint(login_credentials):
    """Test GET /api/auth/me endpoint"""
    log_test("Testing GET /api/auth/me endpoint")
    
    if not login_credentials:
        log_test("❌ No login credentials available", "ERROR")
        return False
    
    url = f"{API_BASE}/auth/me"
    headers = {
        "Authorization": f"Bearer {login_credentials['access_token']}"
    }
    
    log_test(f"Making GET request to: {url}")
    log_test("Using Authorization header with Bearer token")
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        # Check CORS headers
        log_test("Checking CORS headers:")
        cors_ok = check_cors_headers(response)
        
        # Check status code (should be 200)
        if response.status_code != 200:
            log_test(f"❌ Expected status 200, got {response.status_code}", "ERROR")
            log_test(f"Response body: {response.text}", "ERROR")
            return False
        
        log_test("✅ Correct status code 200 (OK)")
        
        # Parse response
        try:
            user_data = response.json()
        except json.JSONDecodeError as e:
            log_test(f"❌ Failed to parse JSON response: {str(e)}", "ERROR")
            return False
        
        # Verify user data structure
        user_required_fields = ["id", "email", "full_name", "role"]
        missing_fields = []
        
        for field in user_required_fields:
            if field not in user_data:
                missing_fields.append(field)
        
        if missing_fields:
            log_test(f"❌ Missing required user fields: {missing_fields}", "ERROR")
            return False
        
        # Verify user data matches login credentials
        if user_data.get("email") != login_credentials["email"]:
            log_test(f"❌ Email mismatch: expected {login_credentials['email']}, got {user_data.get('email')}", "ERROR")
            return False
        
        if user_data.get("id") != login_credentials["user"]["id"]:
            log_test(f"❌ User ID mismatch: expected {login_credentials['user']['id']}, got {user_data.get('id')}", "ERROR")
            return False
        
        log_test(f"✅ User info correct: {user_data.get('email')}")
        log_test(f"✅ User ID: {user_data.get('id')}")
        log_test(f"✅ Full name: {user_data.get('full_name')}")
        log_test(f"✅ Role: {user_data.get('role')}")
        
        # Check additional fields
        if "subscription_plan" in user_data:
            log_test(f"✅ Subscription plan: {user_data.get('subscription_plan')}")
        
        if "created_at" in user_data:
            log_test(f"✅ Created at: {user_data.get('created_at')}")
        
        return cors_ok
        
    except requests.exceptions.RequestException as e:
        log_test(f"❌ Request failed: {str(e)}", "ERROR")
        return False
    except Exception as e:
        log_test(f"❌ Unexpected error: {str(e)}", "ERROR")
        return False

def test_invalid_token():
    """Test /api/auth/me with invalid token"""
    log_test("Testing GET /api/auth/me with invalid token")
    
    url = f"{API_BASE}/auth/me"
    headers = {
        "Authorization": "Bearer invalid_token_12345"
    }
    
    log_test(f"Making GET request to: {url}")
    log_test("Using invalid Authorization token")
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        # Should return 401 Unauthorized
        if response.status_code == 401:
            log_test("✅ Correctly rejected invalid token with 401 status")
            return True
        else:
            log_test(f"❌ Expected 401 for invalid token, got {response.status_code}", "ERROR")
            return False
        
    except requests.exceptions.RequestException as e:
        log_test(f"❌ Request failed: {str(e)}", "ERROR")
        return False
    except Exception as e:
        log_test(f"❌ Unexpected error: {str(e)}", "ERROR")
        return False

def main():
    """Run all authentication endpoint tests"""
    log_test("=" * 80)
    log_test("BACKEND AUTHENTICATION API TESTING")
    log_test("=" * 80)
    log_test(f"Backend URL: {BACKEND_URL}")
    log_test(f"API Base: {API_BASE}")
    log_test("")
    log_test("TESTING AUTHENTICATION ENDPOINTS:")
    log_test("1. POST /api/auth/register - Create new user")
    log_test("2. POST /api/auth/login - Login user")
    log_test("3. GET /api/auth/me - Get current user info")
    log_test("4. Verify CORS headers are present")
    log_test("")
    
    # Test 1: Register endpoint
    log_test("TEST 1: POST /api/auth/register")
    test_credentials, register_cors = test_register_endpoint()
    register_success = test_credentials is not None
    
    log_test("")
    
    # Test 2: Login endpoint (only if register succeeded)
    log_test("TEST 2: POST /api/auth/login")
    if register_success:
        login_credentials, login_cors = test_login_endpoint(test_credentials)
        login_success = login_credentials is not None
    else:
        log_test("❌ Skipping login test - register failed", "ERROR")
        login_credentials = None
        login_success = False
        login_cors = False
    
    log_test("")
    
    # Test 3: Me endpoint (only if login succeeded)
    log_test("TEST 3: GET /api/auth/me")
    if login_success:
        me_cors = test_me_endpoint(login_credentials)
        me_success = me_cors is not False
    else:
        log_test("❌ Skipping me test - login failed", "ERROR")
        me_success = False
        me_cors = False
    
    log_test("")
    
    # Test 4: Invalid token test
    log_test("TEST 4: GET /api/auth/me with invalid token")
    invalid_token_success = test_invalid_token()
    
    log_test("")
    log_test("=" * 80)
    log_test("TEST SUMMARY")
    log_test("=" * 80)
    
    # Summary of results
    if register_success:
        log_test("✅ User registration PASSED")
    else:
        log_test("❌ User registration FAILED")
        
    if login_success:
        log_test("✅ User login PASSED")
    else:
        log_test("❌ User login FAILED")
        
    if me_success:
        log_test("✅ User info retrieval PASSED")
    else:
        log_test("❌ User info retrieval FAILED")
        
    if invalid_token_success:
        log_test("✅ Invalid token handling PASSED")
    else:
        log_test("❌ Invalid token handling FAILED")
    
    # CORS summary
    cors_results = []
    if register_success:
        cors_results.append(register_cors)
    if login_success:
        cors_results.append(login_cors)
    if me_success:
        cors_results.append(me_cors)
    
    if cors_results and all(cors_results):
        log_test("✅ CORS headers PASSED - All endpoints have proper CORS headers")
    elif cors_results and any(cors_results):
        log_test("⚠️ CORS headers PARTIAL - Some endpoints missing CORS headers")
    else:
        log_test("❌ CORS headers FAILED - Missing CORS headers")
    
    # Overall result
    overall_success = register_success and login_success and me_success and invalid_token_success
    
    if overall_success:
        log_test("🎉 OVERALL RESULT: ALL AUTHENTICATION TESTS PASSED")
        log_test("")
        log_test("KEY FINDINGS:")
        log_test("- User registration endpoint working correctly (201 status)")
        log_test("- User login endpoint working correctly (200 status)")
        log_test("- User info endpoint working correctly with Bearer token")
        log_test("- Invalid token properly rejected (401 status)")
        log_test("- All endpoints return proper JSON responses")
        if cors_results and all(cors_results):
            log_test("- All endpoints have proper CORS headers")
    else:
        log_test("💥 OVERALL RESULT: SOME AUTHENTICATION TESTS FAILED")
        log_test("")
        log_test("ISSUES FOUND:")
        if not register_success:
            log_test("- User registration endpoint has issues")
        if not login_success:
            log_test("- User login endpoint has issues")
        if not me_success:
            log_test("- User info endpoint has issues")
        if not invalid_token_success:
            log_test("- Invalid token handling has issues")
        if cors_results and not all(cors_results):
            log_test("- Some endpoints missing CORS headers")
        
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)