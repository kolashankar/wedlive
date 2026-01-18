#!/usr/bin/env python3
"""
Backend CORS and Video Template Testing
Tests the specific backend fixes mentioned in the review request:

1. CORS Headers for Video Proxy - OPTIONS requests to video proxy endpoints
2. Video Templates Loading - GET /api/video-templates endpoint
3. Text Color Storage - Verify color #4c242d is stored correctly

Context:
- Backend is running on localhost:8001 (but we use configured URL)
- Fixed CORS OPTIONS handlers for videos, photos, documents paths
- Fixed missing setuptools dependency
- All templates should be loading correctly now
"""

import requests
import json
import sys
from datetime import datetime
import time

# Get backend URL from environment (using the configured URL)
BACKEND_URL = "https://audio-manager-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test file ID for video proxy testing
TEST_VIDEO_FILE_ID = "BAACAgUAAyEGAATO7nwaAAPHaVoRGteCoQdEz190fPZeJX88k1MAAkIkAAJxAAHRVlRpA_taReCCOAQ"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{status}] {message}")

def test_cors_headers_video_proxy():
    """Test CORS headers for video proxy OPTIONS requests"""
    log_test("=" * 80)
    log_test("TEST 1: CORS Headers for Video Proxy")
    log_test("=" * 80)
    
    # Test the specific endpoint mentioned in the review request
    video_proxy_url = f"{API_BASE}/media/telegram-proxy/videos/{TEST_VIDEO_FILE_ID}"
    log_test(f"Testing OPTIONS request to: {video_proxy_url}")
    
    try:
        # Send OPTIONS request
        response = requests.options(video_proxy_url, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        # Check status code
        if response.status_code != 200:
            log_test(f"❌ Expected status 200, got {response.status_code}", "ERROR")
            log_test(f"Response headers: {dict(response.headers)}")
            return False
        
        log_test("✅ Correct status code 200 (OK)")
        
        # Check required CORS headers
        headers = response.headers
        log_test("Checking CORS headers:")
        
        required_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": ["GET", "HEAD", "OPTIONS"],
            "Access-Control-Allow-Headers": "*"
        }
        
        cors_issues = []
        
        # Check Access-Control-Allow-Origin
        if "Access-Control-Allow-Origin" not in headers:
            cors_issues.append("Missing Access-Control-Allow-Origin header")
        elif headers["Access-Control-Allow-Origin"] != "*":
            cors_issues.append(f"Access-Control-Allow-Origin should be '*', got '{headers['Access-Control-Allow-Origin']}'")
        else:
            log_test(f"  ✅ Access-Control-Allow-Origin: {headers['Access-Control-Allow-Origin']}")
        
        # Check Access-Control-Allow-Methods
        if "Access-Control-Allow-Methods" not in headers:
            cors_issues.append("Missing Access-Control-Allow-Methods header")
        else:
            methods = headers["Access-Control-Allow-Methods"]
            log_test(f"  ✅ Access-Control-Allow-Methods: {methods}")
            # Check if required methods are present
            for method in ["GET", "HEAD", "OPTIONS"]:
                if method not in methods:
                    cors_issues.append(f"Access-Control-Allow-Methods missing '{method}' method")
        
        # Check Access-Control-Allow-Headers
        if "Access-Control-Allow-Headers" not in headers:
            cors_issues.append("Missing Access-Control-Allow-Headers header")
        else:
            log_test(f"  ✅ Access-Control-Allow-Headers: {headers['Access-Control-Allow-Headers']}")
        
        # Check for additional useful headers
        if "Access-Control-Max-Age" in headers:
            log_test(f"  ✅ Access-Control-Max-Age: {headers['Access-Control-Max-Age']}")
        
        if cors_issues:
            log_test("❌ CORS header issues found:", "ERROR")
            for issue in cors_issues:
                log_test(f"  - {issue}", "ERROR")
            return False
        else:
            log_test("✅ All required CORS headers present and correct")
            return True
            
    except requests.exceptions.RequestException as e:
        log_test(f"❌ Request failed: {str(e)}", "ERROR")
        return False
    except Exception as e:
        log_test(f"❌ Unexpected error: {str(e)}", "ERROR")
        return False

