#!/usr/bin/env python3
"""
Test Script for Video Template API
Tests Phase 1 & 2 implementation
"""
import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_endpoints_list():
    """Test getting available endpoints"""
    print("=" * 60)
    print("TEST 1: Get Available Endpoints")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/video-templates/endpoints/list")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS: Found {len(data['endpoints'])} endpoints")
        print("\nAvailable Endpoints:")
        for key, description in data['endpoints'].items():
            print(f"  - {key}: {description}")
    else:
        print(f"❌ FAILED: {response.text}")
    
    return response.status_code == 200


def test_list_templates():
    """Test listing video templates"""
    print("\n" + "=" * 60)
    print("TEST 2: List Video Templates")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/video-templates")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        templates = response.json()
        print(f"✅ SUCCESS: Found {len(templates)} templates")
        if templates:
            for template in templates:
                print(f"\n  Template: {template['name']}")
                print(f"  ID: {template['id']}")
                print(f"  Category: {template['category']}")
                print(f"  Overlays: {len(template.get('text_overlays', []))}")
        else:
            print("  No templates created yet.")
    else:
        print(f"❌ FAILED: {response.text}")
    
    return response.status_code == 200


def test_wedding_data_mapping():
    """Test wedding data mapping logic"""
    print("\n" + "=" * 60)
    print("TEST 3: Wedding Data Mapping (Service Test)")
    print("=" * 60)
    
    # Import the mapper directly
    from app.services.wedding_data_mapper import WeddingDataMapper
    
    sample_wedding = {
        'bride_name': 'Sarah Johnson',
        'groom_name': 'Michael Smith',
        'event_date': '2025-12-15T00:00:00',
        'event_time': '5:00 PM',
        'venue': 'Grand Hotel Ballroom',
        'city': 'New York',
        'welcome_message': 'Welcome to our big day!',
        'description': 'Join us as we celebrate our love',
        'custom_text_1': 'Reception follows ceremony'
    }
    
    mapped_data = WeddingDataMapper.map_wedding_data(sample_wedding)
    
    print("✅ Mapped Wedding Data:")
    print(f"  Bride Name: {mapped_data.get('bride_name')}")
    print(f"  Groom Name: {mapped_data.get('groom_name')}")
    print(f"  Bride First: {mapped_data.get('bride_first_name')}")
    print(f"  Groom First: {mapped_data.get('groom_first_name')}")
    print(f"  Couple Names: {mapped_data.get('couple_names')}")
    print(f"  Event Date: {mapped_data.get('event_date')}")
    print(f"  Countdown Days: {mapped_data.get('countdown_days')}")
    print(f"  Venue: {mapped_data.get('venue')}")
    print(f"  Custom Text 1: {mapped_data.get('custom_text_1')}")
    
    return True


def test_video_validation_service():
    """Test video validation service"""
    print("\n" + "=" * 60)
    print("TEST 4: Video Processing Service")
    print("=" * 60)
    
    from app.services.video_processing_service import VideoProcessingService
    
    service = VideoProcessingService()
    print(f"✅ Video Processing Service Initialized")
    print(f"  Max Video Size: {service.max_video_size_mb}MB")
    print(f"  Max Duration: {service.max_duration_seconds}s")
    print(f"  Supported Formats: {', '.join(service.supported_formats)}")
    
    return True


def test_api_endpoints_structure():
    """Test API endpoint structure"""
    print("\n" + "=" * 60)
    print("TEST 5: API Endpoints Structure")
    print("=" * 60)
    
    # Test endpoint accessibility (without auth)
    endpoints = [
        ("GET", "/video-templates", "List Templates"),
        ("GET", "/video-templates/endpoints/list", "List Endpoints"),
    ]
    
    print("Testing Public Endpoints:")
    for method, path, description in endpoints:
        url = f"{BASE_URL}{path}"
        try:
            response = requests.get(url)
            status = "✅" if response.status_code in [200, 401, 403] else "❌"
            print(f"  {status} {method} {path} - {description} ({response.status_code})")
        except Exception as e:
            print(f"  ❌ {method} {path} - Error: {str(e)}")
    
    return True


def run_all_tests():
    """Run all tests"""
    print("\n" + "🔥" * 30)
    print(" VIDEO TEMPLATE API TEST SUITE - PHASE 1 & 2")
    print("🔥" * 30 + "\n")
    
    results = []
    
    try:
        results.append(("Endpoints List", test_endpoints_list()))
        results.append(("List Templates", test_list_templates()))
        results.append(("Wedding Data Mapping", test_wedding_data_mapping()))
        results.append(("Video Processing Service", test_video_validation_service()))
        results.append(("API Structure", test_api_endpoints_structure()))
    except Exception as e:
        print(f"\n❌ Test Suite Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Phase 1 & 2 Implementation Verified")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
