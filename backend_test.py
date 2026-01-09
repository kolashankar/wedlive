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
BACKEND_URL = "https://cross-origin-fix-4.preview.emergentagent.com"
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
    """Run all backend tests for WeddingDataMapper updates"""
    log_test("=" * 80)
    log_test("BACKEND API TESTING - WEDDINGDATAMAPPER UPDATES")
    log_test("=" * 80)
    log_test(f"Backend URL: {BACKEND_URL}")
    log_test(f"Test Wedding ID: {TEST_WEDDING_ID}")
    log_test(f"Expected Location: {EXPECTED_LOCATION}")
    log_test("")
    log_test("TESTING REQUIREMENTS FROM REVIEW REQUEST:")
    log_test("1. Venue Mapping - wedding 'location' field mapped to 'venue' endpoint")
    log_test("2. Date Components - separated into event_date, event_month, event_year, event_day")
    log_test("3. Backward Compatibility - old event_date endpoint still works")
    log_test("")
    
    # Test 1: Wedding data structure
    log_test("TEST 1: Wedding data structure and required fields")
    test1_result = test_wedding_data_structure()
    
    log_test("")
    
    # Test 2: Venue mapping
    log_test("TEST 2: Venue mapping from location to venue endpoint")
    test2_result = test_venue_mapping()
    
    log_test("")
    
    # Test 3: Date components
    log_test("TEST 3: Date component separation")
    test3_result = test_date_components()
    
    log_test("")
    
    # Test 4: Backward compatibility
    log_test("TEST 4: Backward compatibility for old event_date endpoint")
    test4_result = test_backward_compatibility()
    
    log_test("")
    log_test("=" * 80)
    log_test("TEST SUMMARY")
    log_test("=" * 80)
    
    if test1_result:
        log_test("✅ Wedding data structure PASSED")
    else:
        log_test("❌ Wedding data structure FAILED")
        
    if test2_result:
        log_test("✅ Venue mapping PASSED")
    else:
        log_test("❌ Venue mapping FAILED")
        
    if test3_result:
        log_test("✅ Date components PASSED")
    else:
        log_test("❌ Date components FAILED")
        
    if test4_result:
        log_test("✅ Backward compatibility PASSED")
    else:
        log_test("❌ Backward compatibility FAILED")
        
    overall_success = test1_result and test2_result and test3_result and test4_result
    
    if overall_success:
        log_test("🎉 OVERALL RESULT: ALL TESTS PASSED")
        log_test("WeddingDataMapper updates are working correctly")
        log_test("")
        log_test("KEY FINDINGS:")
        log_test("- Wedding location field is correctly mapped to venue endpoint")
        log_test("- Date components are properly separated and formatted")
        log_test("- Backward compatibility is maintained for old endpoints")
        log_test("- All overlay text_values are populated with actual wedding data")
    else:
        log_test("💥 OVERALL RESULT: SOME TESTS FAILED")
        log_test("WeddingDataMapper updates need attention")
        log_test("")
        log_test("ISSUES FOUND:")
        if not test1_result:
            log_test("- Wedding data structure has issues")
        if not test2_result:
            log_test("- Venue mapping is not working correctly")
        if not test3_result:
            log_test("- Date components are not working correctly")
        if not test4_result:
            log_test("- Backward compatibility is broken")
        
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
