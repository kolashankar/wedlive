#!/usr/bin/env python3
"""
Backend Video Template Overlay Rendering Testing
Tests the video template overlay rendering fix for wedding ID: b75e23c9-ca5e-4d10-bf20-065169d1a01e

WHAT TO TEST:
1. GET /api/viewer/wedding/{wedding_id}/all - Verify video template data structure
2. Check overlay data structure and content
3. Verify text_value population with wedding data
4. Check positioning, timing, and styling data
5. Validate reference resolution and proxy URLs
"""

import requests
import json
import sys
from datetime import datetime
import time

# Get backend URL from environment (using the configured URL)
BACKEND_URL = "https://overlay-fix-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Wedding ID to test
WEDDING_ID = "b75e23c9-ca5e-4d10-bf20-065169d1a01e"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{status}] {message}")

def log_overlay_details(overlay, index):
    """Log detailed overlay information"""
    log_test(f"  Overlay {index + 1}:")
    log_test(f"    ID: {overlay.get('id', 'MISSING')}")
    log_test(f"    Text Value: '{overlay.get('text_value', 'MISSING')}'")
    
    # Position details
    position = overlay.get('position', {})
    log_test(f"    Position: x={position.get('x', 'MISSING')}, y={position.get('y', 'MISSING')}")
    
    # Timing details
    timing = overlay.get('timing', {})
    log_test(f"    Timing: start={timing.get('start_time', 'MISSING')}s, end={timing.get('end_time', 'MISSING')}s")
    
    # Styling details
    styling = overlay.get('styling', {})
    log_test(f"    Font: {styling.get('font_family', 'MISSING')}, size={styling.get('font_size', 'MISSING')}")
    log_test(f"    Color: {styling.get('color', 'MISSING')}")
    
    # Dimensions
    dimensions = overlay.get('dimensions', {})
    log_test(f"    Dimensions: {dimensions.get('width', 'MISSING')}% x {dimensions.get('height', 'MISSING')}%")
    
    # Layer index
    log_test(f"    Layer Index: {overlay.get('layer_index', 'MISSING')}")

def validate_overlay_structure(overlay, index):
    """Validate overlay has required structure and return issues"""
    issues = []
    
    # Required fields
    required_fields = ['id', 'text_value', 'position', 'timing', 'styling', 'dimensions']
    for field in required_fields:
        if field not in overlay:
            issues.append(f"Overlay {index + 1}: Missing required field '{field}'")
    
    # Validate position
    position = overlay.get('position', {})
    if 'x' not in position or 'y' not in position:
        issues.append(f"Overlay {index + 1}: Position missing x or y coordinates")
    else:
        x, y = position.get('x'), position.get('y')
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            issues.append(f"Overlay {index + 1}: Position coordinates must be numbers")
        elif x < 0 or x > 100 or y < 0 or y > 100:
            issues.append(f"Overlay {index + 1}: Position coordinates should be 0-100% (x={x}, y={y})")
    
    # Validate timing
    timing = overlay.get('timing', {})
    if 'start_time' not in timing or 'end_time' not in timing:
        issues.append(f"Overlay {index + 1}: Timing missing start_time or end_time")
    else:
        start, end = timing.get('start_time'), timing.get('end_time')
        if not isinstance(start, (int, float)) or not isinstance(end, (int, float)):
            issues.append(f"Overlay {index + 1}: Timing values must be numbers")
        elif start < 0:
            issues.append(f"Overlay {index + 1}: start_time should be >= 0 (got {start})")
        elif end <= start:
            issues.append(f"Overlay {index + 1}: end_time should be > start_time (start={start}, end={end})")
    
    # Validate styling
    styling = overlay.get('styling', {})
    required_style_fields = ['font_size', 'font_family', 'color']
    for field in required_style_fields:
        if field not in styling:
            issues.append(f"Overlay {index + 1}: Styling missing '{field}'")
    
    # Check font size
    font_size = styling.get('font_size')
    if font_size is not None and (not isinstance(font_size, (int, float)) or font_size <= 0):
        issues.append(f"Overlay {index + 1}: font_size should be positive number (got {font_size})")
    
    # Validate text_value is not empty
    text_value = overlay.get('text_value', '')
    if not text_value or text_value.strip() == '':
        issues.append(f"Overlay {index + 1}: text_value is empty or missing")
    
    return issues

