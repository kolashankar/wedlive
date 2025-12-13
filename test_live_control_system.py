"""
Comprehensive Testing for Advanced Live Control System
Phase 8 - Complete Flow Verification

This script tests all aspects of the live streaming control system:
- Status transitions (IDLE → WAITING → LIVE → PAUSED → ENDED)
- RTMP webhook handling
- Manual controls (Go Live, Pause, Resume, End Live)
- Recording management
- Authorization and security
- Viewer experience
"""

import requests
import time
import json
import sys
from typing import Dict, List, Tuple
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8001/api"
FRONTEND_URL = "http://localhost:3000"

# Test results storage
test_results = []
test_stats = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0
}

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class TestResult:
    def __init__(self, name: str, status: str, message: str = "", duration: float = 0):
        self.name = name
        self.status = status  # 'PASS', 'FAIL', 'SKIP'
        self.message = message
        self.duration = duration
        self.timestamp = datetime.now()


def log_test(name: str, status: str, message: str = "", duration: float = 0):
    """Log test result"""
    result = TestResult(name, status, message, duration)
    test_results.append(result)
    test_stats["total"] += 1
    
    if status == "PASS":
        test_stats["passed"] += 1
        print(f"{Colors.OKGREEN}✓{Colors.ENDC} {name} {Colors.OKGREEN}PASSED{Colors.ENDC} ({duration:.2f}s)")
    elif status == "FAIL":
        test_stats["failed"] += 1
        print(f"{Colors.FAIL}✗{Colors.ENDC} {name} {Colors.FAIL}FAILED{Colors.ENDC} - {message}")
    elif status == "SKIP":
        test_stats["skipped"] += 1
        print(f"{Colors.WARNING}⊘{Colors.ENDC} {name} {Colors.WARNING}SKIPPED{Colors.ENDC} - {message}")
    
    if message and status != "SKIP":
        print(f"  {Colors.OKCYAN}→{Colors.ENDC} {message}")


def print_header(text: str):
    """Print section header"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{text.center(80)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.ENDC}\n")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def create_test_user() -> Tuple[str, str]:
    """Create a test user and return (user_id, token)"""
    try:
        # Register user
        response = requests.post(
            f"{BACKEND_URL}/auth/register",
            json={
                "name": "Test User",
                "email": f"test_live_{int(time.time())}@example.com",
                "password": "TestPass123!"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["user"]["id"], data["token"]
        else:
            print(f"Failed to create user: {response.text}")
            return None, None
    except Exception as e:
        print(f"Error creating user: {e}")
        return None, None


def create_test_wedding(token: str) -> str:
    """Create a test wedding and return wedding_id"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/weddings",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": f"Test Wedding {int(time.time())}",
                "bride_name": "Jane Doe",
                "groom_name": "John Doe",
                "scheduled_date": "2024-12-31T18:00:00Z",
                "location": "Test Venue",
                "description": "Test wedding for live control system"
            }
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            return data.get("id") or data.get("wedding_id")
        else:
            print(f"Failed to create wedding: {response.text}")
            return None
    except Exception as e:
        print(f"Error creating wedding: {e}")
        return None


def get_wedding_status(wedding_id: str) -> Dict:
    """Get current live status of wedding"""
    try:
        response = requests.get(f"{BACKEND_URL}/weddings/{wedding_id}/live/status")
        if response.status_code == 200:
            return response.json()
        return {}
    except Exception as e:
        print(f"Error getting status: {e}")
        return {}


