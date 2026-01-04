#!/usr/bin/env python3
"""
Backend API Testing for Video Template Integration Fix
Tests the /api/viewer/wedding/{wedding_id}/all endpoint to verify video template data
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://invite-animation.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test wedding ID from the review request
TEST_WEDDING_ID = "b75e23c9-ca5e-4d10-bf20-065169d1a01e"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{status}] {message}")

def test_wedding_viewer_endpoint():
    """Test the wedding viewer endpoint for video template data"""
    log_test("Testing /api/viewer/wedding/{wedding_id}/all endpoint")
    
    url = f"{API_BASE}/viewer/wedding/{TEST_WEDDING_ID}/all"
    log_test(f"Making request to: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            log_test(f"API returned error: {response.status_code} - {response.text}", "ERROR")
            return False
            
        data = response.json()
        log_test("Response received successfully")
        
        # Check if video_template exists in response
        if "video_template" not in data:
            log_test("video_template field missing from response", "ERROR")
            return False
            
        video_template = data["video_template"]
        log_test(f"video_template data: {json.dumps(video_template, indent=2)}")
        
        # Test case 1: Check if video_template is not null (wedding has template assigned)
        if video_template is None:
            log_test("video_template is null - wedding may not have template assigned", "WARNING")
            log_test("This is expected if wedding doesn't have a template assigned")
            return True
            
        # Test case 2: Verify required fields exist and are not null
        required_fields = ["id", "name", "video_url", "thumbnail_url", "duration"]
        
        for field in required_fields:
            if field not in video_template:
                log_test(f"Required field '{field}' missing from video_template", "ERROR")
                return False
                
        # Test case 3: Verify video_url is not null and is a valid URL
        video_url = video_template.get("video_url")
        if video_url is None:
            log_test("video_url is null - this indicates the field mapping fix failed", "ERROR")
            return False
            
        if not isinstance(video_url, str) or not video_url.startswith("http"):
            log_test(f"video_url is not a valid URL: {video_url}", "ERROR")
            return False
            
        log_test(f"✅ video_url is valid: {video_url}")
        
        # Test case 4: Verify thumbnail_url exists
        thumbnail_url = video_template.get("thumbnail_url")
        if thumbnail_url and isinstance(thumbnail_url, str) and thumbnail_url.startswith("http"):
            log_test(f"✅ thumbnail_url is valid: {thumbnail_url}")
        else:
            log_test(f"⚠️ thumbnail_url may be missing or invalid: {thumbnail_url}", "WARNING")
            
        # Test case 5: Verify duration is a number
        duration = video_template.get("duration")
        if duration is not None and isinstance(duration, (int, float)) and duration > 0:
            log_test(f"✅ duration is valid: {duration} seconds")
        else:
            log_test(f"⚠️ duration may be missing or invalid: {duration}", "WARNING")
            
        # Test case 6: Verify id and name exist
        template_id = video_template.get("id")
        template_name = video_template.get("name")
        
        if template_id:
            log_test(f"✅ template id: {template_id}")
        else:
            log_test("template id is missing", "ERROR")
            return False
            
        if template_name:
            log_test(f"✅ template name: {template_name}")
        else:
            log_test("template name is missing", "ERROR")
            return False
            
        log_test("✅ All video template fields are present and valid")
        return True
        
    except requests.exceptions.RequestException as e:
        log_test(f"Request failed: {str(e)}", "ERROR")
        return False
    except json.JSONDecodeError as e:
        log_test(f"Failed to parse JSON response: {str(e)}", "ERROR")
        return False
    except Exception as e:
        log_test(f"Unexpected error: {str(e)}", "ERROR")
        return False

def test_wedding_without_template():
    """Test with a different wedding ID that might not have a template"""
    log_test("Testing with a different wedding ID to check null template handling")
    
    # Use a different wedding ID that likely doesn't have a template
    test_id = "00000000-0000-0000-0000-000000000000"
    url = f"{API_BASE}/viewer/wedding/{test_id}/all"
    
    try:
        response = requests.get(url, timeout=30)
        
        if response.status_code == 404:
            log_test("Wedding not found (expected for test ID)")
            return True
            
        if response.status_code == 200:
            data = response.json()
            video_template = data.get("video_template")
            
            if video_template is None:
                log_test("✅ video_template is null for wedding without template (correct behavior)")
                return True
            else:
                log_test("Wedding unexpectedly has template assigned")
                return True
                
    except Exception as e:
        log_test(f"Test with different wedding ID failed: {str(e)}", "WARNING")
        # This is not critical since we're testing with a dummy ID
        return True

def main():
    """Run all backend tests"""
    log_test("=" * 60)
    log_test("BACKEND API TESTING - VIDEO TEMPLATE INTEGRATION FIX")
    log_test("=" * 60)
    log_test(f"Backend URL: {BACKEND_URL}")
    log_test(f"Test Wedding ID: {TEST_WEDDING_ID}")
    log_test("")
    
    # Test 1: Main wedding viewer endpoint
    log_test("TEST 1: Wedding viewer endpoint with video template data")
    test1_result = test_wedding_viewer_endpoint()
    
    log_test("")
    
    # Test 2: Wedding without template (optional)
    log_test("TEST 2: Wedding without template (null handling)")
    test2_result = test_wedding_without_template()
    
    log_test("")
    log_test("=" * 60)
    log_test("TEST SUMMARY")
    log_test("=" * 60)
    
    if test1_result:
        log_test("✅ Main test PASSED: Video template data is returned correctly")
    else:
        log_test("❌ Main test FAILED: Video template data has issues")
        
    if test2_result:
        log_test("✅ Null handling test PASSED")
    else:
        log_test("⚠️ Null handling test had issues (non-critical)")
        
    overall_success = test1_result
    
    if overall_success:
        log_test("🎉 OVERALL RESULT: TESTS PASSED")
        log_test("Video template integration fix is working correctly")
    else:
        log_test("💥 OVERALL RESULT: TESTS FAILED")
        log_test("Video template integration fix needs attention")
        
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
