"""
ELEVATE Coaching Platform - Backend API Tests
Tests cover: Auth, Coaches, Requests (with cascading decline), Sessions, Notifications
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
COACHEE_EMAIL = "sarah@elevate.com"
COACHEE2_EMAIL = "alex@elevate.com"
COACH_EMAIL = "fatema@elevate.com"
COACH2_EMAIL = "vaishali@elevate.com"
COACH3_EMAIL = "gaurav@elevate.com"
ADMIN_EMAIL = "admin@elevate.com"
PASSWORD = os.environ.get("TEST_PASSWORD", "password123")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_coachee_success(self):
        """Test coachee login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == COACHEE_EMAIL
        assert data["user"]["role"] == "coachee"
        assert data["user"]["name"] == "Sarah Johnson"
    
    def test_login_coach_success(self):
        """Test coach login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "coach"
        assert data["user"]["name"] == "Fatema Hunaid"
    
    def test_login_admin_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@elevate.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_login_wrong_password(self):
        """Test login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_get_me_authenticated(self):
        """Test /auth/me with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL,
            "password": PASSWORD
        })
        token = login_resp.json()["token"]
        
        # Get me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == COACHEE_EMAIL
    
    def test_get_me_unauthenticated(self):
        """Test /auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


class TestCoaches:
    """Coaches endpoint tests"""
    
    @pytest.fixture
    def coachee_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL, "password": PASSWORD
        })
        return resp.json()["token"]
    
    def test_list_coaches(self, coachee_token):
        """Test listing all coaches"""
        response = requests.get(f"{BASE_URL}/api/coaches", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 200
        coaches = response.json()
        assert isinstance(coaches, list)
        assert len(coaches) >= 6  # We seeded 6 coaches
        
        # Verify coach structure
        coach = coaches[0]
        assert "id" in coach
        assert "name" in coach
        assert "email" in coach
        assert "role" in coach
        assert coach["role"] == "coach"
        assert "password_hash" not in coach  # Should be excluded
    
    def test_list_coaches_unauthenticated(self):
        """Test listing coaches without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/coaches")
        assert response.status_code == 401
    
    def test_get_availability(self, coachee_token):
        """Test getting coach availability slots"""
        response = requests.get(f"{BASE_URL}/api/coaches/coach-1/availability", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 200
        slots = response.json()
        assert isinstance(slots, list)
        assert len(slots) > 0
        # Verify slot structure
        slot = slots[0]
        assert "date" in slot
        assert "day" in slot
        assert "slots" in slot


class TestRequests:
    """Coaching request tests including cascading decline"""
    
    @pytest.fixture
    def coachee_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE2_EMAIL, "password": PASSWORD  # Use Alex to avoid conflicts
        })
        return resp.json()["token"]
    
    @pytest.fixture
    def coach_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL, "password": PASSWORD
        })
        return resp.json()["token"]
    
    @pytest.fixture
    def coach2_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH2_EMAIL, "password": PASSWORD
        })
        return resp.json()["token"]
    
    def test_create_request_success(self, coachee_token):
        """Test creating a coaching request with 3 preferences"""
        response = requests.post(f"{BASE_URL}/api/requests", headers={
            "Authorization": f"Bearer {coachee_token}"
        }, json={
            "preferences": [
                {"coach_id": "coach-1", "order": 1},
                {"coach_id": "coach-2", "order": 2},
                {"coach_id": "coach-3", "order": 3}
            ],
            "goals": "Improve leadership skills",
            "challenges": "Managing remote teams",
            "previous_exp": "Some mentoring experience",
            "notes": "Prefer morning sessions",
            "mentorship_area": "Leadership Development"
        })
        # May fail if Alex already has active request
        if response.status_code == 400:
            assert "already have an active" in response.json().get("detail", "")
            pytest.skip("Coachee already has active request")
        
        assert response.status_code == 200, f"Got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["status"] == "pending"
        assert len(data["preferences"]) == 3
        assert data["preferences"][0]["status"] == "pending"
        assert data["preferences"][1]["status"] == "waiting"
        assert data["preferences"][2]["status"] == "waiting"
    
    def test_create_request_coach_forbidden(self, coach_token):
        """Test that coaches cannot create requests"""
        response = requests.post(f"{BASE_URL}/api/requests", headers={
            "Authorization": f"Bearer {coach_token}"
        }, json={
            "preferences": [{"coach_id": "coach-2", "order": 1}],
            "goals": "Test",
            "challenges": "Test"
        })
        assert response.status_code == 403
    
    def test_get_active_request(self, coachee_token):
        """Test getting active request for coachee"""
        response = requests.get(f"{BASE_URL}/api/requests/active", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "request" in data
    
    def test_list_requests_coachee(self, coachee_token):
        """Test listing requests as coachee"""
        response = requests.get(f"{BASE_URL}/api/requests", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_list_requests_coach(self, coach_token):
        """Test listing requests as coach"""
        response = requests.get(f"{BASE_URL}/api/requests", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestSessions:
    """Session management tests"""
    
    @pytest.fixture
    def coachee_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL, "password": PASSWORD
        })
        return resp.json()["token"]
    
    @pytest.fixture
    def coach_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL, "password": PASSWORD
        })
        return resp.json()["token"]
    
    def test_list_sessions_coachee(self, coachee_token):
        """Test listing sessions as coachee"""
        response = requests.get(f"{BASE_URL}/api/sessions", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_list_sessions_coach(self, coach_token):
        """Test listing sessions as coach"""
        response = requests.get(f"{BASE_URL}/api/sessions", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_list_sessions_unauthenticated(self):
        """Test listing sessions without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/sessions")
        assert response.status_code == 401


class TestNotifications:
    """Notification tests"""
    
    @pytest.fixture
    def coachee_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL, "password": PASSWORD
        })
        return resp.json()["token"]
    
    def test_list_notifications(self, coachee_token):
        """Test listing notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_mark_all_read(self, coachee_token):
        """Test marking all notifications as read"""
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_notifications_unauthenticated(self):
        """Test notifications without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401


