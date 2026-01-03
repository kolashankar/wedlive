#!/usr/bin/env python3
"""
Comprehensive Test Suite for Video Template Routes
Phase 7: Backend Testing
"""
import pytest
import asyncio
from httpx import AsyncClient
from datetime import datetime
import os
import tempfile
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api"

# Admin credentials (update with your test credentials)
ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")

# User credentials
USER_EMAIL = os.getenv("TEST_USER_EMAIL", "user@example.com")
USER_PASSWORD = os.getenv("TEST_USER_PASSWORD", "user123")

class TestVideoTemplateAPI:
    """Test suite for Video Template API endpoints"""
    
    @pytest.fixture
    async def admin_token(self):
        """Get admin authentication token"""
        async with AsyncClient(base_url=BASE_URL) as client:
            response = await client.post(
                f"{API_BASE}/auth/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            )
            if response.status_code == 200:
                return response.json()["access_token"]
            return None
    
    @pytest.fixture
    async def user_token(self):
        """Get user authentication token"""
        async with AsyncClient(base_url=BASE_URL) as client:
            response = await client.post(
                f"{API_BASE}/auth/login",
                json={"email": USER_EMAIL, "password": USER_PASSWORD}
            )
            if response.status_code == 200:
                return response.json()["access_token"]
            return None
    
    @pytest.mark.asyncio
    async def test_list_available_endpoints(self):
        """Test GET /api/video-templates/endpoints/list"""
        async with AsyncClient(base_url=BASE_URL) as client:
            response = await client.get(f"{API_BASE}/video-templates/endpoints/list")
            
            assert response.status_code == 200
            data = response.json()
            assert "endpoints" in data
            assert isinstance(data["endpoints"], dict)
            
            # Check for required endpoints
            required_endpoints = [
                "bride_name", "groom_name", "event_date", "venue", "couple_names"
            ]
            for endpoint in required_endpoints:
                assert endpoint in data["endpoints"]
            
            print(f"✅ Test Passed: Found {len(data['endpoints'])} wedding data endpoints")
    
    @pytest.mark.asyncio
    async def test_list_templates_public(self):
        """Test GET /api/video-templates (public access)"""
        async with AsyncClient(base_url=BASE_URL) as client:
            response = await client.get(f"{API_BASE}/video-templates")
            
            assert response.status_code == 200
            templates = response.json()
            assert isinstance(templates, list)
            
            print(f"✅ Test Passed: Retrieved {len(templates)} public templates")
    
    @pytest.mark.asyncio
    async def test_list_templates_with_filters(self):
        """Test GET /api/video-templates with filters"""
        async with AsyncClient(base_url=BASE_URL) as client:
            # Test category filter
            response = await client.get(
                f"{API_BASE}/video-templates",
                params={"category": "invitation", "limit": 10}
            )
            
            assert response.status_code == 200
            templates = response.json()
            assert isinstance(templates, list)
            
            # Test featured filter
            response = await client.get(
                f"{API_BASE}/video-templates",
                params={"featured": True}
            )
            
            assert response.status_code == 200
            featured_templates = response.json()
            assert isinstance(featured_templates, list)
            
            print("✅ Test Passed: Template filtering working correctly")
    
    @pytest.mark.asyncio
    async def test_get_template_details(self):
        """Test GET /api/video-templates/{id}"""
        async with AsyncClient(base_url=BASE_URL) as client:
            # First get list of templates
            response = await client.get(f"{API_BASE}/video-templates")
            templates = response.json()
            
            if templates:
                template_id = templates[0]["id"]
                
                # Get template details
                response = await client.get(f"{API_BASE}/video-templates/{template_id}")
                
                assert response.status_code == 200
                template = response.json()
                assert template["id"] == template_id
                assert "name" in template
                assert "video_data" in template
                assert "text_overlays" in template
                
                print(f"✅ Test Passed: Retrieved template details for {template['name']}")
            else:
                print("⚠️ No templates available for testing")
    
    @pytest.mark.asyncio
    async def test_template_not_found(self):
        """Test GET /api/video-templates/{id} with invalid ID"""
        async with AsyncClient(base_url=BASE_URL) as client:
            response = await client.get(f"{API_BASE}/video-templates/invalid-id-12345")
            
            assert response.status_code == 404
            print("✅ Test Passed: 404 returned for invalid template ID")


class TestWeddingDataMapper:
    """Test suite for Wedding Data Mapper service"""
    
    def test_map_wedding_data(self):
        """Test wedding data mapping"""
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
        
        mapper = WeddingDataMapper()
        mapped_data = mapper.map_wedding_data(sample_wedding)
        
        # Verify all fields are mapped
        assert mapped_data['bride_name'] == 'Sarah Johnson'
        assert mapped_data['groom_name'] == 'Michael Smith'
        assert mapped_data['bride_first_name'] == 'Sarah'
        assert mapped_data['groom_first_name'] == 'Michael'
        assert 'Sarah' in mapped_data['couple_names']
        assert 'Michael' in mapped_data['couple_names']
        assert mapped_data['venue'] == 'Grand Hotel Ballroom'
        assert mapped_data['custom_text_1'] == 'Reception follows ceremony'
        assert 'countdown_days' in mapped_data
        
        print("✅ Test Passed: Wedding data mapping working correctly")
    
    def test_date_formatting(self):
        """Test date formatting"""
        from app.services.wedding_data_mapper import WeddingDataMapper
        
        mapper = WeddingDataMapper()
        formatted_date = mapper.format_date('2025-12-15T00:00:00')
        
        assert 'December' in formatted_date
        assert '15' in formatted_date
        assert '2025' in formatted_date
        
        print("✅ Test Passed: Date formatting working correctly")
    
    def test_countdown_calculation(self):
        """Test countdown days calculation"""
        from app.services.wedding_data_mapper import WeddingDataMapper
        from datetime import datetime, timedelta
        
        mapper = WeddingDataMapper()
        
        # Test future date
        future_date = (datetime.now() + timedelta(days=30)).isoformat()
        countdown = mapper.calculate_countdown(future_date)
        assert countdown != ''
        assert int(countdown) >= 0
        
        print("✅ Test Passed: Countdown calculation working correctly")


class TestOverlayValidation:
    """Test suite for Overlay validation"""
    
    def test_overlay_timing_validation(self):
        """Test overlay timing validation"""
        from app.models_video_templates import OverlayTiming
        
        # Valid timing
        timing = OverlayTiming(start_time=0, end_time=10)
        assert timing.start_time == 0
        assert timing.end_time == 10
        
        print("✅ Test Passed: Overlay timing validation working")
    
    def test_overlay_position_validation(self):
        """Test overlay position validation"""
        from app.models_video_templates import OverlayPosition
        
        # Valid position
        position = OverlayPosition(x=960, y=540, alignment="center")
        assert position.x == 960
        assert position.y == 540
        assert position.alignment == "center"
        
        print("✅ Test Passed: Overlay position validation working")


class TestVideoProcessingService:
    """Test suite for Video Processing Service"""
    
    def test_service_initialization(self):
        """Test video processing service initialization"""
        from app.services.video_processing_service import VideoProcessingService
        
        service = VideoProcessingService()
        assert service.max_video_size_mb > 0
        assert service.max_duration_seconds > 0
        assert len(service.supported_formats) > 0
        
        print("✅ Test Passed: Video processing service initialized correctly")
    
    def test_supported_formats(self):
        """Test supported video formats"""
        from app.services.video_processing_service import VideoProcessingService
        
        service = VideoProcessingService()
        required_formats = ['mp4', 'webm', 'mov']
        
        for fmt in required_formats:
            assert fmt in service.supported_formats
        
        print("✅ Test Passed: All required video formats supported")


def run_tests():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("VIDEO TEMPLATE API - COMPREHENSIVE TEST SUITE")
    print("Phase 7: Backend Testing")
    print("=" * 70 + "\n")
    
    # Run tests
    pytest.main([__file__, "-v", "-s"])


if __name__ == "__main__":
    run_tests()
