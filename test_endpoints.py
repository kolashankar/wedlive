#!/usr/bin/env python3
"""
WedLive API - Comprehensive Endpoint Test Suite
Tests all 180+ endpoints across the entire project
"""

import requests
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import sys
import uuid

# Configuration
BASE_URL = "http://localhost:8001"
TIMEOUT = 10

# Test data - use unique email for each run
UNIQUE_ID = str(uuid.uuid4())[:8]
TEST_USER = {
    "email": f"test_{UNIQUE_ID}@wedlive.com",
    "password": "TestPassword123!",
    "full_name": "Test User"
}

TEST_WEDDING = {
    "title": "Test Wedding",
    "description": "A beautiful test wedding",
    "bride_name": "Bride Test",
    "groom_name": "Groom Test",
    "scheduled_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    "location": "Test Location"
}

class APITester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.wedding_id = None
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")

    def test_endpoint(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                     expected_status: int = 200, auth: bool = True, name: str = "", 
                     skip_if_no_auth: bool = False) -> Dict[str, Any]:
        """Test a single endpoint"""
        # Skip if endpoint requires auth but we don't have token
        if auth and not self.token and skip_if_no_auth:
            self.log(f"⊘ SKIP | {method:6} {endpoint:60} | No auth token | {name}", "SKIP")
            return {}
        
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, timeout=TIMEOUT)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=TIMEOUT)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            status_text = "✓ PASS" if success else "✗ FAIL"
            
            self.log(f"{status_text} | {method:6} {endpoint:60} | Status: {response.status_code} | {name}", 
                    "PASS" if success else "FAIL")
            
            if success:
                self.test_results["passed"] += 1
            else:
                self.test_results["failed"] += 1
                self.test_results["errors"].append({
                    "endpoint": endpoint,
                    "method": method,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
            
            return response.json() if response.text else {}
        except Exception as e:
            self.log(f"✗ ERROR | {method:6} {endpoint:60} | {str(e)}", "ERROR")
            self.test_results["failed"] += 1
            self.test_results["errors"].append({
                "endpoint": endpoint,
                "method": method,
                "error": str(e)
            })
            return {}

    def run_all_tests(self):
        """Run all endpoint tests"""
        self.log("=" * 100)
        self.log("WedLive API - Comprehensive Endpoint Test Suite")
        self.log("=" * 100)
        
        # Health Check
        self.test_health_endpoints()
        
        # Authentication
        self.test_auth_endpoints()
        
        # Weddings
        self.test_wedding_endpoints()
        
        # Streams
        self.test_stream_endpoints()
        
        # Media
        self.test_media_endpoints()
        
        # Chat & Reactions
        self.test_chat_endpoints()
        
        # Comments
        self.test_comment_endpoints()
        
        # Analytics
        self.test_analytics_endpoints()
        
        # Features
        self.test_features_endpoints()
        
        # Premium
        self.test_premium_endpoints()
        
        # Phase 10
        self.test_phase10_endpoints()
        
        # Admin
        self.test_admin_endpoints()
        
        # Subscriptions
        self.test_subscription_endpoints()
        
        # Profile
        self.test_profile_endpoints()
        
        # Security
        self.test_security_endpoints()
        
        # Settings
        self.test_settings_endpoints()
        
        # Quality Control
        self.test_quality_endpoints()
        
        # Recording
        self.test_recording_endpoints()
        
        # Folders
        self.test_folder_endpoints()
        
        # Plan Management
        self.test_plan_management_endpoints()
        
        # Storage Management
        self.test_storage_management_endpoints()
        
        # Viewer Access
        self.test_viewer_access_endpoints()
        
        # Plan Info
        self.test_plan_info_endpoints()
        
        # Theme Assets
        self.test_theme_assets_endpoints()
        
        # Themes
        self.test_themes_endpoints()
        
        # Templates
        self.test_templates_endpoints()
        
        # RTMP Webhooks
        self.test_rtmp_webhooks_endpoints()
        
        # Live Controls
        self.test_live_controls_endpoints()
        
        # Media Proxy
        self.test_media_proxy_endpoints()
        
        # Print Summary
        self.print_summary()

    def test_health_endpoints(self):
        """Test health check endpoints"""
        self.log("\n--- Health Check Endpoints ---")
        self.test_endpoint("GET", "/", expected_status=200, auth=False, name="Root health check")
        self.test_endpoint("GET", "/api/health", expected_status=200, auth=False, name="Health check")

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        self.log("\n--- Authentication Endpoints ---")
        
        # Register
        response = self.test_endpoint("POST", "/api/auth/register", 
                                     data=TEST_USER, expected_status=201, auth=False, 
                                     name="Register user")
        if response and "access_token" in response:
            self.token = response["access_token"]
            if "user" in response:
                self.user_id = response["user"].get("id")
            self.log(f"✓ Authentication successful - Token acquired", "INFO")
        else:
            # If registration failed, try login
            self.log("Registration failed or returned unexpected response, attempting login...", "INFO")
            response = self.test_endpoint("POST", "/api/auth/login",
                                         data={"email": TEST_USER["email"], "password": TEST_USER["password"]},
                                         expected_status=200, auth=False, name="Login user")
            if response and "access_token" in response:
                self.token = response["access_token"]
                if "user" in response:
                    self.user_id = response["user"].get("id")
                self.log(f"✓ Login successful - Token acquired", "INFO")
        
        # Get current user
        if self.token:
            self.test_endpoint("GET", "/api/auth/me", expected_status=200, auth=True, name="Get current user")

    def test_wedding_endpoints(self):
        """Test wedding management endpoints"""
        self.log("\n--- Wedding Management Endpoints ---")
        
        # Create wedding
        response = self.test_endpoint("POST", "/api/weddings/",
                                     data=TEST_WEDDING, expected_status=201, auth=True,
                                     skip_if_no_auth=True, name="Create wedding")
        if response and "id" in response:
            self.wedding_id = response["id"]
        
        # List weddings
        self.test_endpoint("GET", "/api/weddings/", expected_status=200, auth=False, name="List weddings")
        
        if self.wedding_id:
            # Get wedding details
            self.test_endpoint("GET", f"/api/weddings/{self.wedding_id}", expected_status=200, auth=False,
                             name="Get wedding details")
            
            # Update wedding
            self.test_endpoint("PUT", f"/api/weddings/{self.wedding_id}",
                             data={"title": "Updated Wedding"}, expected_status=200, auth=True,
                             skip_if_no_auth=True, name="Update wedding")
            
            # Get wedding settings
            self.test_endpoint("GET", f"/api/weddings/{self.wedding_id}/settings", 
                             expected_status=200, auth=False, name="Get wedding settings")
            
            # Update wedding settings
            self.test_endpoint("PUT", f"/api/weddings/{self.wedding_id}/settings",
                             data={"allow_comments": True}, expected_status=200, auth=True,
                             skip_if_no_auth=True, name="Update wedding settings")
            
            # Get theme settings
            self.test_endpoint("GET", f"/api/weddings/{self.wedding_id}/theme", 
                             expected_status=200, auth=False, name="Get theme settings")
            
            # Update theme settings
            self.test_endpoint("PUT", f"/api/weddings/{self.wedding_id}/theme",
                             data={"theme_name": "modern"}, expected_status=200, auth=True,
                             skip_if_no_auth=True, name="Update theme settings")
            
            # Get RTMP credentials
            self.test_endpoint("GET", f"/api/weddings/{self.wedding_id}/main-camera/rtmp",
                             expected_status=200, auth=False, name="Get main camera RTMP")

    def test_stream_endpoints(self):
        """Test stream management endpoints"""
        self.log("\n--- Stream Management Endpoints ---")
        
        # Get live streams
        self.test_endpoint("GET", "/api/streams/live", expected_status=200, auth=False, name="Get live streams")
        
        if self.wedding_id:
            # Start stream
            self.test_endpoint("POST", "/api/streams/start",
                             data={"wedding_id": self.wedding_id}, expected_status=200, auth=True,
                             name="Start stream")
            
            # Get stream quality options
            self.test_endpoint("GET", f"/api/streams/quality/{self.wedding_id}",
                             expected_status=200, auth=True, skip_if_no_auth=True, name="Get stream quality options")
            
            # Update stream quality
            self.test_endpoint("POST", f"/api/streams/quality/{self.wedding_id}",
                             data={"live_quality": "720p"}, expected_status=200, auth=True,
                             skip_if_no_auth=True, name="Update stream quality")

    def test_media_endpoints(self):
        """Test media management endpoints"""
        self.log("\n--- Media Management Endpoints ---")
        
        if self.wedding_id:
            # Initialize chunked upload
            self.test_endpoint("POST", "/api/media/upload/init",
                             data={
                                 "wedding_id": self.wedding_id,
                                 "filename": "test.jpg",
                                 "total_size": 1000000,
                                 "total_chunks": 1,
                                 "media_type": "photo"
                             }, expected_status=200, auth=True, name="Initialize upload")
            
            # Get wedding media
            self.test_endpoint("GET", f"/api/media/wedding/{self.wedding_id}",
                             expected_status=200, auth=True, name="Get wedding media")
            
            # Get media gallery
            self.test_endpoint("GET", f"/api/media/gallery/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get media gallery")

    def test_chat_endpoints(self):
        """Test chat and reactions endpoints"""
        self.log("\n--- Chat & Reactions Endpoints ---")
        
        if self.wedding_id:
            # Send chat message
            self.test_endpoint("POST", "/api/chat/messages",
                             data={"wedding_id": self.wedding_id, "message": "Hello!", "guest_name": "Guest"},
                             expected_status=200, auth=False, name="Send chat message")
            
            # Get chat messages
            self.test_endpoint("GET", f"/api/chat/messages/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get chat messages")
            
            # Send reaction
            self.test_endpoint("POST", "/api/chat/reactions",
                             data={"wedding_id": self.wedding_id, "emoji": "❤️", "guest_name": "Guest"},
                             expected_status=200, auth=False, name="Send reaction")
            
            # Get reactions
            self.test_endpoint("GET", f"/api/chat/reactions/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get reactions")
            
            # Create guest book entry
            self.test_endpoint("POST", "/api/chat/guestbook",
                             data={"wedding_id": self.wedding_id, "guest_name": "Guest", 
                                   "email": "guest@test.com", "message": "Congratulations!"},
                             expected_status=200, auth=False, name="Create guest book entry")
            
            # Get guest book
            self.test_endpoint("GET", f"/api/chat/guestbook/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get guest book")

    def test_comment_endpoints(self):
        """Test comment endpoints"""
        self.log("\n--- Comment Endpoints ---")
        
        if self.wedding_id:
            # Create comment
            response = self.test_endpoint("POST", "/api/comments/",
                                        data={"wedding_id": self.wedding_id, "comment": "Nice wedding!"},
                                        expected_status=200, auth=True, name="Create comment")
            comment_id = response.get("id") if response else None
            
            # Get comments
            self.test_endpoint("GET", f"/api/comments/?weddingId={self.wedding_id}",
                             expected_status=200, auth=False, name="Get comments")
            
            if comment_id:
                # Like comment
                self.test_endpoint("POST", f"/api/comments/{comment_id}/like",
                                 expected_status=200, auth=True, name="Like comment")
                
                # Update comment
                self.test_endpoint("PUT", f"/api/comments/{comment_id}",
                                 data={"comment": "Updated comment"}, expected_status=200, auth=True,
                                 name="Update comment")
                
                # Delete comment
                self.test_endpoint("DELETE", f"/api/comments/{comment_id}",
                                 expected_status=200, auth=True, name="Delete comment")

    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        self.log("\n--- Analytics Endpoints ---")
        
        if self.wedding_id:
            # Create viewer session
            self.test_endpoint("POST", "/api/analytics/sessions",
                             data={"wedding_id": self.wedding_id, "session_id": "test_session",
                                   "timezone": "UTC", "user_agent": "test"},
                             expected_status=200, auth=False, name="Create viewer session")
            
            # Get wedding sessions
            self.test_endpoint("GET", f"/api/analytics/sessions/{self.wedding_id}",
                             expected_status=200, auth=True, name="Get wedding sessions")
            
            # Record stream quality
            self.test_endpoint("POST", "/api/analytics/quality",
                             data={"wedding_id": self.wedding_id, "session_id": "test_session",
                                   "timestamp": datetime.now(timezone.utc).isoformat(),
                                   "bitrate": 2500, "resolution": "720p", "fps": 30,
                                   "buffering_events": 0, "buffering_duration_ms": 0},
                             expected_status=200, auth=False, name="Record stream quality")
            
            # Get stream quality stats
            self.test_endpoint("GET", f"/api/analytics/quality/{self.wedding_id}",
                             expected_status=200, auth=True, name="Get stream quality stats")
            
            # Get engagement metrics
            self.test_endpoint("GET", f"/api/analytics/engagement/{self.wedding_id}",
                             expected_status=200, auth=True, name="Get engagement metrics")
            
            # Get analytics dashboard
            self.test_endpoint("GET", f"/api/analytics/dashboard/{self.wedding_id}",
                             expected_status=200, auth=True, name="Get analytics dashboard")

    def test_features_endpoints(self):
        """Test advanced features endpoints"""
        self.log("\n--- Advanced Features Endpoints ---")
        
        if self.wedding_id:
            # Send email invitations
            self.test_endpoint("POST", "/api/features/invitations",
                             data={"wedding_id": self.wedding_id, "recipient_emails": ["guest@test.com"],
                                   "custom_message": "Join us!"},
                             expected_status=200, auth=True, name="Send email invitations")
            
            # Get email invitations
            self.test_endpoint("GET", f"/api/features/invitations/{self.wedding_id}",
                             expected_status=200, auth=True, name="Get email invitations")
            
            # Create camera stream
            self.test_endpoint("POST", "/api/features/cameras",
                             data={"wedding_id": self.wedding_id, "camera_name": "Camera 2",
                                   "camera_angle": "side"},
                             expected_status=200, auth=True, name="Create camera stream")
            
            # Get camera streams
            self.test_endpoint("GET", f"/api/features/cameras/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get camera streams")
            
            # Create photo booth photo
            self.test_endpoint("POST", "/api/features/photobooth",
                             data={"wedding_id": self.wedding_id, "photo_data": "data:image/jpeg;base64,...",
                                   "filter_used": "none", "guest_name": "Guest"},
                             expected_status=200, auth=False, name="Create photo booth photo")
            
            # Get photo booth photos
            self.test_endpoint("GET", f"/api/features/photobooth/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get photo booth photos")
            
            # Get iCal file
            self.test_endpoint("GET", f"/api/features/calendar/{self.wedding_id}/ical",
                             expected_status=200, auth=False, name="Get iCal file")

    def test_premium_endpoints(self):
        """Test premium features endpoints"""
        self.log("\n--- Premium Features Endpoints ---")
        
        # Get branding
        self.test_endpoint("GET", "/api/premium/branding", expected_status=200, auth=True,
                         name="Get branding")
        
        # Update branding
        self.test_endpoint("PUT", "/api/premium/branding",
                         data={"brand_name": "My Brand", "primary_color": "#FF0000"},
                         expected_status=200, auth=True, name="Update branding")
        
        # List API keys
        self.test_endpoint("GET", "/api/premium/api-keys", expected_status=200, auth=True,
                         name="List API keys")
        
        # Create API key
        self.test_endpoint("POST", "/api/premium/api-keys",
                         data={"name": "Test Key"}, expected_status=200, auth=True,
                         name="Create API key")

    def test_phase10_endpoints(self):
        """Test Phase 10 endpoints"""
        self.log("\n--- Phase 10 Endpoints ---")
        
        # Get branding
        self.test_endpoint("GET", "/api/phase10/branding", expected_status=200, auth=True,
                         name="Get Phase 10 branding")
        
        # Create/Update branding
        self.test_endpoint("POST", "/api/phase10/branding",
                         data={"primary_color": "#FF0000"}, expected_status=200, auth=True,
                         name="Create/Update Phase 10 branding")
        
        # Get user branding
        if self.user_id:
            self.test_endpoint("GET", f"/api/phase10/branding/user/{self.user_id}",
                             expected_status=200, auth=False, name="Get user branding")
        
        # Create API key
        self.test_endpoint("POST", "/api/phase10/api-keys",
                         data={"name": "Test API Key", "description": "For testing"},
                         expected_status=200, auth=True, name="Create Phase 10 API key")
        
        # List API keys
        self.test_endpoint("GET", "/api/phase10/api-keys", expected_status=200, auth=True,
                         name="List Phase 10 API keys")
        
        # Create webhook
        self.test_endpoint("POST", "/api/phase10/webhooks",
                         data={"url": "https://example.com/webhook", "events": ["wedding.created"],
                               "description": "Test webhook"},
                         expected_status=200, auth=True, name="Create webhook")
        
        # List webhooks
        self.test_endpoint("GET", "/api/phase10/webhooks", expected_status=200, auth=True,
                         name="List webhooks")
        
        # Get recording quality options
        self.test_endpoint("GET", "/api/phase10/recording-quality/options",
                         expected_status=200, auth=True, name="Get recording quality options")
        
        if self.wedding_id:
            # Set recording quality
            self.test_endpoint("POST", "/api/phase10/recording-quality/settings",
                             data={"wedding_id": self.wedding_id, "quality": "1080p"},
                             expected_status=200, auth=True, name="Set recording quality")

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        self.log("\n--- Admin Endpoints ---")
        
        # Get admin stats
        self.test_endpoint("GET", "/api/admin/stats", expected_status=200, auth=True,
                         name="Get admin stats")
        
        # List all users
        self.test_endpoint("GET", "/api/admin/users", expected_status=200, auth=True,
                         name="List all users")
        
        # List all weddings
        self.test_endpoint("GET", "/api/admin/weddings", expected_status=200, auth=True,
                         name="List all weddings")
        
        # Get revenue stats
        self.test_endpoint("GET", "/api/admin/revenue", expected_status=200, auth=True,
                         name="Get revenue stats")
        
        # Get analytics
        self.test_endpoint("GET", "/api/admin/analytics", expected_status=200, auth=True,
                         name="Get admin analytics")

    def test_subscription_endpoints(self):
        """Test subscription endpoints"""
        self.log("\n--- Subscription Endpoints ---")
        
        # Create checkout session
        self.test_endpoint("POST", "/api/subscriptions/create-checkout-session",
                         data={"plan": "monthly"}, expected_status=200, auth=True,
                         name="Create checkout session")
        
        # Verify payment
        self.test_endpoint("POST", "/api/subscriptions/verify-payment",
                         data={"razorpay_payment_id": "test", "razorpay_subscription_id": "test",
                               "razorpay_signature": "test", "plan": "monthly"},
                         expected_status=400, auth=True, name="Verify payment")

    def test_profile_endpoints(self):
        """Test profile endpoints"""
        self.log("\n--- Profile Endpoints ---")
        
        # Get profile
        self.test_endpoint("GET", "/api/profile/me", expected_status=200, auth=True,
                         name="Get profile")
        
        # Update profile
        self.test_endpoint("PUT", "/api/profile/update",
                         data={"full_name": "Updated Name"}, expected_status=200, auth=True,
                         name="Update profile")
        
        # Get studios
        self.test_endpoint("GET", "/api/profile/studios", expected_status=200, auth=True,
                         name="Get studios")
        
        # Create studio
        self.test_endpoint("POST", "/api/profile/studios",
                         data={"name": "Test Studio", "email": "studio@test.com"},
                         expected_status=200, auth=True, name="Create studio")

    def test_security_endpoints(self):
        """Test security endpoints"""
        self.log("\n--- Security Endpoints ---")
        
        # Change password
        self.test_endpoint("POST", "/api/security/change-password",
                         data={"current_password": TEST_USER["password"],
                               "new_password": "NewPassword123!"},
                         expected_status=200, auth=True, name="Change password")
        
        # Get active sessions
        self.test_endpoint("GET", "/api/security/sessions", expected_status=200, auth=True,
                         name="Get active sessions")
        
        # Enable 2FA
        self.test_endpoint("POST", "/api/security/2fa/enable", expected_status=200, auth=True,
                         name="Enable 2FA")
        
        # Disable 2FA
        self.test_endpoint("POST", "/api/security/2fa/disable", expected_status=200, auth=True,
                         name="Disable 2FA")

    def test_settings_endpoints(self):
        """Test settings endpoints"""
        self.log("\n--- Settings Endpoints ---")
        
        # Change password
        self.test_endpoint("PUT", "/api/settings/password",
                         data={"current_password": "NewPassword123!", "new_password": TEST_USER["password"],
                               "confirm_password": TEST_USER["password"]},
                         expected_status=200, auth=True, name="Change password (settings)")
        
        # Get preferences
        self.test_endpoint("GET", "/api/settings/preferences", expected_status=200, auth=True,
                         name="Get preferences")
        
        # Update preferences
        self.test_endpoint("PUT", "/api/settings/preferences",
                         data={"timezone": "UTC", "email_stream_alerts": True},
                         expected_status=200, auth=True, name="Update preferences")
        
        # Get active sessions
        self.test_endpoint("GET", "/api/settings/sessions", expected_status=200, auth=True,
                         name="Get active sessions (settings)")

    def test_quality_endpoints(self):
        """Test quality control endpoints"""
        self.log("\n--- Quality Control Endpoints ---")
        
        if self.wedding_id:
            # Get quality options
            self.test_endpoint("GET", f"/api/quality/options/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get quality options")
            
            # Set quality options
            self.test_endpoint("POST", f"/api/quality/set-options/{self.wedding_id}",
                             data={"available_qualities": [{"label": "720p", "value": "720p"}],
                                   "default_quality": "720p"},
                             expected_status=200, auth=True, name="Set quality options")
            
            # Change quality
            self.test_endpoint("POST", "/api/quality/change",
                             data={"wedding_id": self.wedding_id, "quality": "720p"},
                             expected_status=200, auth=False, name="Change quality")

    def test_recording_endpoints(self):
        """Test recording endpoints"""
        self.log("\n--- Recording Endpoints ---")
        
        if self.wedding_id:
            # Start recording
            self.test_endpoint("POST", "/api/recording/start",
                             data={"wedding_id": self.wedding_id, "quality": "1080p"},
                             expected_status=200, auth=True, name="Start recording")
            
            # Get wedding recordings
            self.test_endpoint("GET", f"/api/recording/wedding/{self.wedding_id}",
                             expected_status=200, auth=True, name="Get wedding recordings")

    def test_folder_endpoints(self):
        """Test folder management endpoints"""
        self.log("\n--- Folder Management Endpoints ---")
        
        if self.wedding_id:
            # Create folder
            response = self.test_endpoint("POST", "/api/folders/create",
                                        data={"wedding_id": self.wedding_id, "name": "Test Folder"},
                                        expected_status=200, auth=True, name="Create folder")
            folder_id = response.get("id") if response else None
            
            # Get wedding folders
            self.test_endpoint("GET", f"/api/folders/wedding/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get wedding folders")
            
            if folder_id:
                # Get folder details
                self.test_endpoint("GET", f"/api/folders/{folder_id}",
                                 expected_status=200, auth=True, name="Get folder details")
                
                # Update folder
                self.test_endpoint("PUT", f"/api/folders/{folder_id}",
                                 data={"name": "Updated Folder"}, expected_status=200, auth=True,
                                 name="Update folder")
                
                # Get folder media
                self.test_endpoint("GET", f"/api/folders/{folder_id}/media",
                                 expected_status=200, auth=False, name="Get folder media")
                
                # Delete folder
                self.test_endpoint("DELETE", f"/api/folders/{folder_id}",
                                 expected_status=200, auth=True, name="Delete folder")

    def test_plan_management_endpoints(self):
        """Test plan management endpoints"""
        self.log("\n--- Plan Management Endpoints ---")
        
        # Get storage stats
        self.test_endpoint("GET", "/api/plan/storage/stats", expected_status=200, auth=True,
                         name="Get storage stats")
        
        # Recalculate storage
        self.test_endpoint("POST", "/api/plan/storage/recalculate", expected_status=200, auth=True,
                         name="Recalculate storage")
        
        # Get plan info
        self.test_endpoint("GET", "/api/plan/info", expected_status=200, auth=True,
                         name="Get plan info")
        
        # Get plan comparison
        self.test_endpoint("GET", "/api/plan/comparison", expected_status=200, auth=False,
                         name="Get plan comparison")
        
        # Check feature access
        self.test_endpoint("GET", "/api/plan/features/media_upload", expected_status=200, auth=True,
                         name="Check feature access")
        
        # Get available resolutions
        self.test_endpoint("GET", "/api/plan/resolutions", expected_status=200, auth=True,
                         name="Get available resolutions")

    def test_storage_management_endpoints(self):
        """Test storage management endpoints"""
        self.log("\n--- Storage Management Endpoints ---")
        
        # Get storage stats
        self.test_endpoint("GET", "/api/storage/stats", expected_status=200, auth=True,
                         name="Get storage stats (storage)")
        
        # Recalculate storage
        self.test_endpoint("POST", "/api/storage/recalculate", expected_status=200, auth=True,
                         name="Recalculate storage (storage)")
        
        # Get storage addons
        self.test_endpoint("GET", "/api/storage/addons", expected_status=200, auth=True,
                         name="Get storage addons")
        
        if self.wedding_id:
            # Get wedding storage breakdown
            self.test_endpoint("GET", f"/api/storage/breakdown/{self.wedding_id}",
                             expected_status=200, auth=True, name="Get wedding storage breakdown")

    def test_viewer_access_endpoints(self):
        """Test viewer access endpoints"""
        self.log("\n--- Viewer Access Endpoints ---")
        
        # Join wedding by code
        self.test_endpoint("POST", "/api/viewer/join",
                         data={"wedding_code": "000000"}, expected_status=404, auth=False,
                         name="Join wedding by code")
        
        if self.wedding_id:
            # Get wedding media
            self.test_endpoint("GET", f"/api/viewer/wedding/{self.wedding_id}/media",
                             expected_status=200, auth=False, name="Get wedding media (viewer)")
            
            # Get wedding complete view
            self.test_endpoint("GET", f"/api/viewer/wedding/{self.wedding_id}/all",
                             expected_status=200, auth=False, name="Get wedding complete view")

    def test_plan_info_endpoints(self):
        """Test plan information endpoints"""
        self.log("\n--- Plan Information Endpoints ---")
        
        # Get all plans
        self.test_endpoint("GET", "/api/plans/all", expected_status=200, auth=False,
                         name="Get all plans")
        
        # Get plan details
        self.test_endpoint("GET", "/api/plans/free", expected_status=200, auth=False,
                         name="Get free plan details")

    def test_theme_assets_endpoints(self):
        """Test theme assets endpoints"""
        self.log("\n--- Theme Assets Endpoints ---")
        
        # Get photo borders
        self.test_endpoint("GET", "/api/theme-assets/borders", expected_status=200, auth=False,
                         name="Get photo borders")
        
        # Get background images
        self.test_endpoint("GET", "/api/theme-assets/backgrounds", expected_status=200, auth=False,
                         name="Get background images")
        
        # Get precious moment styles
        self.test_endpoint("GET", "/api/theme-assets/precious-moment-styles", expected_status=200, auth=False,
                         name="Get precious moment styles")

    def test_themes_endpoints(self):
        """Test themes endpoints"""
        self.log("\n--- Themes Endpoints ---")
        
        # Get available themes
        self.test_endpoint("GET", "/api/themes", expected_status=200, auth=False,
                         name="Get available themes")
        
        # Get theme details
        self.test_endpoint("GET", "/api/themes/modern", expected_status=200, auth=False,
                         name="Get theme details")

    def test_templates_endpoints(self):
        """Test templates endpoints"""
        self.log("\n--- Templates Endpoints ---")
        
        # Get templates
        self.test_endpoint("GET", "/api/templates", expected_status=200, auth=False,
                         name="Get templates")
        
        # Get template details
        self.test_endpoint("GET", "/api/templates/default", expected_status=200, auth=False,
                         name="Get template details")

    def test_rtmp_webhooks_endpoints(self):
        """Test RTMP webhooks endpoints"""
        self.log("\n--- RTMP Webhooks Endpoints ---")
        
        # Handle stream start
        self.test_endpoint("POST", "/api/webhooks/stream-started",
                         data={"wedding_id": "test", "status": "live"}, expected_status=200, auth=False,
                         name="Handle stream start")
        
        # Handle stream end
        self.test_endpoint("POST", "/api/webhooks/stream-ended",
                         data={"wedding_id": "test", "status": "ended"}, expected_status=200, auth=False,
                         name="Handle stream end")

    def test_live_controls_endpoints(self):
        """Test live controls endpoints"""
        self.log("\n--- Live Controls Endpoints ---")
        
        if self.wedding_id:
            # Get live controls
            self.test_endpoint("GET", f"/api/live-controls/{self.wedding_id}",
                             expected_status=200, auth=False, name="Get live controls")
            
            # Update live controls
            self.test_endpoint("PUT", f"/api/live-controls/{self.wedding_id}",
                             data={"chat_enabled": True}, expected_status=200, auth=True,
                             name="Update live controls")

    def test_media_proxy_endpoints(self):
        """Test media proxy endpoints"""
        self.log("\n--- Media Proxy Endpoints ---")
        
        # Proxy media
        self.test_endpoint("GET", "/api/media/proxy?url=https://example.com/image.jpg",
                         expected_status=200, auth=False, name="Proxy media")

    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "=" * 100)
        self.log("TEST SUMMARY")
        self.log("=" * 100)
        self.log(f"Total Tests: {self.test_results['passed'] + self.test_results['failed']}")
        self.log(f"Passed: {self.test_results['passed']} ✓")
        self.log(f"Failed: {self.test_results['failed']} ✗")
        
        if self.test_results['errors']:
            self.log("\nFailed Endpoints:")
            for error in self.test_results['errors'][:10]:  # Show first 10 errors
                self.log(f"  - {error.get('method', 'N/A')} {error.get('endpoint', 'N/A')}: {error.get('error', error.get('response', 'Unknown error'))}")
        
        self.log("=" * 100)
        
        # Exit with appropriate code
        sys.exit(0 if self.test_results['failed'] == 0 else 1)


def main():
    """Main entry point"""
    tester = APITester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
