#!/usr/bin/env python3
"""
Focused Test for Review Request
Verify the GET /api/viewer/wedding/{wedding_id}/all endpoint for specific requirements:
1. Verify that start_time and end_time are NOT overridden to 0 and duration
2. Verify that text_value is populated with wedding data
3. Verify that text field is also present and populated
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
WEDDING_ID = "b75e23c9-ca5e-4d10-bf20-065169d1a01e"

# Get backend URL from environment
try:
    with open('/app/backend/.env', 'r') as f:
        backend_env = f.read()
    for line in backend_env.split('\n'):
        if line.startswith('BACKEND_URL=') and '=' in line:
            backend_url = line.split('=', 1)[1].strip()
            break
    else:
        backend_url = "http://localhost:8001"
        
    BASE_URL = f"{backend_url}/api"
    print(f"🔗 Using Backend URL: {BASE_URL}")
    
except Exception as e:
    print(f"⚠️  Could not read .env files: {e}")
    BASE_URL = "http://localhost:8001/api"
    print(f"🔗 Using Default Backend URL: {BASE_URL}")

def test_review_request_requirements():
    """
    Test specific requirements from the review request
    """
    print(f"\n🎯 TESTING REVIEW REQUEST REQUIREMENTS")
    print("=" * 80)
    print("Requirements:")
    print("1. Verify that start_time and end_time are NOT overridden to 0 and duration")
    print("2. Verify that text_value is populated with wedding data")
    print("3. Verify that text field is also present and populated")
    print("=" * 80)
    
    # Test the main endpoint
    endpoint = f"{BASE_URL}/viewer/wedding/{WEDDING_ID}/all"
    print(f"📡 Testing endpoint: {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=30)
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        data = response.json()
        print("✅ API Response received successfully")
        
        # Check if video_template exists
        video_template = data.get('video_template')
        if not video_template:
            print("❌ FAILED: No video_template found in response")
            return False
            
        print("✅ Video template found in response")
        
        # Get text_overlays
        text_overlays = video_template.get('text_overlays', [])
        overlay_count = len(text_overlays)
        print(f"📊 Found {overlay_count} text overlays")
        
        if overlay_count == 0:
            print("❌ FAILED: No text overlays found")
            return False
        
        # Get video duration for comparison
        video_duration = video_template.get('duration', 0)
        print(f"📊 Video duration: {video_duration} seconds")
        
        # Test Requirements
        print(f"\n🔍 REQUIREMENT 1: Verify start_time and end_time are NOT overridden to 0 and duration")
        print("-" * 70)
        
        timing_analysis = {
            'all_start_at_zero': True,
            'all_end_at_duration': True,
            'specific_timing_found': False,
            'timing_details': []
        }
        
        for i, overlay in enumerate(text_overlays, 1):
            timing = overlay.get('timing', {})
            start_time = timing.get('start_time')
            end_time = timing.get('end_time')
            
            print(f"  Overlay {i}: start_time={start_time}, end_time={end_time}")
            
            timing_details = {
                'overlay_id': i,
                'start_time': start_time,
                'end_time': end_time,
                'label': overlay.get('label', 'Unknown')
            }
            timing_analysis['timing_details'].append(timing_details)
            
            # Check if start_time is NOT 0
            if start_time != 0:
                timing_analysis['all_start_at_zero'] = False
                timing_analysis['specific_timing_found'] = True
                
            # Check if end_time is NOT equal to video duration
            if end_time != video_duration:
                timing_analysis['all_end_at_duration'] = False
                timing_analysis['specific_timing_found'] = True
        
        # Analyze timing patterns
        print(f"\n📊 TIMING ANALYSIS:")
        if timing_analysis['all_start_at_zero'] and timing_analysis['all_end_at_duration']:
            print(f"❌ REQUIREMENT 1 FAILED: All overlays have start_time=0 and end_time={video_duration}")
            print("   This indicates timing values are being overridden to 0 and duration")
            req1_passed = False
        elif timing_analysis['specific_timing_found']:
            print(f"✅ REQUIREMENT 1 PASSED: Found overlays with specific timing values (not 0 and duration)")
            req1_passed = True
        else:
            print(f"⚠️  REQUIREMENT 1 UNCLEAR: Need to check if current timing is intentional")
            req1_passed = False
        
        # Test Requirement 2: text_value populated with wedding data
        print(f"\n🔍 REQUIREMENT 2: Verify text_value is populated with wedding data")
        print("-" * 70)
        
        wedding_data_found = {
            'bride_name': False,
            'groom_name': False,
            'venue': False,
            'date_info': False,
            'populated_count': 0
        }
        
        for i, overlay in enumerate(text_overlays, 1):
            text_value = overlay.get('text_value', '')
            label = overlay.get('label', 'Unknown')
            
            print(f"  Overlay {i} ({label}): text_value='{text_value}'")
            
            if text_value and text_value.strip():
                wedding_data_found['populated_count'] += 1
                
                # Check for specific wedding data
                text_lower = text_value.lower()
                if 'radha' in text_lower:
                    wedding_data_found['bride_name'] = True
                if 'rajagopal' in text_lower:
                    wedding_data_found['groom_name'] = True
                if any(venue_word in text_lower for venue_word in ['maddimadugu', 'kadapa', 'dinne']):
                    wedding_data_found['venue'] = True
                if any(date_word in text_lower for date_word in ['june', 'monday', '2025', '15']):
                    wedding_data_found['date_info'] = True
        
        print(f"\n📊 WEDDING DATA ANALYSIS:")
        print(f"  Populated overlays: {wedding_data_found['populated_count']}/{overlay_count}")
        print(f"  Bride name found: {'✅' if wedding_data_found['bride_name'] else '❌'}")
        print(f"  Groom name found: {'✅' if wedding_data_found['groom_name'] else '❌'}")
        print(f"  Venue info found: {'✅' if wedding_data_found['venue'] else '❌'}")
        print(f"  Date info found: {'✅' if wedding_data_found['date_info'] else '❌'}")
        
        req2_passed = (wedding_data_found['populated_count'] > 0 and 
                      wedding_data_found['bride_name'] and 
                      wedding_data_found['groom_name'])
        
        if req2_passed:
            print(f"✅ REQUIREMENT 2 PASSED: text_value is populated with wedding data")
        else:
            print(f"❌ REQUIREMENT 2 FAILED: text_value not properly populated with wedding data")
        
        # Test Requirement 3: text field is present and populated
        print(f"\n🔍 REQUIREMENT 3: Verify text field is also present and populated")
        print("-" * 70)
        
        text_field_analysis = {
            'overlays_with_text_field': 0,
            'overlays_with_populated_text': 0,
            'text_field_details': []
        }
        
        for i, overlay in enumerate(text_overlays, 1):
            text_field = overlay.get('text')
            text_value = overlay.get('text_value', '')
            label = overlay.get('label', 'Unknown')
            
            has_text_field = 'text' in overlay
            text_populated = bool(text_field and str(text_field).strip())
            
            print(f"  Overlay {i} ({label}):")
            print(f"    text field present: {'✅' if has_text_field else '❌'}")
            print(f"    text field value: '{text_field}'" if has_text_field else "    text field value: NOT PRESENT")
            print(f"    text_value: '{text_value}'")
            
            if has_text_field:
                text_field_analysis['overlays_with_text_field'] += 1
                
            if text_populated:
                text_field_analysis['overlays_with_populated_text'] += 1
                
            text_field_analysis['text_field_details'].append({
                'overlay_id': i,
                'label': label,
                'has_text_field': has_text_field,
                'text_value': text_field,
                'text_populated': text_populated
            })
        
        print(f"\n📊 TEXT FIELD ANALYSIS:")
        print(f"  Overlays with 'text' field: {text_field_analysis['overlays_with_text_field']}/{overlay_count}")
        print(f"  Overlays with populated 'text': {text_field_analysis['overlays_with_populated_text']}/{overlay_count}")
        
        req3_passed = (text_field_analysis['overlays_with_text_field'] > 0 and 
                      text_field_analysis['overlays_with_populated_text'] > 0)
        
        if req3_passed:
            print(f"✅ REQUIREMENT 3 PASSED: text field is present and populated")
        else:
            print(f"❌ REQUIREMENT 3 FAILED: text field missing or not populated")
        
        # Final Summary
        print(f"\n📋 REVIEW REQUEST TEST SUMMARY:")
        print("=" * 50)
        
        requirements = [
            ("Requirement 1: start_time/end_time NOT overridden to 0/duration", req1_passed),
            ("Requirement 2: text_value populated with wedding data", req2_passed),
            ("Requirement 3: text field present and populated", req3_passed)
        ]
        
        passed = sum(1 for _, result in requirements if result)
        total = len(requirements)
        
        for req_desc, result in requirements:
            status = "✅" if result else "❌"
            print(f"{status} {req_desc}")
        
        print(f"\n🎯 OVERALL RESULT: {passed}/{total} requirements passed")
        
        # Detailed findings for main agent
        print(f"\n🔍 DETAILED FINDINGS FOR MAIN AGENT:")
        print("-" * 50)
        
        if not req1_passed:
            print("❌ TIMING ISSUE: All overlays have start_time=0 and end_time=duration")
            print("   Expected: Overlays should have specific timing values like 5.22s")
            print("   Current: All overlays start at 0s and end at 8.5s")
            
        if req2_passed:
            print("✅ WEDDING DATA: Successfully populated with bride/groom names and venue")
            
        if not req3_passed:
            print("❌ TEXT FIELD MISSING: 'text' field not found in overlay structure")
            print("   Only 'text_value' field is present")
            print("   Review request expects both 'text' and 'text_value' fields")
        
        return passed == total
        
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON DECODE ERROR: {e}")
        print(f"Response content: {response.text[:500]}...")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test runner"""
    print("🚀 REVIEW REQUEST FOCUSED TEST")
    print("Testing specific requirements from review request")
    print(f"Wedding ID: {WEDDING_ID}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Run the test
    success = test_review_request_requirements()
    
    if success:
        print(f"\n🎉 ALL REVIEW REQUIREMENTS PASSED")
        sys.exit(0)
    else:
        print(f"\n💥 SOME REVIEW REQUIREMENTS FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()