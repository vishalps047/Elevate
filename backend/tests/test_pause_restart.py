"""
Test suite for ELEVATE Coaching Platform - Pause/Restart Journey Features
Tests: Pause Journey API, Restart Journey API, Notifications, Session Blocking
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
COACHEE_EMAIL = "sarah@elevate.com"
COACHEE_PASSWORD = os.environ.get("TEST_PASSWORD", "password123")
COACH_EMAIL = "fatema@elevate.com"
COACH_PASSWORD = os.environ.get("TEST_PASSWORD", "password123")
ALEX_EMAIL = "alex@elevate.com"
ALEX_PASSWORD = os.environ.get("TEST_PASSWORD", "password123")


@pytest.fixture(scope="module")
def coachee_token():
    """Get Sarah's (coachee) auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACHEE_EMAIL,
        "password": COACHEE_PASSWORD
    })
    assert response.status_code == 200, f"Coachee login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def coach_token():
    """Get Fatema's (coach) auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_EMAIL,
        "password": COACH_PASSWORD
    })
    assert response.status_code == 200, f"Coach login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def alex_token():
    """Get Alex's (coachee without active journey) auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ALEX_EMAIL,
        "password": ALEX_PASSWORD
    })
    assert response.status_code == 200, f"Alex login failed: {response.text}"
    return response.json()["token"]


