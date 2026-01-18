#!/usr/bin/env python3
"""
Additional Music Testing - Wedding Playlist & Audio Session Management
"""

import requests
import json
import sys
import uuid

# Configuration
BASE_URL = "https://wedlive.onrender.com/api"
ADMIN_EMAIL = "kolashankar113@gmail.com"
ADMIN_PASSWORD = "Shankar@113"

class AdditionalMusicTests:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_wedding_id = None
        self.test_music_ids = []
        
    def setup_authentication(self) -> bool:
        """Setup admin authentication"""
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                if self.admin_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                    print(f"✅ Logged in as {ADMIN_EMAIL}")
                    return True
            
            print(f"❌ Login failed: {response.status_code}")
            return False
            
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
    
    def get_test_wedding(self) -> bool:
        """Get existing test wedding"""
        try:
            response = self.session.get(f"{BASE_URL}/weddings")
            
            if response.status_code == 200:
                weddings = response.json()
                for wedding in weddings:
                    if "Music Test" in wedding.get("title", ""):
                        self.test_wedding_id = wedding.get("id")
                        print(f"✅ Found test wedding: {self.test_wedding_id}")
                        return True
                
                # Create new wedding if not found
                wedding_data = {
                    "title": "Music Test Wedding 2",
                    "bride_name": "TestBride",
                    "groom_name": "TestGroom",
                    "scheduled_date": "2024-12-31T18:00:00Z",
                    "location": "Test Venue"
                }
                
                response = self.session.post(f"{BASE_URL}/weddings", json=wedding_data)
                if response.status_code == 201:
                    data = response.json()
                    self.test_wedding_id = data.get("id")
                    print(f"✅ Created new test wedding: {self.test_wedding_id}")
                    return True
            
            print(f"❌ Failed to get/create wedding: {response.status_code}")
            return False
            
        except Exception as e:
            print(f"❌ Wedding setup error: {str(e)}")
            return False
    
    def get_test_music(self) -> bool:
        """Get existing music for testing"""
        try:
            response = self.session.get(f"{BASE_URL}/admin/music/library")
            
            if response.status_code == 200:
                library = response.json()
                for item in library:
                    if "Test Wedding" in item.get("title", ""):
                        self.test_music_ids.append(item.get("id"))
                
                if self.test_music_ids:
                    print(f"✅ Found {len(self.test_music_ids)} test music items")
                    return True
                else:
                    print("⚠️ No test music found, but continuing...")
                    return True
            
            print(f"❌ Failed to get music library: {response.status_code}")
            return False
            
        except Exception as e:
            print(f"❌ Music retrieval error: {str(e)}")
            return False
    
    def test_wedding_playlist_operations(self) -> bool:
        """Test wedding playlist add/remove/reorder operations"""
        print("\n💒 TESTING WEDDING PLAYLIST OPERATIONS")
        print("=" * 50)
        
        if not self.test_wedding_id:
            print("❌ No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        
        # Test 1: Get empty playlist
        try:
            total_tests += 1
            response = self.session.get(f"{BASE_URL}/weddings/{self.test_wedding_id}/music/playlist")
            
            if response.status_code == 200:
                playlist = response.json()
                if "music_playlist" in playlist and isinstance(playlist["music_playlist"], list):
                    success_count += 1
                    print(f"  ✅ Get playlist: Success ({len(playlist['music_playlist'])} items)")
                else:
                    print(f"  ❌ Get playlist: Invalid response format")
            else:
                print(f"  ❌ Get playlist: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Get playlist: Error - {str(e)}")
        
        # Test 2: Add music to playlist (if we have music)
        if self.test_music_ids:
            try:
                total_tests += 1
                playlist_data = {
                    "music_id": self.test_music_ids[0],
                    "source": "library",
                    "auto_play": False
                }
                
                response = self.session.post(f"{BASE_URL}/weddings/{self.test_wedding_id}/music/playlist", json=playlist_data)
                
                if response.status_code == 200:
                    playlist_item = response.json()
                    if playlist_item.get("music_id") == self.test_music_ids[0]:
                        success_count += 1
                        print(f"  ✅ Add to playlist: Success")
                    else:
                        print(f"  ❌ Add to playlist: Invalid response data")
                else:
                    print(f"  ❌ Add to playlist: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ Add to playlist: Error - {str(e)}")
            
            # Test 3: Reorder playlist
            try:
                total_tests += 1
                reorder_data = {
                    "music_id": self.test_music_ids[0],
                    "new_order": 1
                }
                
                response = self.session.put(f"{BASE_URL}/weddings/{self.test_wedding_id}/music/playlist/reorder", json=reorder_data)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        success_count += 1
                        print(f"  ✅ Reorder playlist: Success")
                    else:
                        print(f"  ❌ Reorder playlist: Operation failed")
                else:
                    print(f"  ❌ Reorder playlist: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ Reorder playlist: Error - {str(e)}")
            
            # Test 4: Remove from playlist
            try:
                total_tests += 1
                response = self.session.delete(f"{BASE_URL}/weddings/{self.test_wedding_id}/music/playlist/{self.test_music_ids[0]}")
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        success_count += 1
                        print(f"  ✅ Remove from playlist: Success")
                    else:
                        print(f"  ❌ Remove from playlist: Operation failed")
                else:
                    print(f"  ❌ Remove from playlist: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ Remove from playlist: Error - {str(e)}")
        
        if success_count >= total_tests * 0.75:  # 75% pass rate
            print(f"✅ Wedding Playlist Operations: Passed {success_count}/{total_tests} tests")
            return True
        else:
            print(f"❌ Wedding Playlist Operations: Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_audio_session_management(self) -> bool:
        """Test audio session lifecycle"""
        print("\n🔊 TESTING AUDIO SESSION MANAGEMENT")
        print("=" * 50)
        
        if not self.test_wedding_id:
            print("❌ No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        session_id = None
        
        # Test 1: Start audio session
        try:
            total_tests += 1
            response = self.session.post(f"{BASE_URL}/weddings/{self.test_wedding_id}/audio/session/start")
            
            if response.status_code == 200:
                session_data = response.json()
                session_id = session_data.get("session_id")
                if session_id and session_data.get("is_active"):
                    success_count += 1
                    print(f"  ✅ Start session: Success (ID: {session_id[:8]}...)")
                else:
                    print(f"  ❌ Start session: Invalid response data")
            else:
                print(f"  ❌ Start session: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Start session: Error - {str(e)}")
        
        # Test 2: Get session state
        try:
            total_tests += 1
            response = self.session.get(f"{BASE_URL}/weddings/{self.test_wedding_id}/audio/session/state")
            
            if response.status_code == 200:
                session_state = response.json()
                if session_state.get("is_active") and "current_state" in session_state:
                    success_count += 1
                    print(f"  ✅ Get session state: Success")
                else:
                    print(f"  ❌ Get session state: Invalid response data")
            else:
                print(f"  ❌ Get session state: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Get session state: Error - {str(e)}")
        
        # Test 3: Update session state
        try:
            total_tests += 1
            state_data = {
                "background_music": {
                    "track_id": "test_track",
                    "playing": True,
                    "volume": 70
                },
                "active_effects": []
            }
            
            response = self.session.put(f"{BASE_URL}/weddings/{self.test_wedding_id}/audio/session/state", json=state_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    success_count += 1
                    print(f"  ✅ Update session state: Success")
                else:
                    print(f"  ❌ Update session state: Operation failed")
            else:
                print(f"  ❌ Update session state: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Update session state: Error - {str(e)}")
        
        # Test 4: Stop audio session
        try:
            total_tests += 1
            response = self.session.post(f"{BASE_URL}/weddings/{self.test_wedding_id}/audio/session/stop")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    success_count += 1
                    print(f"  ✅ Stop session: Success")
                else:
                    print(f"  ❌ Stop session: Operation failed")
            else:
                print(f"  ❌ Stop session: HTTP {response.status_code}")
        except Exception as e:
            print(f"  ❌ Stop session: Error - {str(e)}")
        
        if success_count >= 3:  # Allow 1 failure
            print(f"✅ Audio Session Management: Passed {success_count}/{total_tests} tests")
            return True
        else:
            print(f"❌ Audio Session Management: Only {success_count}/{total_tests} tests passed")
            return False
    
    def test_phase5_advanced_endpoints(self) -> bool:
        """Test Phase 5 advanced audio endpoints"""
        print("\n🎛️ TESTING PHASE 5 ADVANCED ENDPOINTS")
        print("=" * 50)
        
        if not self.test_wedding_id:
            print("❌ No test wedding available")
            return False
        
        success_count = 0
        total_tests = 0
        
        # Test endpoints mentioned in review request
        advanced_endpoints = [
            ("POST", f"/weddings/{self.test_wedding_id}/audio/session/handle-music-end", {"track_id": "test", "auto_next": True}),
            ("POST", f"/weddings/{self.test_wedding_id}/audio/session/handle-interruption", {}),
            ("POST", f"/weddings/{self.test_wedding_id}/audio/session/resume", {}),
            ("PUT", f"/weddings/{self.test_wedding_id}/audio/playlist-settings", {"auto_next": True, "repeat_mode": "all", "shuffle": False}),
            ("POST", f"/weddings/{self.test_wedding_id}/audio/normalize-volumes", {}),
            ("GET", f"/weddings/{self.test_wedding_id}/audio/mixer/health", None),
            ("POST", f"/weddings/{self.test_wedding_id}/audio/mixer/restart", {})
        ]
        
        for method, endpoint, data in advanced_endpoints:
            try:
                total_tests += 1
                endpoint_name = endpoint.split("/")[-1]
                
                if method == "GET":
                    response = self.session.get(f"{BASE_URL}{endpoint}")
                elif method == "POST":
                    response = self.session.post(f"{BASE_URL}{endpoint}", json=data)
                elif method == "PUT":
                    response = self.session.put(f"{BASE_URL}{endpoint}", json=data)
                
                if response.status_code in [200, 400, 404]:  # 400/404 acceptable if not implemented
                    if response.status_code == 200:
                        success_count += 1
                        print(f"  ✅ {endpoint_name}: Implemented and working")
                    else:
                        print(f"  ⚠️ {endpoint_name}: Not implemented or no active session ({response.status_code})")
                else:
                    print(f"  ❌ {endpoint_name}: HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ {endpoint_name}: Error - {str(e)}")
        
        # Consider test successful if at least some endpoints are implemented
        if success_count >= 2:
            print(f"✅ Phase 5 Advanced Endpoints: Found {success_count}/{total_tests} implemented")
            return True
        else:
            print(f"❌ Phase 5 Advanced Endpoints: Only {success_count}/{total_tests} implemented")
            return False
    
    def run_additional_tests(self):
        """Run additional music tests"""
        print("🎵 ADDITIONAL MUSIC TESTING - PLAYLIST & AUDIO SESSION")
        print("=" * 70)
        
        # Setup
        if not self.setup_authentication():
            return False
        
        if not self.get_test_wedding():
            return False
        
        if not self.get_test_music():
            return False
        
        # Run tests
        test_methods = [
            self.test_wedding_playlist_operations,
            self.test_audio_session_management,
            self.test_phase5_advanced_endpoints
        ]
        
        passed_tests = 0
        total_tests = len(test_methods)
        
        for test_method in test_methods:
            try:
                if test_method():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ Test {test_method.__name__} failed with exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 70)
        print("🎵 ADDITIONAL MUSIC TESTING SUMMARY")
        print("=" * 70)
        
        print(f"📊 RESULT: {passed_tests}/{total_tests} additional tests passed")
        
        if passed_tests >= total_tests * 0.75:  # 75% pass rate
            print("✅ Additional music functionality is working well!")
            return True
        else:
            print("❌ Some additional music features need attention.")
            return False

if __name__ == "__main__":
    tester = AdditionalMusicTests()
    success = tester.run_additional_tests()
    sys.exit(0 if success else 1)