def simulate_rtmp_webhook(wedding_id: str, webhook: str, stream_key: str) -> bool:
    """Simulate RTMP webhook call"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/rtmp/{webhook}",
            data={"name": stream_key}
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Error simulating webhook: {e}")
        return False


# =============================================================================
# TEST FUNCTIONS
# =============================================================================

def test_go_live(wedding_id: str, token: str):
    """Test Go Live functionality"""
    start_time = time.time()
    
    try:
        # 1. Click Go Live
        response = requests.post(
            f"{BACKEND_URL}/weddings/{wedding_id}/live/go-live",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            log_test(
                "Go Live - Initiate",
                "FAIL",
                f"Expected 200, got {response.status_code}: {response.text}"
            )
            return None
        
        data = response.json()
        
        # 2. Verify status is WAITING
        if data.get("status") != "waiting":
            log_test(
                "Go Live - Status Check",
                "FAIL",
                f"Expected status 'waiting', got '{data.get('status')}'"
            )
            return None
        
        # 3. Verify RTMP credentials returned
        if not data.get("rtmp_url") or not data.get("stream_key"):
            log_test(
                "Go Live - RTMP Credentials",
                "FAIL",
                "RTMP credentials not returned"
            )
            return None
        
        duration = time.time() - start_time
        log_test("Go Live - Complete Flow", "PASS", 
                 f"Status: WAITING, RTMP URL: {data.get('rtmp_url')}", duration)
        
        return data.get("stream_key")
        
    except Exception as e:
        log_test("Go Live", "FAIL", str(e))
        return None


def test_obs_start(wedding_id: str, stream_key: str):
    """Test OBS stream start detection"""
    start_time = time.time()
    
    try:
        # 1. Simulate RTMP on-publish webhook
        success = simulate_rtmp_webhook(wedding_id, "on-publish", stream_key)
        
        if not success:
            log_test("OBS Start - Webhook", "FAIL", "Failed to call on-publish webhook")
            return False
        
        # 2. Wait a bit for processing
        time.sleep(2)
        
        # 3. Verify status transitioned to LIVE
        status = get_wedding_status(wedding_id)
        
        if status.get("status") != "live":
            log_test(
                "OBS Start - Status Transition",
                "FAIL",
                f"Expected status 'live', got '{status.get('status')}'"
            )
            return False
        
        duration = time.time() - start_time
        log_test("OBS Start - WAITING → LIVE", "PASS", 
                 "Stream detected and status updated", duration)
        return True
        
    except Exception as e:
        log_test("OBS Start", "FAIL", str(e))
        return False


def test_obs_stop(wedding_id: str, stream_key: str):
    """Test OBS stream stop (should PAUSE, not END)"""
    start_time = time.time()
    
    try:
        # 1. Simulate RTMP on-publish-done webhook
        success = simulate_rtmp_webhook(wedding_id, "on-publish-done", stream_key)
        
        if not success:
            log_test("OBS Stop - Webhook", "FAIL", "Failed to call on-publish-done webhook")
            return False
        
        # 2. Wait for processing
        time.sleep(2)
        
        # 3. Verify status is PAUSED (NOT ENDED)
        status = get_wedding_status(wedding_id)
        
        if status.get("status") == "ended":
            log_test(
                "OBS Stop - Should Not End",
                "FAIL",
                "Status changed to ENDED instead of PAUSED"
            )
            return False
        
        if status.get("status") != "paused":
            log_test(
                "OBS Stop - Status Check",
                "FAIL",
                f"Expected status 'paused', got '{status.get('status')}'"
            )
            return False
        
        duration = time.time() - start_time
        log_test("OBS Stop - LIVE → PAUSED", "PASS", 
                 "Stream stopped, status paused (not ended)", duration)
        return True
        
    except Exception as e:
        log_test("OBS Stop", "FAIL", str(e))
        return False


def test_manual_pause(wedding_id: str, token: str):
    """Test manual pause by host"""
    start_time = time.time()
    
    try:
        # Pause the stream
        response = requests.post(
            f"{BACKEND_URL}/weddings/{wedding_id}/live/pause",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            log_test(
                "Manual Pause - API Call",
                "FAIL",
                f"Expected 200, got {response.status_code}"
            )
            return False
        
        # Verify status
        time.sleep(1)
        status = get_wedding_status(wedding_id)
        
        if status.get("status") != "paused":
            log_test(
                "Manual Pause - Status Check",
                "FAIL",
                f"Expected 'paused', got '{status.get('status')}'"
            )
            return False
        
        duration = time.time() - start_time
        log_test("Manual Pause", "PASS", "Host successfully paused stream", duration)
        return True
        
    except Exception as e:
        log_test("Manual Pause", "FAIL", str(e))
        return False


def test_resume(wedding_id: str, token: str, stream_key: str):
    """Test resume after pause"""
    start_time = time.time()
    
    try:
        # 1. Try to resume (should fail if OBS not streaming)
        response = requests.post(
            f"{BACKEND_URL}/weddings/{wedding_id}/live/resume",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should get error or success depending on OBS state
        # For test, we'll simulate OBS start first
        simulate_rtmp_webhook(wedding_id, "on-publish", stream_key)
        time.sleep(2)
        
        # Now resume should work
        response = requests.post(
            f"{BACKEND_URL}/weddings/{wedding_id}/live/resume",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            log_test(
                "Resume - API Call",
                "FAIL",
                f"Expected 200, got {response.status_code}"
            )
            return False
        
        # Verify status is LIVE
        time.sleep(1)
        status = get_wedding_status(wedding_id)
        
        if status.get("status") != "live":
            log_test(
                "Resume - Status Check",
                "FAIL",
                f"Expected 'live', got '{status.get('status')}'"
            )
            return False
        
        duration = time.time() - start_time
        log_test("Resume - PAUSED → LIVE", "PASS", 
                 "Stream successfully resumed", duration)
        return True
        
    except Exception as e:
        log_test("Resume", "FAIL", str(e))
        return False


def test_end_live(wedding_id: str, token: str):
    """Test final end live"""
    start_time = time.time()
    
    try:
        # End the live stream
        response = requests.post(
            f"{BACKEND_URL}/weddings/{wedding_id}/live/end",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            log_test(
                "End Live - API Call",
                "FAIL",
                f"Expected 200, got {response.status_code}"
            )
            return False
        
        # Verify status is ENDED
        time.sleep(2)
        status = get_wedding_status(wedding_id)
        
        if status.get("status") != "ended":
            log_test(
                "End Live - Status Check",
                "FAIL",
                f"Expected 'ended', got '{status.get('status')}'"
            )
            return False
        
        # Verify can_go_live is False
        if status.get("can_go_live", True):
            log_test(
                "End Live - Can Go Live Flag",
                "FAIL",
                "can_go_live should be False after ending"
            )
            return False
        
        duration = time.time() - start_time
        log_test("End Live - Final State", "PASS", 
                 "Stream ended, can_go_live=False", duration)
        return True
        
    except Exception as e:
        log_test("End Live", "FAIL", str(e))
        return False


def test_invalid_transitions(wedding_id: str, token: str):
    """Test that invalid transitions are blocked"""
    start_time = time.time()
    
    try:
        # Create a fresh wedding in IDLE state
        new_wedding_id = create_test_wedding(token)
        if not new_wedding_id:
            log_test("Invalid Transitions - Setup", "SKIP", "Could not create test wedding")
            return
        
        # 1. Try to resume when IDLE (should fail)
        response = requests.post(
            f"{BACKEND_URL}/weddings/{new_wedding_id}/live/resume",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            log_test(
                "Invalid Transitions - Resume from IDLE",
                "FAIL",
                "Should not allow resume from IDLE state"
            )
            return
        
        # 2. Try to pause when IDLE (should fail)
        response = requests.post(
            f"{BACKEND_URL}/weddings/{new_wedding_id}/live/pause",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            log_test(
                "Invalid Transitions - Pause from IDLE",
                "FAIL",
                "Should not allow pause from IDLE state"
            )
            return
        
        # 3. Try to go live again after ending (should fail)
        # First go live and end
        stream_key = test_go_live(new_wedding_id, token)
        if stream_key:
            test_end_live(new_wedding_id, token)
            
            # Now try to go live again
            response = requests.post(
                f"{BACKEND_URL}/weddings/{new_wedding_id}/live/go-live",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                log_test(
                    "Invalid Transitions - Go Live After End",
                    "FAIL",
                    "Should not allow going live after stream ended"
                )
                return
        
        duration = time.time() - start_time
        log_test("Invalid Transitions - All Blocked", "PASS", 
                 "All invalid transitions properly rejected", duration)
        
    except Exception as e:
        log_test("Invalid Transitions", "FAIL", str(e))


def test_pause_count_tracking(wedding_id: str, token: str, stream_key: str):
    """Test that pause count is tracked correctly"""
    start_time = time.time()
    
    try:
        # Start from live state
        initial_status = get_wedding_status(wedding_id)
        initial_count = initial_status.get("pause_count", 0)
        
        # Pause 1
        simulate_rtmp_webhook(wedding_id, "on-publish-done", stream_key)
        time.sleep(1)
        
        # Resume 1
        simulate_rtmp_webhook(wedding_id, "on-publish", stream_key)
        time.sleep(1)
        
        # Pause 2
        simulate_rtmp_webhook(wedding_id, "on-publish-done", stream_key)
        time.sleep(1)
        
        # Check pause count
        status = get_wedding_status(wedding_id)
        pause_count = status.get("pause_count", 0)
        
        expected_count = initial_count + 2
        if pause_count != expected_count:
            log_test(
                "Pause Count Tracking",
                "FAIL",
                f"Expected pause_count={expected_count}, got {pause_count}"
            )
            return False
        
        duration = time.time() - start_time
        log_test("Pause Count Tracking", "PASS", 
                 f"Pause count correctly tracked: {pause_count}", duration)
        return True
        
    except Exception as e:
        log_test("Pause Count Tracking", "FAIL", str(e))
        return False


def test_authorization():
    """Test authorization checks"""
    start_time = time.time()
    
    try:
        # Create two users
        user1_id, user1_token = create_test_user()
        user2_id, user2_token = create_test_user()
        
        if not user1_token or not user2_token:
            log_test("Authorization - Setup", "SKIP", "Could not create test users")
            return
        
        # User 1 creates wedding
        wedding_id = create_test_wedding(user1_token)
        if not wedding_id:
            log_test("Authorization - Setup", "SKIP", "Could not create wedding")
            return
        
        # User 2 tries to control (should fail)
        response = requests.post(
            f"{BACKEND_URL}/weddings/{wedding_id}/live/go-live",
            headers={"Authorization": f"Bearer {user2_token}"}
        )
        
        if response.status_code == 200:
            log_test(
                "Authorization - Unauthorized Control",
                "FAIL",
                "User 2 should not be able to control User 1's wedding"
            )
            return
        
        duration = time.time() - start_time
        log_test("Authorization - Access Control", "PASS", 
                 "Only creator can control wedding", duration)
        
    except Exception as e:
        log_test("Authorization", "FAIL", str(e))


def test_viewer_status_endpoint(wedding_id: str):
    """Test public viewer status endpoint (no auth required)"""
    start_time = time.time()
    
    try:
        # Public endpoint should work without token
        response = requests.get(f"{BACKEND_URL}/weddings/{wedding_id}/live/status")
        
        if response.status_code != 200:
            log_test(
                "Viewer Status - Public Access",
                "FAIL",
                f"Expected 200, got {response.status_code}"
            )
            return False
        
        data = response.json()
        
        # Should have status field
        if "status" not in data:
            log_test(
                "Viewer Status - Data Format",
                "FAIL",
                "Response missing 'status' field"
            )
            return False
        
        duration = time.time() - start_time
        log_test("Viewer Status - Public Endpoint", "PASS", 
                 f"Status: {data.get('status')}", duration)
        return True
        
    except Exception as e:
        log_test("Viewer Status", "FAIL", str(e))
        return False


# =============================================================================
# MAIN TEST SUITE
# =============================================================================

def run_complete_flow_test():
    """Run complete happy path test"""
    print_header("COMPLETE FLOW TEST - Happy Path")
    
    # Setup
    print(f"{Colors.OKCYAN}Setting up test environment...{Colors.ENDC}")
    user_id, token = create_test_user()
    
    if not token:
        print(f"{Colors.FAIL}Failed to create test user{Colors.ENDC}")
        return False
    
    wedding_id = create_test_wedding(token)
    if not wedding_id:
        print(f"{Colors.FAIL}Failed to create test wedding{Colors.ENDC}")
        return False
    
    print(f"{Colors.OKGREEN}✓ Test environment ready{Colors.ENDC}")
    print(f"  Wedding ID: {wedding_id}")
    print()
    
    # Run tests in sequence
    print(f"{Colors.BOLD}Running test sequence...{Colors.ENDC}\n")
    
    # 1. Go Live
    stream_key = test_go_live(wedding_id, token)
    if not stream_key:
        print(f"\n{Colors.FAIL}Flow test failed at Go Live step{Colors.ENDC}")
        return False
    
    # 2. OBS Start (WAITING → LIVE)
    if not test_obs_start(wedding_id, stream_key):
        print(f"\n{Colors.FAIL}Flow test failed at OBS Start step{Colors.ENDC}")
        return False
    
    # 3. Viewer Status Check
    test_viewer_status_endpoint(wedding_id)
    
    # 4. OBS Stop (LIVE → PAUSED)
    if not test_obs_stop(wedding_id, stream_key):
        print(f"\n{Colors.FAIL}Flow test failed at OBS Stop step{Colors.ENDC}")
        return False
    
    # 5. Resume (PAUSED → LIVE)
    if not test_resume(wedding_id, token, stream_key):
        print(f"\n{Colors.FAIL}Flow test failed at Resume step{Colors.ENDC}")
        return False
    
    # 6. Manual Pause
    if not test_manual_pause(wedding_id, token):
        print(f"\n{Colors.FAIL}Flow test failed at Manual Pause step{Colors.ENDC}")
        return False
    
    # 7. Resume again
    if not test_resume(wedding_id, token, stream_key):
        print(f"\n{Colors.FAIL}Flow test failed at second Resume step{Colors.ENDC}")
        return False
    
    # 8. End Live (final)
    if not test_end_live(wedding_id, token):
        print(f"\n{Colors.FAIL}Flow test failed at End Live step{Colors.ENDC}")
        return False
    
    print(f"\n{Colors.OKGREEN}{Colors.BOLD}✓ Complete flow test PASSED{Colors.ENDC}")
    return True


def run_all_tests():
    """Run all test scenarios"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔" + "="*78 + "╗")
    print("║" + "WEDLIVE LIVE CONTROL SYSTEM - COMPREHENSIVE TEST SUITE".center(78) + "║")
    print("║" + "Phase 8: Complete Flow Verification".center(78) + "║")
    print("╚" + "="*78 + "╝")
    print(f"{Colors.ENDC}\n")
    
    # Test 1: Complete Happy Path
    run_complete_flow_test()
    
    # Test 2: Invalid Transitions
    print_header("INVALID TRANSITIONS TEST")
    user_id, token = create_test_user()
    if token:
        test_invalid_transitions(None, token)
    
    # Test 3: Authorization
    print_header("AUTHORIZATION TEST")
    test_authorization()
    
    # Print summary
    print_header("TEST SUMMARY")
    
    total = test_stats["total"]
    passed = test_stats["passed"]
    failed = test_stats["failed"]
    skipped = test_stats["skipped"]
    
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests:   {total}")
    print(f"{Colors.OKGREEN}Passed:        {passed} ({pass_rate:.1f}%){Colors.ENDC}")
    
    if failed > 0:
        print(f"{Colors.FAIL}Failed:        {failed}{Colors.ENDC}")
    else:
        print(f"Failed:        {failed}")
    
    if skipped > 0:
        print(f"{Colors.WARNING}Skipped:       {skipped}{Colors.ENDC}")
    
    print()
    
    # Overall result
    if failed == 0 and passed > 0:
        print(f"{Colors.OKGREEN}{Colors.BOLD}{'='*80}{Colors.ENDC}")
        print(f"{Colors.OKGREEN}{Colors.BOLD}ALL TESTS PASSED ✓{Colors.ENDC}")
        print(f"{Colors.OKGREEN}{Colors.BOLD}{'='*80}{Colors.ENDC}")
        return 0
    else:
        print(f"{Colors.FAIL}{Colors.BOLD}{'='*80}{Colors.ENDC}")
        print(f"{Colors.FAIL}{Colors.BOLD}SOME TESTS FAILED ✗{Colors.ENDC}")
        print(f"{Colors.FAIL}{Colors.BOLD}{'='*80}{Colors.ENDC}")
        return 1