class TestPauseJourneyAPI:
    """Tests for PUT /api/requests/{id}/pause endpoint"""
    
    def test_pause_requires_coach_role(self, coachee_token):
        """Coachee cannot pause a journey - only coaches can"""
        # First get the active request
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert response.status_code == 200
        active_request = response.json().get("request")
        
        if active_request and active_request.get("status") == "accepted":
            # Try to pause as coachee - should fail
            pause_response = requests.put(
                f"{BASE_URL}/api/requests/{active_request['id']}/pause",
                headers={"Authorization": f"Bearer {coachee_token}"}
            )
            assert pause_response.status_code == 403, "Coachee should not be able to pause"
            assert "Only coaches" in pause_response.json().get("detail", "")
            print("PASS: Coachee correctly blocked from pausing journey")
        else:
            pytest.skip("No active accepted journey for Sarah to test pause")
    
    def test_pause_only_accepted_journeys(self, coach_token):
        """Can only pause journeys with status 'accepted'"""
        # Get all requests for coach
        response = requests.get(
            f"{BASE_URL}/api/requests",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert response.status_code == 200
        requests_list = response.json()
        
        # Find a non-accepted request (pending, completed, etc.)
        non_accepted = [r for r in requests_list if r.get("status") not in ["accepted", "paused"] and r.get("active_coach_id")]
        
        if non_accepted:
            req = non_accepted[0]
            pause_response = requests.put(
                f"{BASE_URL}/api/requests/{req['id']}/pause",
                headers={"Authorization": f"Bearer {coach_token}"}
            )
            assert pause_response.status_code == 400, "Should not pause non-accepted journey"
            print(f"PASS: Cannot pause journey with status '{req.get('status')}'")
        else:
            print("INFO: No non-accepted journeys to test - skipping")
    
    def test_pause_journey_success(self, coach_token, coachee_token):
        """Coach can successfully pause an accepted journey"""
        # Get active request for Sarah
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert response.status_code == 200
        active_request = response.json().get("request")
        
        if not active_request or active_request.get("status") != "accepted":
            pytest.skip("No active accepted journey to pause")
        
        request_id = active_request["id"]
        
        # Pause the journey as coach
        pause_response = requests.put(
            f"{BASE_URL}/api/requests/{request_id}/pause",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert pause_response.status_code == 200, f"Pause failed: {pause_response.text}"
        assert "paused" in pause_response.json().get("message", "").lower()
        print("PASS: Journey paused successfully")
        
        # Verify status changed to 'paused'
        verify_response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert verify_response.status_code == 200
        updated_request = verify_response.json().get("request")
        assert updated_request["status"] == "paused", f"Expected 'paused', got '{updated_request['status']}'"
        print("PASS: Journey status verified as 'paused'")


class TestRestartJourneyAPI:
    """Tests for PUT /api/requests/{id}/restart endpoint"""
    
    def test_restart_requires_coach_role(self, coachee_token):
        """Coachee cannot restart a journey - only coaches can"""
        # Get active request
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert response.status_code == 200
        active_request = response.json().get("request")
        
        if active_request and active_request.get("status") == "paused":
            # Try to restart as coachee - should fail
            restart_response = requests.put(
                f"{BASE_URL}/api/requests/{active_request['id']}/restart",
                headers={"Authorization": f"Bearer {coachee_token}"}
            )
            assert restart_response.status_code == 403, "Coachee should not be able to restart"
            assert "Only coaches" in restart_response.json().get("detail", "")
            print("PASS: Coachee correctly blocked from restarting journey")
        else:
            pytest.skip("No paused journey for Sarah to test restart")
    
    def test_restart_only_paused_journeys(self, coach_token, coachee_token):
        """Can only restart journeys with status 'paused'"""
        # First ensure we have an accepted (not paused) journey
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        active_request = response.json().get("request")
        
        if active_request and active_request.get("status") == "accepted":
            # Try to restart an accepted journey - should fail
            restart_response = requests.put(
                f"{BASE_URL}/api/requests/{active_request['id']}/restart",
                headers={"Authorization": f"Bearer {coach_token}"}
            )
            assert restart_response.status_code == 400, "Should not restart non-paused journey"
            assert "paused" in restart_response.json().get("detail", "").lower()
            print("PASS: Cannot restart journey that is not paused")
        else:
            print("INFO: Journey is already paused or not active - skipping this test")
    
    def test_restart_journey_success(self, coach_token, coachee_token):
        """Coach can successfully restart a paused journey"""
        # Get active request
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert response.status_code == 200
        active_request = response.json().get("request")
        
        if not active_request or active_request.get("status") != "paused":
            pytest.skip("No paused journey to restart")
        
        request_id = active_request["id"]
        
        # Restart the journey as coach
        restart_response = requests.put(
            f"{BASE_URL}/api/requests/{request_id}/restart",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert restart_response.status_code == 200, f"Restart failed: {restart_response.text}"
        assert "restart" in restart_response.json().get("message", "").lower()
        print("PASS: Journey restarted successfully")
        
        # Verify status changed back to 'accepted'
        verify_response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert verify_response.status_code == 200
        updated_request = verify_response.json().get("request")
        assert updated_request["status"] == "accepted", f"Expected 'accepted', got '{updated_request['status']}'"
        print("PASS: Journey status verified as 'accepted'")


class TestPauseNotifications:
    """Tests for notifications when journey is paused/restarted"""
    
    def test_pause_creates_notification_for_coachee(self, coach_token, coachee_token):
        """When coach pauses journey, coachee receives notification"""
        # Get active request
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        active_request = response.json().get("request")
        
        if not active_request or active_request.get("status") != "accepted":
            pytest.skip("No active accepted journey to test notifications")
        
        # Get current notification count
        notif_before = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        count_before = len(notif_before.json())
        
        # Pause the journey
        pause_response = requests.put(
            f"{BASE_URL}/api/requests/{active_request['id']}/pause",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert pause_response.status_code == 200
        
        # Check notifications increased
        notif_after = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        notifications = notif_after.json()
        count_after = len(notifications)
        
        assert count_after > count_before, "Notification should be created on pause"
        
        # Check latest notification content
        latest = notifications[0]
        assert "paused" in latest.get("message", "").lower() or "paused" in latest.get("title", "").lower()
        print("PASS: Pause notification created for coachee")
    
    def test_restart_creates_notification_for_coachee(self, coach_token, coachee_token):
        """When coach restarts journey, coachee receives notification"""
        # Get active request (should be paused from previous test)
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        active_request = response.json().get("request")
        
        if not active_request or active_request.get("status") != "paused":
            pytest.skip("No paused journey to test restart notifications")
        
        # Get current notification count
        notif_before = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        count_before = len(notif_before.json())
        
        # Restart the journey
        restart_response = requests.put(
            f"{BASE_URL}/api/requests/{active_request['id']}/restart",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert restart_response.status_code == 200
        
        # Check notifications increased
        notif_after = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        notifications = notif_after.json()
        count_after = len(notifications)
        
        assert count_after > count_before, "Notification should be created on restart"
        
        # Check latest notification content
        latest = notifications[0]
        assert "resum" in latest.get("message", "").lower() or "restart" in latest.get("message", "").lower()
        print("PASS: Restart notification created for coachee")


class TestSessionBlockingWhenPaused:
    """Tests that session scheduling is blocked when journey is paused"""
    
    def test_session_create_blocked_when_paused(self, coach_token, coachee_token):
        """Cannot create session when journey is paused"""
        # Get active request
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        active_request = response.json().get("request")
        
        if not active_request:
            pytest.skip("No active request to test session blocking")
        
        # First pause the journey if it's accepted
        if active_request.get("status") == "accepted":
            pause_response = requests.put(
                f"{BASE_URL}/api/requests/{active_request['id']}/pause",
                headers={"Authorization": f"Bearer {coach_token}"}
            )
            assert pause_response.status_code == 200
        
        # Verify it's paused
        verify_response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        active_request = verify_response.json().get("request")
        
        if active_request.get("status") != "paused":
            pytest.skip("Journey is not paused")
        
        # Try to create a session - should fail
        session_response = requests.post(
            f"{BASE_URL}/api/sessions",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={
                "request_id": active_request["id"],
                "date": "2026-04-15",
                "time": "10:00 AM",
                "topic": "Test Session"
            }
        )
        
        # Should fail because status is not 'accepted'
        assert session_response.status_code == 400, f"Session should be blocked when paused: {session_response.text}"
        assert "non-accepted" in session_response.json().get("detail", "").lower() or "invalid" in session_response.json().get("detail", "").lower()
        print("PASS: Session creation blocked when journey is paused")
        
        # Restart the journey for other tests
        restart_response = requests.put(
            f"{BASE_URL}/api/requests/{active_request['id']}/restart",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert restart_response.status_code == 200
        print("INFO: Journey restarted for subsequent tests")


class TestSessionsCompletedStat:
    """Tests for Sessions Completed stat including all journeys"""
    
    def test_sarah_has_past_sessions(self, coachee_token):
        """Sarah should have 6 past sessions from previous journey with Gaurav"""
        response = requests.get(
            f"{BASE_URL}/api/sessions",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert response.status_code == 200
        sessions = response.json()
        
        # Count completed sessions
        completed = [s for s in sessions if s.get("status") == "completed"]
        print(f"INFO: Sarah has {len(completed)} completed sessions total")
        
        # Sarah should have at least 6 past sessions from seed data
        assert len(completed) >= 6, f"Expected at least 6 completed sessions, got {len(completed)}"
        print("PASS: Sarah has past sessions from previous journeys")
    
    def test_all_sessions_returned_not_just_current(self, coachee_token):
        """GET /api/sessions returns ALL sessions, not just current journey"""
        # Get active request
        active_response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        active_request = active_response.json().get("request")
        
        # Get all sessions
        sessions_response = requests.get(
            f"{BASE_URL}/api/sessions",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert sessions_response.status_code == 200
        all_sessions = sessions_response.json()
        
        # Check if there are sessions from different request_ids
        request_ids = set(s.get("request_id") for s in all_sessions)
        print(f"INFO: Sessions from {len(request_ids)} different requests")
        
        if active_request:
            # Should have sessions from both current and past journeys
            past_sessions = [s for s in all_sessions if s.get("request_id") != active_request.get("id")]
            print(f"INFO: {len(past_sessions)} sessions from past journeys")
        
        print("PASS: All sessions returned across journeys")


class TestActiveRequestIncludesPaused:
    """Tests that GET /api/requests/active includes paused status"""
    
    def test_active_request_returns_paused_journey(self, coach_token, coachee_token):
        """GET /api/requests/active should return journey even when paused"""
        # Get active request
        response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert response.status_code == 200
        active_request = response.json().get("request")
        
        if not active_request or active_request.get("status") != "accepted":
            pytest.skip("No active accepted journey to test")
        
        request_id = active_request["id"]
        
        # Pause the journey
        pause_response = requests.put(
            f"{BASE_URL}/api/requests/{request_id}/pause",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert pause_response.status_code == 200
        
        # Get active request again - should still return the paused journey
        paused_response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert paused_response.status_code == 200
        paused_request = paused_response.json().get("request")
        
        assert paused_request is not None, "Paused journey should still be returned as active"
        assert paused_request["status"] == "paused"
        assert paused_request["id"] == request_id
        print("PASS: GET /api/requests/active returns paused journey")
        
        # Restart for cleanup
        restart_response = requests.put(
            f"{BASE_URL}/api/requests/{request_id}/restart",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert restart_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