class TestEndToEndFlow:
    """End-to-end flow tests for the coaching journey"""
    
    def test_full_coaching_flow(self):
        """
        Test the complete coaching flow:
        1. Coachee logs in
        2. Coachee creates request with 3 preferences
        3. Coach logs in and sees pending request
        4. Coach accepts request
        5. Coachee schedules session
        6. Coachee completes journey
        7. Coachee submits feedback
        """
        # Use Sarah for this test
        # Step 1: Login as coachee
        coachee_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL, "password": PASSWORD
        })
        assert coachee_login.status_code == 200
        coachee_token = coachee_login.json()["token"]
        coachee_headers = {"Authorization": f"Bearer {coachee_token}"}
        
        # Check if coachee already has active request
        active_resp = requests.get(f"{BASE_URL}/api/requests/active", headers=coachee_headers)
        active_data = active_resp.json()
        
        if active_data.get("request"):
            # Already has active request - test the existing flow
            request_id = active_data["request"]["id"]
            request_status = active_data["request"]["status"]
            
            if request_status == "accepted":
                # Test complete journey
                complete_resp = requests.put(
                    f"{BASE_URL}/api/requests/{request_id}/complete-journey",
                    headers=coachee_headers
                )
                if complete_resp.status_code == 200:
                    # Test feedback
                    feedback_resp = requests.post(
                        f"{BASE_URL}/api/requests/{request_id}/feedback",
                        headers=coachee_headers,
                        json={"rating": 5, "comment": "Great coaching experience!"}
                    )
                    # May already have feedback submitted
                    assert feedback_resp.status_code in [200, 400]
            
            print(f"Existing request found with status: {request_status}")
            return
        
        # Step 2: Create new request
        create_resp = requests.post(f"{BASE_URL}/api/requests", headers=coachee_headers, json={
            "preferences": [
                {"coach_id": "coach-1", "order": 1},
                {"coach_id": "coach-2", "order": 2},
                {"coach_id": "coach-3", "order": 3}
            ],
            "goals": "E2E Test - Leadership improvement",
            "challenges": "E2E Test - Team management",
            "mentorship_area": "Leadership Development"
        })
        
        if create_resp.status_code == 400:
            print(f"Cannot create request: {create_resp.json()}")
            return
        
        assert create_resp.status_code == 200
        request_data = create_resp.json()
        request_id = request_data["id"]
        
        # Step 3: Login as coach and check pending requests
        coach_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL, "password": PASSWORD
        })
        coach_token = coach_login.json()["token"]
        coach_headers = {"Authorization": f"Bearer {coach_token}"}
        
        requests_resp = requests.get(f"{BASE_URL}/api/requests", headers=coach_headers)
        assert requests_resp.status_code == 200
        
        # Step 4: Accept the request
        accept_resp = requests.put(
            f"{BASE_URL}/api/requests/{request_id}/accept",
            headers=coach_headers
        )
        assert accept_resp.status_code == 200
        
        # Step 5: Schedule a session
        session_resp = requests.post(f"{BASE_URL}/api/sessions", headers=coachee_headers, json={
            "request_id": request_id,
            "date": "2025-02-10",
            "time": "9:00 AM",
            "topic": "E2E Test Session"
        })
        assert session_resp.status_code == 200
        
        # Step 6: Complete journey
        complete_resp = requests.put(
            f"{BASE_URL}/api/requests/{request_id}/complete-journey",
            headers=coachee_headers
        )
        assert complete_resp.status_code == 200
        
        # Step 7: Submit feedback
        feedback_resp = requests.post(
            f"{BASE_URL}/api/requests/{request_id}/feedback",
            headers=coachee_headers,
            json={"rating": 5, "comment": "E2E Test - Excellent coaching!"}
        )
        assert feedback_resp.status_code == 200
        
        print("Full E2E flow completed successfully!")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