if __name__ == "__main__":
    print(f"\n{Colors.OKCYAN}Starting test suite...{Colors.ENDC}")
    print(f"{Colors.OKCYAN}Backend URL: {BACKEND_URL}{Colors.ENDC}")
    print(f"{Colors.OKCYAN}Frontend URL: {FRONTEND_URL}{Colors.ENDC}\n")
    
    # Check if backend is running
    try:
        response = requests.get(f"{BACKEND_URL.replace('/api', '')}/health", timeout=5)
        if response.status_code != 200:
            print(f"{Colors.FAIL}Backend is not responding properly{Colors.ENDC}")
            sys.exit(1)
    except Exception as e:
        print(f"{Colors.FAIL}Cannot connect to backend: {e}{Colors.ENDC}")
        print(f"{Colors.WARNING}Make sure backend is running on {BACKEND_URL}{Colors.ENDC}")
        sys.exit(1)
    
    print(f"{Colors.OKGREEN}✓ Backend is running{Colors.ENDC}\n")
    
    # Run tests
    exit_code = run_all_tests()
    
    # Save results to file
    with open('/app/test_live_control_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "stats": test_stats,
            "results": [
                {
                    "name": r.name,
                    "status": r.status,
                    "message": r.message,
                    "duration": r.duration,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in test_results
            ]
        }, f, indent=2)
    
    print(f"\n{Colors.OKCYAN}Results saved to: /app/test_live_control_results.json{Colors.ENDC}\n")
    
    sys.exit(exit_code)
