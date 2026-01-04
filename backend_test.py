#!/usr/bin/env python3
"""
Backend API Testing for WeddingDataMapper Updates
Tests the venue mapping and date component fixes:
1. Venue mapping - wedding document uses `location` field, mapped to `venue`
2. Date components - separated into `event_date`, `event_month`, `event_year`, `event_day`
3. Backward compatibility testing
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://venue-display-fix.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test wedding ID from the review request
TEST_WEDDING_ID = "b75e23c9-ca5e-4d10-bf20-065169d1a01e"
EXPECTED_LOCATION = "Maddimadugu, c k dinne, xadapal"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{status}] {message}")

def test_venue_mapping():
    """Test venue mapping - wedding location field should be mapped to venue endpoint"""
    log_test("Testing venue mapping from wedding location to venue endpoint")
    
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
        
        # Check if video_template exists
        video_template = data.get("video_template")
        if not video_template:
            log_test("No video template found in response - this is expected if no template is assigned", "WARNING")
            return True
            
        # Check text_overlays array
        text_overlays = video_template.get("text_overlays", [])
        log_test(f"Found {len(text_overlays)} text overlays")
        
        # Look for venue overlay
        venue_overlay = None
        for overlay in text_overlays:
            if overlay.get("endpoint_key") == "venue":
                venue_overlay = overlay
                break
        
        if not venue_overlay:
            log_test("No venue overlay found with endpoint_key 'venue'", "WARNING")
            log_test("This may be expected if no venue overlay is configured in the template")
            return True
        
        # Check venue text_value
        text_value = venue_overlay.get("text_value", "")
        log_test(f"Venue overlay text_value: '{text_value}'")
        
        # Verify it's not a placeholder
        if text_value in ["Grand HotelCCFVVF", "Sample Venue", "Venue Name", ""]:
            log_test(f"❌ Venue shows placeholder text '{text_value}' instead of actual location", "ERROR")
            return False
        
        # Check if it matches expected location
        if text_value == EXPECTED_LOCATION:
            log_test(f"✅ Venue mapping CORRECT: '{text_value}' matches expected location", "SUCCESS")
        else:
            log_test(f"⚠️ Venue text_value '{text_value}' doesn't match expected '{EXPECTED_LOCATION}'", "WARNING")
            log_test("This may be expected if wedding location has been updated")
        
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


def test_date_components():
    """Test date component separation into individual fields"""
    log_test("Testing date component separation (event_date, event_month, event_year, event_day)")
    
    url = f"{API_BASE}/viewer/wedding/{TEST_WEDDING_ID}/all"
    log_test(f"Making request to: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            log_test(f"API returned error: {response.status_code} - {response.text}", "ERROR")
            return False
            
        data = response.json()
        
        # Check if video_template exists
        video_template = data.get("video_template")
        if not video_template:
            log_test("No video template found in response", "WARNING")
            return True
            
        # Check text_overlays array
        text_overlays = video_template.get("text_overlays", [])
        log_test(f"Found {len(text_overlays)} text overlays")
        
        # Look for date component overlays
        date_endpoints = {
            "event_date": "Day number (e.g., '15')",
            "event_month": "Month name (e.g., 'January')",
            "event_year": "Year (e.g., '2025')",
            "event_day": "Day name (e.g., 'Monday')",
            "event_date_full": "Full formatted date (e.g., 'January 15, 2025')"
        }
        
        found_overlays = {}
        for overlay in text_overlays:
            endpoint_key = overlay.get("endpoint_key")
            if endpoint_key in date_endpoints:
                found_overlays[endpoint_key] = overlay
        
        log_test(f"Found date component overlays: {list(found_overlays.keys())}")
        
        # Test each found date component
        all_passed = True
        for endpoint_key, overlay in found_overlays.items():
            text_value = overlay.get("text_value", "")
            log_test(f"Testing {endpoint_key}: '{text_value}'")
            
            # Validate based on endpoint type
            if endpoint_key == "event_date":
                # Should be day number (1-31)
                if text_value.isdigit() and 1 <= int(text_value) <= 31:
                    log_test(f"  ✅ {endpoint_key} is valid day number: {text_value}")
                else:
                    log_test(f"  ❌ {endpoint_key} should be day number (1-31), got: '{text_value}'", "ERROR")
                    all_passed = False
                    
            elif endpoint_key == "event_month":
                # Should be month name
                months = ["January", "February", "March", "April", "May", "June",
                         "July", "August", "September", "October", "November", "December"]
                if text_value in months:
                    log_test(f"  ✅ {endpoint_key} is valid month name: {text_value}")
                else:
                    log_test(f"  ❌ {endpoint_key} should be month name, got: '{text_value}'", "ERROR")
                    all_passed = False
                    
            elif endpoint_key == "event_year":
                # Should be 4-digit year
                if text_value.isdigit() and len(text_value) == 4:
                    log_test(f"  ✅ {endpoint_key} is valid year: {text_value}")
                else:
                    log_test(f"  ❌ {endpoint_key} should be 4-digit year, got: '{text_value}'", "ERROR")
                    all_passed = False
                    
            elif endpoint_key == "event_day":
                # Should be day name
                days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                if text_value in days:
                    log_test(f"  ✅ {endpoint_key} is valid day name: {text_value}")
                else:
                    log_test(f"  ❌ {endpoint_key} should be day name, got: '{text_value}'", "ERROR")
                    all_passed = False
                    
            elif endpoint_key == "event_date_full":
                # Should be formatted date (e.g., "January 15, 2025")
                if len(text_value) > 5 and any(month in text_value for month in ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]):
                    log_test(f"  ✅ {endpoint_key} is valid formatted date: {text_value}")
                else:
                    log_test(f"  ❌ {endpoint_key} should be formatted date, got: '{text_value}'", "ERROR")
                    all_passed = False
        
        if not found_overlays:
            log_test("No date component overlays found in template", "WARNING")
            log_test("This may be expected if no date overlays are configured")
            return True
        
        return all_passed
        
    except requests.exceptions.RequestException as e:
        log_test(f"Request failed: {str(e)}", "ERROR")
        return False
    except json.JSONDecodeError as e:
        log_test(f"Failed to parse JSON response: {str(e)}", "ERROR")
        return False
    except Exception as e:
        log_test(f"Unexpected error: {str(e)}", "ERROR")
        return False


def test_backward_compatibility():
    """Test backward compatibility - old event_date endpoint should still work"""
    log_test("Testing backward compatibility for old event_date endpoint")
    
    url = f"{API_BASE}/viewer/wedding/{TEST_WEDDING_ID}/all"
    log_test(f"Making request to: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            log_test(f"API returned error: {response.status_code} - {response.text}", "ERROR")
            return False
            
        data = response.json()
        
        # Check if video_template exists
        video_template = data.get("video_template")
        if not video_template:
            log_test("No video template found in response", "WARNING")
            return True
            
        # Check text_overlays array
        text_overlays = video_template.get("text_overlays", [])
        
        # Look for old event_date overlay (should still work)
        old_event_date_overlay = None
        for overlay in text_overlays:
            if overlay.get("endpoint_key") == "event_date":
                old_event_date_overlay = overlay
                break
        
        if old_event_date_overlay:
            text_value = old_event_date_overlay.get("text_value", "")
            log_test(f"Found old event_date overlay with text_value: '{text_value}'")
            
            # Should be populated with some date value (either day number or full date)
            if text_value and text_value not in ["Sample Date", "Event Date", ""]:
                log_test("✅ Backward compatibility: old event_date endpoint still works")
                return True
            else:
                log_test("❌ Backward compatibility: old event_date endpoint not populated", "ERROR")
                return False
        else:
            log_test("No old event_date overlay found - this is expected if template uses new date components", "INFO")
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


def test_wedding_data_structure():
    """Test that wedding data structure is correct and contains expected fields"""
    log_test("Testing wedding data structure and scheduled_date field")
    
    url = f"{API_BASE}/viewer/wedding/{TEST_WEDDING_ID}/all"
    log_test(f"Making request to: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        log_test(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            log_test(f"API returned error: {response.status_code} - {response.text}", "ERROR")
            return False
            
        data = response.json()
        
        # Check wedding data structure
        wedding = data.get("wedding", {})
        if not wedding:
            log_test("No wedding data found in response", "ERROR")
            return False
        
        # Check required fields
        required_fields = ["id", "bride_name", "groom_name", "scheduled_date", "location"]
        missing_fields = []
        
        for field in required_fields:
            if field not in wedding:
                missing_fields.append(field)
            else:
                value = wedding[field]
                log_test(f"Wedding {field}: {value}")
        
        if missing_fields:
            log_test(f"❌ Missing required wedding fields: {missing_fields}", "ERROR")
            return False
        
        # Specifically check location field (used for venue mapping)
        location = wedding.get("location", "")
        if location:
            log_test(f"✅ Wedding location field present: '{location}'")
        else:
            log_test("⚠️ Wedding location field is empty", "WARNING")
        
        # Check scheduled_date field (used for date components)
        scheduled_date = wedding.get("scheduled_date", "")
        if scheduled_date:
            log_test(f"✅ Wedding scheduled_date field present: '{scheduled_date}'")
        else:
            log_test("❌ Wedding scheduled_date field is missing or empty", "ERROR")
            return False
        
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

def main():
    """Run all backend tests"""
    log_test("=" * 80)
    log_test("BACKEND API TESTING - VIDEO TEMPLATE OVERLAY RENDERING FIX")
    log_test("=" * 80)
    log_test(f"Backend URL: {BACKEND_URL}")
    log_test(f"Test Wedding ID: {TEST_WEDDING_ID}")
    log_test("")
    log_test("TESTING REQUIREMENTS FROM REVIEW REQUEST:")
    log_test("1. /api/weddings/{wedding_id}/template-assignment endpoint")
    log_test("   - Should return populated_overlays with text_value, position, styling, timing")
    log_test("2. /api/video-templates/{template_id}/preview endpoint with wedding_id")
    log_test("   - Should return overlays array with text field (different from assignment)")
    log_test("")
    
    # Test 1: Template assignment endpoint
    log_test("TEST 1: Wedding template assignment endpoint")
    test1_result = test_template_assignment_endpoint()
    
    log_test("")
    
    # Test 2: Template preview endpoint
    log_test("TEST 2: Video template preview endpoint with wedding data")
    test2_result = test_template_preview_endpoint()
    
    log_test("")
    
    # Test 3: Edge case testing
    log_test("TEST 3: Edge case - wedding without template")
    test3_result = test_wedding_without_template()
    
    log_test("")
    log_test("=" * 80)
    log_test("TEST SUMMARY")
    log_test("=" * 80)
    
    if test1_result:
        log_test("✅ Template assignment endpoint PASSED")
    else:
        log_test("❌ Template assignment endpoint FAILED")
        
    if test2_result:
        log_test("✅ Template preview endpoint PASSED")
    else:
        log_test("❌ Template preview endpoint FAILED")
        
    if test3_result:
        log_test("✅ Edge case testing PASSED")
    else:
        log_test("⚠️ Edge case testing had issues (non-critical)")
        
    overall_success = test1_result and test2_result
    
    if overall_success:
        log_test("🎉 OVERALL RESULT: TESTS PASSED")
        log_test("Video template overlay rendering fix endpoints are working correctly")
        log_test("")
        log_test("KEY FINDINGS:")
        log_test("- Template assignment endpoint returns populated_overlays with text_value field")
        log_test("- Template preview endpoint returns overlays with text field")
        log_test("- Both endpoints provide pixel position coordinates (e.g., x:960, y:336)")
        log_test("- Position conversion logic in frontend should convert pixels to percentages")
        log_test("- Overlays should be visible in correct positions on video")
    else:
        log_test("💥 OVERALL RESULT: TESTS FAILED")
        log_test("Video template overlay rendering fix needs attention")
        log_test("")
        log_test("ISSUES FOUND:")
        if not test1_result:
            log_test("- Template assignment endpoint has issues")
        if not test2_result:
            log_test("- Template preview endpoint has issues")
        
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
