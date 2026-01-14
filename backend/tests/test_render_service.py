#!/usr/bin/env python3
"""
Test Suite for Video Render Service
Phase 7: Backend Testing
"""
import pytest
import os
import tempfile
from pathlib import Path


class TestVideoRenderService:
    """Test suite for Video Render Service"""
    
    def test_render_service_initialization(self):
        """Test render service initialization"""
        from app.services.render_service import VideoRenderService
        
        service = VideoRenderService()
        assert service is not None
        assert hasattr(service, 'create_render_job')
        assert hasattr(service, 'get_render_job')
        assert hasattr(service, 'get_job_status')
        
        print("✅ Test Passed: Render service initialized correctly")
    
    def test_create_render_job(self):
        """Test creating a render job"""
        from app.services.render_service import VideoRenderService
        
        service = VideoRenderService()
        job = service.create_render_job(
            wedding_id="test-wedding-123",
            template_id="test-template-456",
            quality="hd"
        )
        
        assert job is not None
        assert job.job_id is not None
        assert job.wedding_id == "test-wedding-123"
        assert job.template_id == "test-template-456"
        assert job.status == "queued"
        assert job.progress == 0
        
        print(f"✅ Test Passed: Render job created with ID {job.job_id}")
    
    def test_get_render_job(self):
        """Test retrieving a render job"""
        from app.services.render_service import VideoRenderService
        
        service = VideoRenderService()
        
        # Create a job
        job = service.create_render_job(
            wedding_id="test-wedding-123",
            template_id="test-template-456",
            quality="hd"
        )
        
        # Retrieve the job
        retrieved_job = service.get_render_job(job.job_id)
        
        assert retrieved_job is not None
        assert retrieved_job.job_id == job.job_id
        assert retrieved_job.wedding_id == job.wedding_id
        
        print("✅ Test Passed: Render job retrieved successfully")
    
    def test_get_job_status(self):
        """Test getting job status"""
        from app.services.render_service import VideoRenderService
        
        service = VideoRenderService()
        
        # Create a job
        job = service.create_render_job(
            wedding_id="test-wedding-123",
            template_id="test-template-456",
            quality="hd"
        )
        
        # Get status
        status = service.get_job_status(job.job_id)
        
        assert status is not None
        assert status["job_id"] == job.job_id
        assert status["status"] == "queued"
        assert "progress" in status
        
        print("✅ Test Passed: Job status retrieved successfully")
    
    def test_invalid_job_id(self):
        """Test retrieving non-existent job"""
        from app.services.render_service import VideoRenderService
        
        service = VideoRenderService()
        
        # Try to get non-existent job
        job = service.get_render_job("invalid-job-id-12345")
        
        assert job is None
        
        print("✅ Test Passed: Invalid job ID handled correctly")


class TestFFmpegIntegration:
    """Test FFmpeg integration"""
    
    def test_ffmpeg_installed(self):
        """Test if FFmpeg is installed"""
        import subprocess
        
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            assert result.returncode == 0
            assert 'ffmpeg version' in result.stdout.lower()
            print("✅ Test Passed: FFmpeg is installed and accessible")
        except Exception as e:
            print(f"❌ Test Failed: FFmpeg not found - {str(e)}")
            pytest.fail("FFmpeg is required but not installed")
    
    def test_ffprobe_installed(self):
        """Test if FFprobe is installed"""
        import subprocess
        
        try:
            result = subprocess.run(
                ['ffprobe', '-version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            assert result.returncode == 0
            assert 'ffprobe version' in result.stdout.lower()
            print("✅ Test Passed: FFprobe is installed and accessible")
        except Exception as e:
            print(f"❌ Test Failed: FFprobe not found - {str(e)}")
            pytest.fail("FFprobe is required but not installed")


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("VIDEO RENDER SERVICE - TEST SUITE")
    print("Phase 7: Backend Testing")
    print("=" * 70 + "\n")
    
    pytest.main([__file__, "-v", "-s"])
