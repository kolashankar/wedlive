#!/usr/bin/env python3
"""
Music API 403 Fix Testing Suite
Tests the specific endpoints that were fixed for JWT token key mismatch
"""

import requests
import json
import sys
import time
import uuid
import os
from datetime import datetime
from typing import Dict, List, Optional

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
    
    # Default fallback - use local backend for testing
    if not backend_url or "wedlive.onrender.com" in backend_url:
        backend_url = "http://localhost:8001"
        
    BASE_URL = f"{backend_url}/api"
    print(f"🔗 Using Backend URL: {BASE_URL}")
    
except Exception as e:
    print(f"⚠️  Could not read .env files: {e}")
    BASE_URL = "http://localhost:8001/api"
    print(f"🔗 Using Default Backend URL: {BASE_URL}")

class MusicAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.user_token = None
        self.test_wedding_id = None
        self.test_results = []
        
    def log_test_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result for summary"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "name": test_name,
            "success": success,
            "details": details,
            "status": status
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"    {details}")
    
    def setup_authentication(self) -> bool:
        """Setup authentication with admin credentials"""
        print("\n🔐 SETTING UP AUTHENTICATION")
        print("=" * 50)
        
        try:
            with open('/app/backend/.env', 'r') as f:
                env_content = f.read()
            
            admin_email = None
            admin_password = None
            
            for line in env_content.split('\n'):
                if line.startswith('ADMIN_EMAIL='):
                    admin_email = line.split('=', 1)[1].strip()
                elif line.startswith('ADMIN_PASSWORD='):
                    admin_password = line.split('=', 1)[1].strip()
            
            if not admin_email or not admin_password:
                self.log_test_result("Authentication Setup", False, "Admin credentials not found in .env")
                return False
            
            # Login request
            login_data = {
                "email": admin_email,
                "password": admin_password
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get("access_token")
                if self.user_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.user_token}"})
                    
                    # Verify token contains user_id (this is what was causing the issue)
                    import jwt
                    try:
                        # Decode without verification to check payload structure
                        payload = jwt.decode(self.user_token, options={"verify_signature": False})
                        if "user_id" in payload:
                            self.log_test_result("Authentication Setup", True, f"Logged in as {admin_email}, JWT contains user_id")
                        else:
                            self.log_test_result("Authentication Setup", False, f"JWT token missing user_id field: {list(payload.keys())}")
                            return False
                    except Exception as e:
                        self.log_test_result("Authentication Setup", True, f"Logged in as {admin_email} (could not verify JWT structure)")
                    
                    return True
            
            self.log_test_result("Authentication Setup", False, f"Login failed: {response.status_code} - {response.text}")
            return False
            
        except Exception as e:
            self.log_test_result("Authentication Setup", False, f"Error: {str(e)}")
            return False
    
    def setup_test_wedding(self) -> bool:
        """Setup test wedding for playlist testing"""
        print("\n💒 SETTING UP TEST WEDDING")
        print("=" * 50)
        
        wedding_data = {
            "title": "Music API Test Wedding",
            "bride_name": "TestBride",
            "groom_name": "TestGroom",
            "scheduled_date": "2024-12-31T18:00:00Z",
            "location": "Test Venue",
            "description": "Test wedding for music API functionality"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/weddings", json=wedding_data)
            
            if response.status_code == 201:
                data = response.json()
                self.test_wedding_id = data.get("id")
                if self.test_wedding_id:
                    self.log_test_result("Setup Test Wedding", True, f"Created wedding ID: {self.test_wedding_id}")
                    return True
            
            self.log_test_result("Setup Test Wedding", False, f"Failed: {response.status_code} - {response.text}")
            return False
            
        except Exception as e:
            self.log_test_result("Setup Test Wedding", False, f"Error: {str(e)}")
            return False
    
    def test_creator_music_my_library(self) -> bool:
        """Test GET /api/music/my-library endpoint"""
        print("\n🎵 TESTING CREATOR MUSIC - MY LIBRARY")
        print("=" * 50)
        
        try:
            response = self.session.get(f"{self.base_url}/music/my-library")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test_result("Creator Music - My Library", True, f"Success: returned {len(data)} items")
                    return True
                else:
                    self.log_test_result("Creator Music - My Library", False, f"Invalid response format: {type(data)}")
                    return False
            elif response.status_code == 403:
                self.log_test_result("Creator Music - My Library", False, f"403 Forbidden - JWT token issue not fixed: {response.text}")
                return False
            else:
                self.log_test_result("Creator Music - My Library", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Creator Music - My Library", False, f"Error: {str(e)}")
            return False
    
    def test_creator_music_storage(self) -> bool:
        """Test GET /api/music/storage endpoint"""
        print("\n💾 TESTING CREATOR MUSIC - STORAGE INFO")
        print("=" * 50)
        
        try:
            response = self.session.get(f"{self.base_url}/music/storage")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["storage_used", "storage_limit", "percentage"]
                if all(field in data for field in required_fields):
                    self.log_test_result("Creator Music - Storage Info", True, f"Success: {data.get('storage_used_formatted', 'N/A')} used")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test_result("Creator Music - Storage Info", False, f"Missing fields: {missing}")
                    return False
            elif response.status_code == 403:
                self.log_test_result("Creator Music - Storage Info", False, f"403 Forbidden - JWT token issue not fixed: {response.text}")
                return False
            else:
                self.log_test_result("Creator Music - Storage Info", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Creator Music - Storage Info", False, f"Error: {str(e)}")
            return False
    
    def test_creator_music_library(self) -> bool:
        """Test GET /api/music/library endpoint (public library)"""
        print("\n📚 TESTING CREATOR MUSIC - PUBLIC LIBRARY")
        print("=" * 50)
        
        try:
            # Test without category filter
            response = self.session.get(f"{self.base_url}/music/library")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    success_msg = f"Success: returned {len(data)} public music items"
                    
                    # Test with category filter
                    response2 = self.session.get(f"{self.base_url}/music/library?category=background_music")
                    if response2.status_code == 200:
                        data2 = response2.json()
                        if isinstance(data2, list):
                            success_msg += f", {len(data2)} background music items"
                    
                    self.log_test_result("Creator Music - Public Library", True, success_msg)
                    return True
                else:
                    self.log_test_result("Creator Music - Public Library", False, f"Invalid response format: {type(data)}")
                    return False
            elif response.status_code == 403:
                self.log_test_result("Creator Music - Public Library", False, f"403 Forbidden - JWT token issue not fixed: {response.text}")
                return False
            else:
                self.log_test_result("Creator Music - Public Library", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Creator Music - Public Library", False, f"Error: {str(e)}")
            return False
    
    def test_wedding_music_playlist(self) -> bool:
        """Test GET /api/weddings/{wedding_id}/music/playlist endpoint"""
        print("\n💒 TESTING WEDDING MUSIC - PLAYLIST")
        print("=" * 50)
        
        if not self.test_wedding_id:
            self.log_test_result("Wedding Music - Playlist", False, "No test wedding available")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/weddings/{self.test_wedding_id}/music/playlist")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["wedding_id", "music_playlist", "default_volume", "effects_enabled"]
                if all(field in data for field in required_fields):
                    playlist_count = len(data.get("music_playlist", []))
                    self.log_test_result("Wedding Music - Playlist", True, f"Success: playlist with {playlist_count} items")
                    return True
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test_result("Wedding Music - Playlist", False, f"Missing fields: {missing}")
                    return False
            elif response.status_code == 403:
                self.log_test_result("Wedding Music - Playlist", False, f"403 Forbidden - JWT token issue not fixed: {response.text}")
                return False
            else:
                self.log_test_result("Wedding Music - Playlist", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test_result("Wedding Music - Playlist", False, f"Error: {str(e)}")
            return False
    
    def test_backend_health(self) -> bool:
        """Test if backend is running"""
        print("\n🏥 TESTING BACKEND HEALTH")
        print("=" * 50)
        
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_test_result("Backend Health Check", True, "Backend is running")
                return True
            else:
                self.log_test_result("Backend Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test_result("Backend Health Check", False, f"Error: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 CLEANING UP TEST DATA")
        print("=" * 50)
        
        # Remove test wedding
        if self.test_wedding_id:
            try:
                response = self.session.delete(f"{self.base_url}/weddings/{self.test_wedding_id}")
                if response.status_code == 200:
                    print(f"  ✅ Removed test wedding: {self.test_wedding_id}")
                else:
                    print(f"  ⚠️ Failed to remove test wedding")
            except:
                print(f"  ⚠️ Error removing test wedding")
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("🎯 MUSIC API 403 FIX TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"\n📊 OVERALL RESULTS: {passed}/{total} tests passed")
        
        # Group results by status
        passed_tests = [r for r in self.test_results if r["success"]]
        failed_tests = [r for r in self.test_results if not r["success"]]
        
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            print("-" * 40)
            for test in failed_tests:
                print(f"  ❌ {test['name']}")
                if test['details']:
                    print(f"     {test['details']}")
        
        if passed_tests:
            print(f"\n✅ PASSED TESTS ({len(passed_tests)}):")
            print("-" * 40)
            for test in passed_tests:
                print(f"  ✅ {test['name']}")
        
        # Check for 403 errors specifically
        forbidden_errors = [t for t in failed_tests if "403 Forbidden" in t.get("details", "")]
        if forbidden_errors:
            print(f"\n🚨 CRITICAL: 403 FORBIDDEN ERRORS STILL PRESENT:")
            print("-" * 40)
            for test in forbidden_errors:
                print(f"  🚨 {test['name']}: {test['details']}")
            print("\n💡 The JWT token 'user_id' fix may not be working correctly.")
        
        return passed == total
    
    def run_all_tests(self) -> bool:
        """Run all music API tests"""
        print("🚀 MUSIC API 403 FIX TESTING SUITE")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("="*80)
        
        # Pre-testing setup
        if not self.test_backend_health():
            return False
        
        if not self.setup_authentication():
            return False
        
        if not self.setup_test_wedding():
            return False
        
        # Core music API tests (the ones that were fixed)
        self.test_creator_music_my_library()
        self.test_creator_music_storage()
        self.test_creator_music_library()
        self.test_wedding_music_playlist()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary and return result
        return self.print_summary()

def main():
    """Main test runner"""
    tester = MusicAPITester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n🎉 ALL MUSIC API TESTS COMPLETED SUCCESSFULLY")
        print(f"✅ The JWT token 'user_id' fix is working correctly!")
        sys.exit(0)
    else:
        print(f"\n💥 MUSIC API TESTS FAILED")
        print(f"❌ There may still be issues with the JWT token fix.")
        sys.exit(1)

if __name__ == "__main__":
    main()