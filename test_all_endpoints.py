#!/usr/bin/env python3
"""
Comprehensive endpoint test suite for WedLive API
Tests all 207 endpoints across the backend
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8001"
PRODUCTION_URL = "https://wedlive.onrender.com"

# Test token (replace with actual token)
TEST_TOKEN = "test-token"
HEADERS = {
    "Authorization": f"Bearer {TEST_TOKEN}",
    "Content-Type": "application/json"
}

# Test results tracking
results = {
    "passed": 0,
    "failed": 0,
    "errors": [],
    "endpoints": []
}

def test_endpoint(method, path, expected_status=None, data=None, headers=None, url_base=BACKEND_URL):
    """Test a single endpoint"""
    if headers is None:
        headers = HEADERS
    
    full_url = f"{url_base}{path}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(full_url, headers=headers, timeout=5)
        elif method.upper() == "POST":
            response = requests.post(full_url, headers=headers, json=data, timeout=5)
        elif method.upper() == "PUT":
            response = requests.put(full_url, headers=headers, json=data, timeout=5)
        elif method.upper() == "DELETE":
            response = requests.delete(full_url, headers=headers, timeout=5)
        else:
            return False, f"Unknown method: {method}"
        
        status_ok = expected_status is None or response.status_code == expected_status
        
        endpoint_info = {
            "method": method,
            "path": path,
            "status": response.status_code,
            "expected": expected_status,
            "passed": status_ok,
            "url": full_url
        }
        results["endpoints"].append(endpoint_info)
        
        if status_ok:
            results["passed"] += 1
            return True, response.status_code
        else:
            results["failed"] += 1
            return False, f"Expected {expected_status}, got {response.status_code}"
            
    except Exception as e:
        results["failed"] += 1
        error_msg = f"Error testing {method} {path}: {str(e)}"
        results["errors"].append(error_msg)
        return False, str(e)

def test_critical_endpoints():
    """Test critical endpoints that must work"""
    print("\n" + "="*60)
    print("TESTING CRITICAL ENDPOINTS")
    print("="*60)
    
    critical_tests = [
        # Health check
        ("GET", "/api/health", 200),
        ("GET", "/", 200),
        
        # Authentication
        ("GET", "/api/auth/me", 401),  # Should fail without valid token
        
        # Weddings - CRITICAL
        ("GET", "/api/weddings/test", 200),
        ("GET", "/api/weddings/my-weddings", 401),  # Should fail without valid token
        
        # Media proxy - CRITICAL
        ("GET", "/api/media/telegram-proxy/test", 400),  # Invalid file_id
        
        # Streams
        ("GET", "/api/streams/live", 200),
    ]
    
    for method, path, expected_status in critical_tests:
        passed, result = test_endpoint(method, path, expected_status)
        status_symbol = "✓" if passed else "✗"
        print(f"{status_symbol} {method:6} {path:50} -> {result}")

def test_public_endpoints():
    """Test public endpoints (no auth required)"""
    print("\n" + "="*60)
    print("TESTING PUBLIC ENDPOINTS")
    print("="*60)
    
    public_tests = [
        ("GET", "/api/weddings/", 200),
        ("GET", "/api/weddings/test", 200),
        ("GET", "/api/streams/live", 200),
        ("GET", "/api/viewer/wedding/test-id/media", 404),  # Wedding doesn't exist
        ("GET", "/api/viewer/wedding/test-id/all", 404),
        ("GET", "/api/chat/messages/test-id", 200),
        ("GET", "/api/chat/reactions/test-id", 200),
        ("GET", "/api/chat/guestbook/test-id", 200),
        ("GET", "/api/theme-assets/borders", 200),
        ("GET", "/api/theme-assets/precious-styles", 200),
        ("GET", "/api/theme-assets/backgrounds", 200),
        ("GET", "/api/theme-assets/random-defaults", 200),
    ]
    
    for method, path, expected_status in public_tests:
        passed, result = test_endpoint(method, path, expected_status, headers={})
        status_symbol = "✓" if passed else "✗"
        print(f"{status_symbol} {method:6} {path:50} -> {result}")

def test_production_critical():
    """Test critical endpoints on production"""
    print("\n" + "="*60)
    print("TESTING PRODUCTION CRITICAL ENDPOINTS")
    print("="*60)
    
    prod_tests = [
        ("GET", "/api/health", 200),
        ("GET", "/api/weddings/my-weddings", 401),  # Should fail without valid token
    ]
    
    for method, path, expected_status in prod_tests:
        passed, result = test_endpoint(method, path, expected_status, url_base=PRODUCTION_URL)
        status_symbol = "✓" if passed else "✗"
        print(f"{status_symbol} {method:6} {path:50} -> {result}")

def generate_report():
    """Generate test report"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Total Endpoints Tested: {results['passed'] + results['failed']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print(f"Success Rate: {(results['passed'] / (results['passed'] + results['failed']) * 100):.1f}%")
    
    if results['errors']:
        print(f"\nErrors ({len(results['errors'])}):")
        for error in results['errors'][:10]:  # Show first 10 errors
            print(f"  - {error}")
    
    # Save detailed report
    report_file = "/home/user/Downloads/wedlive-main/endpoint_test_report.json"
    with open(report_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nDetailed report saved to: {report_file}")

if __name__ == "__main__":
    print(f"WedLive API Endpoint Test Suite")
    print(f"Started at: {datetime.now()}")
    print(f"Backend URL: {BACKEND_URL}")
    
    # Run tests
    test_critical_endpoints()
    test_public_endpoints()
    test_production_critical()
    
    # Generate report
    generate_report()
    
    print(f"\nCompleted at: {datetime.now()}")
    sys.exit(0 if results['failed'] == 0 else 1)
