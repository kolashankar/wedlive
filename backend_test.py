#!/usr/bin/env python3
"""
Backend API Testing Suite
Tests video template overlay timing functionality for wedding b75e23c9-ca5e-4d10-bf20-065169d1a01e
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
WEDDING_ID = "b75e23c9-ca5e-4d10-bf20-065169d1a01e"

# Get backend URL from environment
try:
    with open('/app/frontend/.env', 'r') as f:
        env_content = f.read()
        
    # Extract REACT_APP_BACKEND_URL if set
    backend_url = None
    for line in env_content.split('\n'):
        if line.startswith('REACT_APP_BACKEND_URL=') and '=' in line:
            backend_url = line.split('=', 1)[1].strip()
            break
    
    # If not found in frontend .env, check backend .env for BACKEND_URL
    if not backend_url:
        with open('/app/backend/.env', 'r') as f:
            backend_env = f.read()
        for line in backend_env.split('\n'):
            if line.startswith('BACKEND_URL=') and '=' in line:
                backend_url = line.split('=', 1)[1].strip()
                break
    
    # Default fallback
    if not backend_url:
        backend_url = "http://localhost:8001"
        
    BASE_URL = f"{backend_url}/api"
    print(f"🔗 Using Backend URL: {BASE_URL}")
    
except Exception as e:
    print(f"⚠️  Could not read .env files: {e}")
    BASE_URL = "http://localhost:8001/api"
    print(f"🔗 Using Default Backend URL: {BASE_URL}")

def test_video_template_overlay_rendering():
    """
    Test video template overlay rendering for specific wedding
    Focus: resolution field and text overlay population as per review request
    """
    print(f"\n🎬 TESTING VIDEO TEMPLATE OVERLAY RENDERING FOR WEDDING: {WEDDING_ID}")
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
        
        # CRITICAL TEST 1: Check resolution field (as per review request)
        print("\n📐 TESTING RESOLUTION FIELD (Review Request Priority):")
        print("-" * 60)
        
        resolution = video_template.get('resolution')
        if resolution:
            print(f"✅ Resolution field found: {resolution}")
            
            # Validate resolution format (should be WIDTHxHEIGHT)
            if 'x' in str(resolution):
                width, height = resolution.split('x')
                width, height = int(width), int(height)
                print(f"✅ Resolution parsed: {width}x{height}")
                
                # Check if it's portrait orientation (height > width)
                if height > width:
                    print(f"✅ Portrait orientation confirmed: {height} > {width}")
                    
                    # Check if it matches expected portrait resolutions
                    expected_resolutions = ['720x1280', '1080x1920', '540x960']
                    if resolution in expected_resolutions:
                        print(f"✅ Resolution matches expected portrait format: {resolution}")
                    else:
                        print(f"⚠️  Resolution {resolution} is portrait but not in common formats: {expected_resolutions}")
                else:
                    print(f"❌ FAILED: Expected portrait resolution (height > width), got {width}x{height}")
                    return False
            else:
                print(f"❌ FAILED: Resolution format invalid: {resolution} (expected WIDTHxHEIGHT)")
                return False
        else:
            print("❌ FAILED: Resolution field missing from video_template")
            return False
        
        # CRITICAL TEST 2: Check text_overlays population (as per review request)
        print(f"\n📝 TESTING TEXT OVERLAYS POPULATION (Review Request Priority):")
        print("-" * 60)
        
        text_overlays = video_template.get('text_overlays', [])
        overlay_count = len(text_overlays)
        print(f"📊 Found {overlay_count} text overlays")
        
        if overlay_count == 0:
            print("❌ FAILED: No text overlays found")
            return False
        
        # CRITICAL TEST 3: Validate wedding names (Radha, Rajagopal)
        print(f"\n👰 TESTING WEDDING NAMES (Review Request Priority):")
        print("-" * 60)
        
        radha_found = False
        rajagopal_found = False
        
        for i, overlay in enumerate(text_overlays, 1):
            text_value = overlay.get('text_value', '')
            if text_value:
                if 'radha' in text_value.lower():
                    radha_found = True
                    print(f"✅ Overlay {i}: Found 'Radha' - '{text_value}'")
                elif 'rajagopal' in text_value.lower():
                    rajagopal_found = True
                    print(f"✅ Overlay {i}: Found 'Rajagopal' - '{text_value}'")
                else:
                    print(f"  📝 Overlay {i}: Other data - '{text_value}'")
        
        if not radha_found:
            print("❌ FAILED: 'Radha' not found in any text overlay")
            return False
        
        if not rajagopal_found:
            print("❌ FAILED: 'Rajagopal' not found in any text overlay")
            return False
        
        print("✅ Both wedding names (Radha, Rajagopal) found in overlays")
        
        # Additional validation: Check overlay structure
        print(f"\n🔍 TESTING OVERLAY STRUCTURE:")
        print("-" * 50)
        
        populated_overlays = 0
        for i, overlay in enumerate(text_overlays, 1):
            text_value = overlay.get('text_value', '')
            if text_value and text_value.strip():
                populated_overlays += 1
        
        print(f"📊 {populated_overlays}/{overlay_count} overlays have populated text")
        
        if populated_overlays == 0:
            print("❌ FAILED: No overlays have populated text")
            return False
        
        # Summary
        print(f"\n📋 REVIEW REQUEST VALIDATION SUMMARY:")
        print("=" * 60)
        
        success_criteria = [
            ("✅ API endpoint /api/viewer/wedding/{id}/all works", True),
            ("✅ video_template.resolution returned correctly", resolution is not None),
            ("✅ Resolution is portrait format (720x1280 or similar)", height > width if resolution else False),
            ("✅ text_overlays are populated", populated_overlays > 0),
            ("✅ Wedding name 'Radha' found in overlays", radha_found),
            ("✅ Wedding name 'Rajagopal' found in overlays", rajagopal_found)
        ]
        
        passed = sum(1 for _, result in success_criteria if result)
        total = len(success_criteria)
        
        for criteria, result in success_criteria:
            status = "✅" if result else "❌"
            print(f"{status} {criteria}")
        
        print(f"\n🎯 REVIEW REQUEST RESULT: {passed}/{total} criteria passed")
        
        # Specific findings for the review request
        print(f"\n📋 SPECIFIC FINDINGS:")
        print("-" * 40)
        print(f"🔍 Resolution: {resolution}")
        print(f"🔍 Text Overlays Count: {overlay_count}")
        print(f"🔍 Populated Overlays: {populated_overlays}")
        print(f"🔍 Radha Found: {'Yes' if radha_found else 'No'}")
        print(f"🔍 Rajagopal Found: {'Yes' if rajagopal_found else 'No'}")
        
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
        return False

def main():
    """Main test runner"""
    print("🚀 BACKEND API TESTING SUITE")
    print("Testing Video Template Overlay Rendering (Review Request)")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Run the test
    success = test_video_template_overlay_rendering()
    
    if success:
        print(f"\n🎉 REVIEW REQUEST VALIDATION COMPLETED SUCCESSFULLY")
        sys.exit(0)
    else:
        print(f"\n💥 REVIEW REQUEST VALIDATION FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()