def test_wedding_viewer_api():
    """Test GET /api/viewer/wedding/{wedding_id}/all endpoint"""
    log_test(f"Testing GET /api/viewer/wedding/{WEDDING_ID}/all endpoint")
    
    url = f"{API_BASE}/viewer/wedding/{WEDDING_ID}/all"
    log_test(f"Making GET request to: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        # Check status code (should be 200)
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
        
        # Verify response structure
        required_fields = ["wedding", "video_template"]
        missing_fields = []
        
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        if missing_fields:
            log_test(f"❌ Missing required fields in response: {missing_fields}", "ERROR")
            return None, False
        
        log_test("✅ Response has required top-level fields")
        
        # Check wedding data
        wedding = data.get("wedding", {})
        log_test(f"Wedding ID: {wedding.get('id')}")
        log_test(f"Wedding Title: {wedding.get('title')}")
        log_test(f"Bride: {wedding.get('bride_name')}")
        log_test(f"Groom: {wedding.get('groom_name')}")
        
        return data, True
        
    except requests.exceptions.RequestException as e:
        log_test(f"❌ Request failed: {str(e)}", "ERROR")
        return None, False
    except Exception as e:
        log_test(f"❌ Unexpected error: {str(e)}", "ERROR")
        return None, False

def test_video_template_structure(data):
    """Test video template structure and overlay data"""
    log_test("Testing video template structure and overlay data")
    
    if not data:
        log_test("❌ No data to test", "ERROR")
        return False
    
    video_template = data.get("video_template")
    if not video_template:
        log_test("❌ No video_template in response", "ERROR")
        return False
    
    log_test("✅ video_template object exists")
    
    # Check required video template fields
    required_template_fields = ["id", "name", "video_url", "text_overlays", "reference_resolution"]
    missing_template_fields = []
    
    for field in required_template_fields:
        if field not in video_template:
            missing_template_fields.append(field)
    
    if missing_template_fields:
        log_test(f"❌ Missing video template fields: {missing_template_fields}", "ERROR")
        return False
    
    log_test("✅ Video template has all required fields")
    
    # Log video template details
    log_test(f"Template ID: {video_template.get('id')}")
    log_test(f"Template Name: {video_template.get('name')}")
    log_test(f"Video URL: {video_template.get('video_url')}")
    log_test(f"Duration: {video_template.get('duration')} seconds")
    log_test(f"Resolution: {video_template.get('resolution')}")
    
    # Check reference resolution
    ref_res = video_template.get("reference_resolution", {})
    log_test(f"Reference Resolution: {ref_res.get('width')}x{ref_res.get('height')}")
    
    # Check video URL is proxy URL
    video_url = video_template.get("video_url", "")
    if "/api/media/telegram-proxy/" in video_url:
        log_test("✅ Video URL is using proxy format")
    else:
        log_test(f"⚠️ Video URL may not be proxy format: {video_url}", "WARNING")
    
    return True

def test_overlay_data_structure(data):
    """Test overlay data structure and content"""
    log_test("Testing overlay data structure and content")
    
    if not data:
        log_test("❌ No data to test", "ERROR")
        return False
    
    video_template = data.get("video_template", {})
    text_overlays = video_template.get("text_overlays", [])
    
    if not text_overlays:
        log_test("❌ No text_overlays found in video template", "ERROR")
        return False
    
    log_test(f"✅ Found {len(text_overlays)} text overlays")
    
    all_issues = []
    
    # Test each overlay
    for i, overlay in enumerate(text_overlays):
        log_overlay_details(overlay, i)
        
        # Validate overlay structure
        issues = validate_overlay_structure(overlay, i)
        all_issues.extend(issues)
    
    # Report issues
    if all_issues:
        log_test("❌ Overlay validation issues found:", "ERROR")
        for issue in all_issues:
            log_test(f"  - {issue}", "ERROR")
        return False
    else:
        log_test("✅ All overlays have valid structure")
        return True

def test_overlay_content_population(data):
    """Test that overlays are populated with actual wedding data"""
    log_test("Testing overlay content population with wedding data")
    
    if not data:
        log_test("❌ No data to test", "ERROR")
        return False
    
    wedding = data.get("wedding", {})
    video_template = data.get("video_template", {})
    text_overlays = video_template.get("text_overlays", [])
    
    bride_name = wedding.get("bride_name", "")
    groom_name = wedding.get("groom_name", "")
    
    log_test(f"Wedding data - Bride: '{bride_name}', Groom: '{groom_name}'")
    
    populated_overlays = 0
    placeholder_overlays = 0
    
    for i, overlay in enumerate(text_overlays):
        text_value = overlay.get("text_value", "")
        
        # Check if text contains actual wedding data
        has_bride = bride_name.lower() in text_value.lower() if bride_name else False
        has_groom = groom_name.lower() in text_value.lower() if groom_name else False
        
        # Check for common placeholder patterns
        is_placeholder = any(placeholder in text_value.lower() for placeholder in [
            "bride name", "groom name", "wedding date", "venue name", 
            "placeholder", "sample", "example", "{{", "}}"
        ])
        
        if has_bride or has_groom:
            log_test(f"  ✅ Overlay {i + 1}: Contains wedding data - '{text_value}'")
            populated_overlays += 1
        elif is_placeholder:
            log_test(f"  ⚠️ Overlay {i + 1}: Contains placeholder text - '{text_value}'", "WARNING")
            placeholder_overlays += 1
        else:
            log_test(f"  ℹ️ Overlay {i + 1}: Static text - '{text_value}'")
    
    if populated_overlays > 0:
        log_test(f"✅ Found {populated_overlays} overlays with wedding data")
        return True
    elif placeholder_overlays > 0:
        log_test(f"⚠️ Found {placeholder_overlays} overlays with placeholder text", "WARNING")
        return False
    else:
        log_test("ℹ️ All overlays appear to be static text")
        return True

def test_overlay_timing_and_positioning(data):
    """Test overlay timing and positioning for common issues"""
    log_test("Testing overlay timing and positioning for common issues")
    
    if not data:
        log_test("❌ No data to test", "ERROR")
        return False
    
    video_template = data.get("video_template", {})
    text_overlays = video_template.get("text_overlays", [])
    video_duration = video_template.get("duration", 0)
    
    log_test(f"Video duration: {video_duration} seconds")
    
    issues_found = []
    
    for i, overlay in enumerate(text_overlays):
        timing = overlay.get("timing", {})
        position = overlay.get("position", {})
        styling = overlay.get("styling", {})
        
        start_time = timing.get("start_time", 0)
        end_time = timing.get("end_time", 0)
        
        # Check timing issues
        if start_time > 0:
            issues_found.append(f"Overlay {i + 1}: start_time > 0 ({start_time}s) - won't show at video start")
        
        if video_duration > 0 and end_time > video_duration:
            issues_found.append(f"Overlay {i + 1}: end_time ({end_time}s) > video duration ({video_duration}s)")
        
        # Check positioning issues
        x = position.get("x", 0)
        y = position.get("y", 0)
        
        if x < 0 or x > 100:
            issues_found.append(f"Overlay {i + 1}: x position ({x}%) out of bounds (0-100%)")
        
        if y < 0 or y > 100:
            issues_found.append(f"Overlay {i + 1}: y position ({y}%) out of bounds (0-100%)")
        
        # Check styling issues
        font_size = styling.get("font_size", 0)
        color = styling.get("color", "")
        
        if font_size <= 0:
            issues_found.append(f"Overlay {i + 1}: font_size ({font_size}) is too small or zero")
        
        if color.lower() in ["#ffffff", "#fff", "white"] and not styling.get("stroke_width", 0):
            issues_found.append(f"Overlay {i + 1}: white text without stroke may not be visible")
    
    if issues_found:
        log_test("⚠️ Potential overlay issues found:", "WARNING")
        for issue in issues_found:
            log_test(f"  - {issue}", "WARNING")
        return False
    else:
        log_test("✅ No obvious timing or positioning issues found")
        return True

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
        me_success, me_cors = test_me_endpoint(login_credentials)
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
        cors_overall = True
    elif cors_results and any(cors_results):
        log_test("⚠️ CORS headers PARTIAL - Some endpoints missing CORS headers")
        cors_overall = False
    else:
        log_test("❌ CORS headers FAILED - Missing CORS headers")
        cors_overall = False
    
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
        if cors_overall:
            log_test("- All endpoints have proper CORS headers")
        else:
            log_test("- CORS headers are missing from responses (minor issue)")
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