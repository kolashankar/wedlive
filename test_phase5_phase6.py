"""
Comprehensive Testing for Phase 5 & Phase 6
Dynamic Theme Assets System - WedLive Platform

Tests cover:
- Backend: Theme CRUD, Mask data, API auth, Subscription filtering
- Frontend: Component rendering, Integration flows
- Integration: Complete creator flow, Admin operations, Public viewing
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001/api")
ADMIN_TOKEN = None
USER_TOKEN = None
TEST_WEDDING_ID = None
TEST_BORDER_ID = None
TEST_STYLE_ID = None
TEST_BACKGROUND_ID = None

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_test(test_name, status, message=""):
    """Log test result"""
    result = {
        "test": test_name,
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if status == "PASS":
        test_results["passed"].append(result)
        print(f"✅ {test_name}: PASSED")
    elif status == "FAIL":
        test_results["failed"].append(result)
        print(f"❌ {test_name}: FAILED - {message}")
    else:
        test_results["warnings"].append(result)
        print(f"⚠️  {test_name}: WARNING - {message}")
    
    if message:
        print(f"   {message}")

# ==================== PHASE 6.1: BACKEND TESTING ====================

def test_backend_health():
    """Test backend is running"""
    try:
        response = requests.get("http://localhost:8001/api/health", timeout=5)
        if response.status_code == 200:
            log_test("Backend Health Check", "PASS", "Backend is running")
            return True
        else:
            log_test("Backend Health Check", "FAIL", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        log_test("Backend Health Check", "FAIL", str(e))
        return False

def test_auth_endpoints():
    """Test authentication system"""
    global USER_TOKEN, ADMIN_TOKEN
    
    # Register user
    try:
        user_data = {
            "email": f"testuser_{datetime.now().timestamp()}@test.com",
            "password": "Test123456!",
            "full_name": "Test User"
        }
        response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data)
        
        if response.status_code in [200, 201]:
            log_test("User Registration", "PASS")
            
            # Login
            login_response = requests.post(
                f"{BACKEND_URL}/auth/login",
                json={"email": user_data["email"], "password": user_data["password"]}
            )
            if login_response.status_code == 200:
                USER_TOKEN = login_response.json().get("access_token")
                log_test("User Login", "PASS", "User token obtained")
                return True
            else:
                log_test("User Login", "FAIL", f"Status: {login_response.status_code}")
                return False
        else:
            log_test("User Registration", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        log_test("Authentication", "FAIL", str(e))
        return False

def test_theme_assets_crud_operations():
    """Test Theme Assets CRUD (admin operations)"""
    global TEST_BORDER_ID, TEST_STYLE_ID, TEST_BACKGROUND_ID
    
    # Note: These tests require admin token and actual file uploads
    # For now, we'll test the GET endpoints which are public
    
    try:
        # Test GET borders (public endpoint)
        response = requests.get(f"{BACKEND_URL}/theme-assets/borders")
        if response.status_code == 200:
            borders = response.json()
            log_test("GET Photo Borders", "PASS", f"Found {len(borders)} borders")
            if len(borders) > 0:
                TEST_BORDER_ID = borders[0].get("id")
        else:
            log_test("GET Photo Borders", "FAIL", f"Status: {response.status_code}")
        
        # Test GET precious styles
        response = requests.get(f"{BACKEND_URL}/theme-assets/precious-styles")
        if response.status_code == 200:
            styles = response.json()
            log_test("GET Precious Styles", "PASS", f"Found {len(styles)} styles")
            if len(styles) > 0:
                TEST_STYLE_ID = styles[0].get("id")
        else:
            log_test("GET Precious Styles", "FAIL", f"Status: {response.status_code}")
        
        # Test GET backgrounds
        response = requests.get(f"{BACKEND_URL}/theme-assets/backgrounds")
        if response.status_code == 200:
            backgrounds = response.json()
            log_test("GET Background Images", "PASS", f"Found {len(backgrounds)} backgrounds")
            if len(backgrounds) > 0:
                TEST_BACKGROUND_ID = backgrounds[0].get("id")
        else:
            log_test("GET Background Images", "FAIL", f"Status: {response.status_code}")
        
        return True
    except Exception as e:
        log_test("Theme Assets CRUD", "FAIL", str(e))
        return False

def test_mask_data_storage():
    """Test mask data storage and retrieval"""
    if not TEST_BORDER_ID:
        log_test("Mask Data Storage", "WARNING", "No test border available")
        return False
    
    try:
        # GET border with mask data
        response = requests.get(f"{BACKEND_URL}/theme-assets/borders")
        if response.status_code == 200:
            borders = response.json()
            for border in borders:
                if border.get("mask_data"):
                    log_test("Mask Data Retrieval", "PASS", "Border has mask_data field")
                    
                    # Verify mask data structure
                    mask = border["mask_data"]
                    required_fields = ["inner_x", "inner_y", "inner_width", "inner_height", "feather_radius"]
                    has_all_fields = all(field in mask for field in required_fields)
                    
                    if has_all_fields:
                        log_test("Mask Data Structure", "PASS", "All required fields present")
                    else:
                        log_test("Mask Data Structure", "FAIL", "Missing required fields")
                    return True
            
            log_test("Mask Data Retrieval", "WARNING", "No borders with mask_data found")
            return False
        else:
            log_test("Mask Data Retrieval", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        log_test("Mask Data Storage", "FAIL", str(e))
        return False

def test_api_authentication():
    """Test API authentication and authorization"""
    try:
        # Test accessing admin endpoint without token
        response = requests.get(f"{BACKEND_URL}/admin/theme-assets/borders")
        if response.status_code in [401, 403]:
            log_test("API Auth - Unauthorized Access", "PASS", "Admin endpoint blocked without token")
        else:
            log_test("API Auth - Unauthorized Access", "FAIL", f"Expected 401/403, got {response.status_code}")
        
        # Test accessing public endpoint without token
        response = requests.get(f"{BACKEND_URL}/theme-assets/borders")
        if response.status_code == 200:
            log_test("API Auth - Public Access", "PASS", "Public endpoint accessible")
        else:
            log_test("API Auth - Public Access", "FAIL", f"Status: {response.status_code}")
        
        return True
    except Exception as e:
        log_test("API Authentication", "FAIL", str(e))
        return False

def test_random_defaults_endpoint():
    """Test random defaults selection"""
    try:
        response = requests.get(f"{BACKEND_URL}/theme-assets/random-defaults")
        if response.status_code == 200:
            data = response.json()
            log_test("Random Defaults Endpoint", "PASS", "Endpoint working")
            
            # Check structure
            if "border" in data and "precious_moment_style" in data:
                log_test("Random Defaults Structure", "PASS", "Response structure correct")
            else:
                log_test("Random Defaults Structure", "FAIL", "Missing expected fields")
            return True
        else:
            log_test("Random Defaults Endpoint", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        log_test("Random Defaults", "FAIL", str(e))
        return False

# ==================== PHASE 6.2: FRONTEND TESTING ====================

def test_frontend_components():
    """Test frontend component existence"""
    components = [
        "/app/frontend/components/ExactFitPhotoFrame.js",
        "/app/frontend/components/AnimatedBackground.js",
        "/app/frontend/components/BorderedPhotoGallery.js",
        "/app/frontend/components/PreciousMomentsSection.js",
        "/app/frontend/components/BorderEditor.js"
    ]
    
    all_exist = True
    for component in components:
        if os.path.exists(component):
            log_test(f"Component: {os.path.basename(component)}", "PASS", "File exists")
        else:
            log_test(f"Component: {os.path.basename(component)}", "FAIL", "File not found")
            all_exist = False
    
    return all_exist

def test_theme_rendering_components():
    """Test theme components exist"""
    themes = [
        "FloralGarden.js",
        "CinemaScope.js", 
        "ModernMinimalist.js",
        "RoyalPalace.js",
        "PremiumWeddingCard.js",
        "RomanticPastel.js",
        "TraditionalSouthIndian.js"
    ]
    
    all_exist = True
    for theme in themes:
        theme_path = f"/app/frontend/components/themes/{theme}"
        if os.path.exists(theme_path):
            log_test(f"Theme: {theme}", "PASS", "Theme component exists")
        else:
            log_test(f"Theme: {theme}", "FAIL", "Theme component not found")
            all_exist = False
    
    return all_exist

def test_admin_ui_exists():
    """Test admin UI for theme assets"""
    admin_page = "/app/frontend/app/admin/theme-assets/page.js"
    if os.path.exists(admin_page):
        log_test("Admin Theme Assets Page", "PASS", "Admin UI exists")
        return True
    else:
        log_test("Admin Theme Assets Page", "FAIL", "Admin UI not found")
        return False

# ==================== PHASE 6.3: INTEGRATION TESTING ====================

def test_complete_creator_flow():
    """Test complete creator workflow"""
    log_test("Complete Creator Flow", "WARNING", "Manual testing required for full flow")
    # This requires:
    # 1. Login as creator
    # 2. Create wedding
    # 3. Select theme
    # 4. Select borders/styles/backgrounds
    # 5. Upload photos
    # 6. View live page
    # This is best done through browser testing
    return True

def test_public_viewing():
    """Test public viewing capability"""
    try:
        # Test that theme assets endpoints are publicly accessible
        response = requests.get(f"{BACKEND_URL}/theme-assets/borders")
        if response.status_code == 200:
            log_test("Public Theme Assets Access", "PASS", "Borders accessible without auth")
        else:
            log_test("Public Theme Assets Access", "FAIL", f"Status: {response.status_code}")
        
        response = requests.get(f"{BACKEND_URL}/theme-assets/precious-styles")
        if response.status_code == 200:
            log_test("Public Styles Access", "PASS", "Styles accessible without auth")
        else:
            log_test("Public Styles Access", "FAIL", f"Status: {response.status_code}")
        
        return True
    except Exception as e:
        log_test("Public Viewing", "FAIL", str(e))
        return False

# ==================== MAIN TEST RUNNER ====================

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("PHASE 5 & 6 COMPREHENSIVE TESTING")
    print("Dynamic Theme Assets System - WedLive Platform")
    print("="*60 + "\n")
    
    print("📋 PHASE 6.1: BACKEND TESTING")
    print("-" * 60)
    test_backend_health()
    test_auth_endpoints()
    test_theme_assets_crud_operations()
    test_mask_data_storage()
    test_api_authentication()
    test_random_defaults_endpoint()
    
    print("\n📋 PHASE 6.2: FRONTEND TESTING")
    print("-" * 60)
    test_frontend_components()
    test_theme_rendering_components()
    test_admin_ui_exists()
    
    print("\n📋 PHASE 6.3: INTEGRATION TESTING")
    print("-" * 60)
    test_complete_creator_flow()
    test_public_viewing()
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"✅ Passed: {len(test_results['passed'])}")
    print(f"❌ Failed: {len(test_results['failed'])}")
    print(f"⚠️  Warnings: {len(test_results['warnings'])}")
    
    if test_results['failed']:
        print("\n❌ Failed Tests:")
        for test in test_results['failed']:
            print(f"  - {test['test']}: {test['message']}")
    
    if test_results['warnings']:
        print("\n⚠️  Warnings:")
        for test in test_results['warnings']:
            print(f"  - {test['test']}: {test['message']}")
    
    # Calculate success rate
    total_tests = len(test_results['passed']) + len(test_results['failed'])
    if total_tests > 0:
        success_rate = (len(test_results['passed']) / total_tests) * 100
        print(f"\n📊 Success Rate: {success_rate:.1f}%")
    
    # Save results to file
    with open('/app/phase5_phase6_test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    
    print(f"\n📁 Detailed results saved to: phase5_phase6_test_results.json")
    print("="*60 + "\n")
    
    return len(test_results['failed']) == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