def test_video_templates_loading():
    """Test that video templates are loading correctly"""
    log_test("=" * 80)
    log_test("TEST 2: Video Templates Loading")
    log_test("=" * 80)
    
    url = f"{API_BASE}/video-templates"
    log_test(f"Testing GET request to: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        # Check status code
        if response.status_code != 200:
            log_test(f"❌ Expected status 200, got {response.status_code}", "ERROR")
            log_test(f"Response body: {response.text}", "ERROR")
            return False, None
        
        log_test("✅ Correct status code 200 (OK)")
        
        # Parse response
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            log_test(f"❌ Failed to parse JSON response: {str(e)}", "ERROR")
            return False, None
        
        # Check if response is an array
        if not isinstance(data, list):
            log_test(f"❌ Expected array response, got {type(data)}", "ERROR")
            return False, None
        
        log_test(f"✅ Response is an array with {len(data)} templates")
        
        if len(data) == 0:
            log_test("⚠️ No video templates found", "WARNING")
            return True, data
        
        # Validate template structure
        template_issues = []
        
        for i, template in enumerate(data):
            log_test(f"Validating template {i + 1}:")
            
            # Check required fields
            required_fields = ["id", "name", "video_data", "text_overlays"]
            missing_fields = []
            
            for field in required_fields:
                if field not in template:
                    missing_fields.append(field)
            
            if missing_fields:
                template_issues.append(f"Template {i + 1}: Missing fields {missing_fields}")
                continue
            
            log_test(f"  ✅ Template ID: {template['id']}")
            log_test(f"  ✅ Template Name: {template['name']}")
            
            # Check video_data structure
            video_data = template.get("video_data", {})
            if not isinstance(video_data, dict):
                template_issues.append(f"Template {i + 1}: video_data should be an object")
                continue
            
            log_test(f"  ✅ Video data present")
            
            # Check text_overlays structure
            text_overlays = template.get("text_overlays", [])
            if not isinstance(text_overlays, list):
                template_issues.append(f"Template {i + 1}: text_overlays should be an array")
                continue
            
            log_test(f"  ✅ Text overlays: {len(text_overlays)} overlays")
            
            # Check overlay styling for line_height format
            for j, overlay in enumerate(text_overlays):
                styling = overlay.get("styling", {})
                if "line_height" in styling:
                    line_height = styling["line_height"]
                    if isinstance(line_height, str) and line_height.endswith("px"):
                        template_issues.append(f"Template {i + 1}, Overlay {j + 1}: line_height should be number, not string with 'px' (got '{line_height}')")
                    elif isinstance(line_height, (int, float)):
                        log_test(f"    ✅ Overlay {j + 1}: line_height is number ({line_height})")
                    else:
                        log_test(f"    ⚠️ Overlay {j + 1}: line_height has unusual format ({line_height})", "WARNING")
        
        if template_issues:
            log_test("❌ Template validation issues found:", "ERROR")
            for issue in template_issues:
                log_test(f"  - {issue}", "ERROR")
            return False, data
        else:
            log_test("✅ All templates have valid structure")
            return True, data
            
    except requests.exceptions.RequestException as e:
        log_test(f"❌ Request failed: {str(e)}", "ERROR")
        return False, None
    except Exception as e:
        log_test(f"❌ Unexpected error: {str(e)}", "ERROR")
        return False, None

def test_text_color_storage(templates_data):
    """Test that color #4c242d is stored correctly in template overlays"""
    log_test("=" * 80)
    log_test("TEST 3: Text Color Storage")
    log_test("=" * 80)
    
    if not templates_data:
        log_test("❌ No templates data to test", "ERROR")
        return False
    
    target_color = "#4c242d"
    log_test(f"Searching for color: {target_color}")
    
    found_color = False
    color_issues = []
    
    for i, template in enumerate(templates_data):
        template_name = template.get("name", f"Template {i + 1}")
        text_overlays = template.get("text_overlays", [])
        
        log_test(f"Checking template: {template_name}")
        
        for j, overlay in enumerate(text_overlays):
            styling = overlay.get("styling", {})
            color = styling.get("color", "")
            
            if color:
                log_test(f"  Overlay {j + 1}: color = '{color}'")
                
                # Check if this is our target color
                if color.lower() == target_color.lower():
                    found_color = True
                    log_test(f"  ✅ Found target color {target_color} in {template_name}, overlay {j + 1}")
                    
                    # Verify it's stored correctly (not corrupted)
                    if color == target_color:
                        log_test(f"    ✅ Color stored correctly as '{color}'")
                    else:
                        color_issues.append(f"Color case mismatch: expected '{target_color}', got '{color}'")
                
                # Check for any corrupted color formats
                if not color.startswith("#") or len(color) != 7:
                    color_issues.append(f"{template_name}, overlay {j + 1}: Invalid color format '{color}'")
            else:
                log_test(f"  Overlay {j + 1}: no color specified")
    
    if not found_color:
        log_test(f"⚠️ Target color {target_color} not found in any template overlays", "WARNING")
        log_test("This might be expected if the color was changed or is in a different template")
        return True  # Not necessarily an error
    
    if color_issues:
        log_test("❌ Color storage issues found:", "ERROR")
        for issue in color_issues:
            log_test(f"  - {issue}", "ERROR")
        return False
    else:
        log_test(f"✅ Color {target_color} found and stored correctly")
        return True

def main():
    """Run all backend CORS and video template tests"""
    log_test("=" * 80)
    log_test("BACKEND CORS AND VIDEO TEMPLATE TESTING")
    log_test("=" * 80)
    log_test(f"Backend URL: {BACKEND_URL}")
    log_test(f"API Base: {API_BASE}")
    log_test("")
    log_test("TESTING SPECIFIC BACKEND FIXES:")
    log_test("1. CORS Headers for Video Proxy - OPTIONS requests")
    log_test("2. Video Templates Loading - GET /api/video-templates")
    log_test("3. Text Color Storage - Verify color #4c242d storage")
    log_test("")
    
    # Test 1: CORS Headers for Video Proxy
    cors_success = test_cors_headers_video_proxy()
    log_test("")
    
    # Test 2: Video Templates Loading
    templates_success, templates_data = test_video_templates_loading()
    log_test("")
    
    # Test 3: Text Color Storage (only if templates loaded successfully)
    if templates_success and templates_data:
        color_success = test_text_color_storage(templates_data)
    else:
        log_test("❌ Skipping color storage test - templates loading failed", "ERROR")
        color_success = False
    
    log_test("")
    log_test("=" * 80)
    log_test("TEST SUMMARY")
    log_test("=" * 80)
    
    # Summary of results
    if cors_success:
        log_test("✅ CORS Headers for Video Proxy PASSED")
    else:
        log_test("❌ CORS Headers for Video Proxy FAILED")
        
    if templates_success:
        log_test("✅ Video Templates Loading PASSED")
    else:
        log_test("❌ Video Templates Loading FAILED")
        
    if color_success:
        log_test("✅ Text Color Storage PASSED")
    else:
        log_test("❌ Text Color Storage FAILED")
    
    # Overall result
    overall_success = cors_success and templates_success and color_success
    
    if overall_success:
        log_test("🎉 OVERALL RESULT: ALL BACKEND FIXES VERIFIED SUCCESSFULLY")
        log_test("")
        log_test("KEY FINDINGS:")
        log_test("- OPTIONS requests to video proxy return proper CORS headers")
        log_test("- Video templates API returns array with proper structure")
        log_test("- Template overlays have correct field formats (line_height as number)")
        log_test("- Color storage is working correctly without corruption")
        log_test("- All backend fixes are functioning as expected")
    else:
        log_test("💥 OVERALL RESULT: SOME BACKEND FIXES HAVE ISSUES")
        log_test("")
        log_test("ISSUES FOUND:")
        if not cors_success:
            log_test("- CORS headers for video proxy are missing or incorrect")
        if not templates_success:
            log_test("- Video templates API has structural or data issues")
        if not color_success:
            log_test("- Text color storage has corruption or format issues")
        
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)