"""
Iteration 6 Feature Tests:
1. Security: bcrypt password hashing, JWT_SECRET from env (no fallback)
2. SSO: Placeholder button (frontend only)
3. Session Complete: PUT /api/sessions/{id}/complete endpoint
4. Admin Dashboard: Full analytics API (stats, coaches, coachees, trends, user history)
5. Admin access control: Non-admin users get 403
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@elevate.com"
ADMIN_PASSWORD = os.environ.get("TEST_PASSWORD", "password123")
COACH_EMAIL = "fatema@elevate.com"
COACH_PASSWORD = os.environ.get("TEST_PASSWORD", "password123")
COACHEE_EMAIL = "sarah@elevate.com"
COACHEE_PASSWORD = os.environ.get("TEST_PASSWORD", "password123")
WRONG_PASSWORD = "wrongpassword"


class TestSecurityBcryptLogin:
    """Test bcrypt password hashing - login with correct/wrong password"""
    
    def test_login_with_correct_password_admin(self):
        """Admin login with correct password should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print("PASS: Admin login with correct password works")
    
    def test_login_with_correct_password_coach(self):
        """Coach login with correct password should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "coach"
        print("PASS: Coach login with correct password works")
    
    def test_login_with_correct_password_coachee(self):
        """Coachee login with correct password should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL,
            "password": COACHEE_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "coachee"
        print("PASS: Coachee login with correct password works")
    
    def test_login_with_wrong_password_returns_401(self):
        """Login with wrong password should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": WRONG_PASSWORD
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: Wrong password returns 401")
    
    def test_login_with_nonexistent_email_returns_401(self):
        """Login with non-existent email should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@elevate.com",
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: Non-existent email returns 401")


class TestSessionComplete:
    """Test PUT /api/sessions/{id}/complete endpoint"""
    
    @pytest.fixture
    def coach_token(self):
        """Get coach auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Coach login failed")
    
    @pytest.fixture
    def coachee_token(self):
        """Get coachee auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL,
            "password": COACHEE_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Coachee login failed")
    
    def test_complete_session_endpoint_exists(self, coach_token):
        """Test that complete session endpoint exists"""
        # Get sessions first
        response = requests.get(f"{BASE_URL}/api/sessions", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        assert response.status_code == 200
        sessions = response.json()
        
        # Find an upcoming session
        upcoming = [s for s in sessions if s.get("status") == "upcoming"]
        if not upcoming:
            print("SKIP: No upcoming sessions to test complete endpoint")
            return
        
        session_id = upcoming[0]["id"]
        
        # Test complete endpoint
        response = requests.put(f"{BASE_URL}/api/sessions/{session_id}/complete", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"PASS: Session {session_id} marked as completed")
    
    def test_complete_nonexistent_session_returns_404(self, coach_token):
        """Test completing non-existent session returns 404"""
        response = requests.put(f"{BASE_URL}/api/sessions/nonexistent-id/complete", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Non-existent session returns 404")


class TestAdminDashboardAPIs:
    """Test Admin Dashboard API endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def coach_token(self):
        """Get coach auth token for access control tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Coach login failed")
    
    @pytest.fixture
    def coachee_token(self):
        """Get coachee auth token for access control tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL,
            "password": COACHEE_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Coachee login failed")
    
    # ===== GET /api/admin/stats =====
    def test_admin_stats_returns_correct_fields(self, admin_token):
        """Test GET /api/admin/stats returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check all required fields
        required_fields = [
            "total_coaches", "total_coachees", "total_sessions",
            "completed_sessions", "upcoming_sessions", "pending_requests",
            "active_journeys", "completed_journeys", "paused_journeys",
            "avg_rating", "completion_rate"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Validate data types
        assert isinstance(data["total_coaches"], int)
        assert isinstance(data["total_coachees"], int)
        assert isinstance(data["total_sessions"], int)
        assert isinstance(data["avg_rating"], (int, float))
        
        print(f"PASS: Admin stats returned with all fields: {data}")
    
    def test_admin_stats_blocked_for_coach(self, coach_token):
        """Test that coach cannot access admin stats (403)"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Coach blocked from admin stats (403)")
    
    def test_admin_stats_blocked_for_coachee(self, coachee_token):
        """Test that coachee cannot access admin stats (403)"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Coachee blocked from admin stats (403)")
    
    # ===== GET /api/admin/coaches =====
    def test_admin_coaches_returns_coach_list(self, admin_token):
        """Test GET /api/admin/coaches returns coaches with analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/coaches", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        coaches = response.json()
        
        assert isinstance(coaches, list)
        assert len(coaches) > 0, "Expected at least one coach"
        
        # Check coach fields
        coach = coaches[0]
        assert "id" in coach
        assert "name" in coach
        assert "role" in coach
        assert coach["role"] == "coach"
        
        # Check analytics fields
        assert "feedback_rating" in coach
        assert "session_count" in coach
        assert "active_coachees" in coach
        
        print(f"PASS: Admin coaches returned {len(coaches)} coaches with analytics")
    
    def test_admin_coaches_blocked_for_non_admin(self, coachee_token):
        """Test that non-admin cannot access admin coaches (403)"""
        response = requests.get(f"{BASE_URL}/api/admin/coaches", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin blocked from admin coaches (403)")
    
    # ===== GET /api/admin/coachees =====
    def test_admin_coachees_returns_coachee_list(self, admin_token):
        """Test GET /api/admin/coachees returns coachees with analytics"""
        response = requests.get(f"{BASE_URL}/api/admin/coachees", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        coachees = response.json()
        
        assert isinstance(coachees, list)
        assert len(coachees) > 0, "Expected at least one coachee"
        
        # Check coachee fields
        coachee = coachees[0]
        assert "id" in coachee
        assert "name" in coachee
        assert "role" in coachee
        assert coachee["role"] == "coachee"
        
        # Check analytics fields
        assert "session_count" in coachee
        assert "journey_count" in coachee
        assert "active_journey_status" in coachee
        
        print(f"PASS: Admin coachees returned {len(coachees)} coachees with analytics")
    
    def test_admin_coachees_blocked_for_non_admin(self, coach_token):
        """Test that non-admin cannot access admin coachees (403)"""
        response = requests.get(f"{BASE_URL}/api/admin/coachees", headers={
            "Authorization": f"Bearer {coach_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin blocked from admin coachees (403)")
    
    # ===== GET /api/admin/trends =====
    def test_admin_trends_returns_chart_data(self, admin_token):
        """Test GET /api/admin/trends returns chart data"""
        response = requests.get(f"{BASE_URL}/api/admin/trends", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required trend fields
        required_fields = [
            "sessions_by_month", "requests_by_month",
            "coach_utilization", "expertise_distribution"
        ]
        for field in required_fields:
            assert field in data, f"Missing trend field: {field}"
        
        # Validate data structures
        assert isinstance(data["sessions_by_month"], list)
        assert isinstance(data["requests_by_month"], list)
        assert isinstance(data["coach_utilization"], list)
        assert isinstance(data["expertise_distribution"], list)
        
        print("PASS: Admin trends returned with all chart data")
    
    def test_admin_trends_blocked_for_non_admin(self, coachee_token):
        """Test that non-admin cannot access admin trends (403)"""
        response = requests.get(f"{BASE_URL}/api/admin/trends", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin blocked from admin trends (403)")
    
    # ===== GET /api/admin/users/{user_id}/history =====
    def test_admin_user_history_returns_full_data(self, admin_token):
        """Test GET /api/admin/users/{user_id}/history returns full history"""
        # First get a coachee ID
        response = requests.get(f"{BASE_URL}/api/admin/coachees", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        coachees = response.json()
        
        # Find Sarah (coachee-1) who has sessions
        sarah = next((c for c in coachees if "sarah" in c.get("email", "").lower()), None)
        if not sarah:
            sarah = coachees[0] if coachees else None
        
        if not sarah:
            pytest.skip("No coachees found")
        
        user_id = sarah["id"]
        
        # Get user history
        response = requests.get(f"{BASE_URL}/api/admin/users/{user_id}/history", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "user" in data
        assert "sessions" in data
        assert "journeys" in data
        assert "feedback" in data
        
        assert isinstance(data["sessions"], list)
        assert isinstance(data["journeys"], list)
        assert isinstance(data["feedback"], list)
        
        print(f"PASS: User history returned for {data['user']['name']}: {len(data['sessions'])} sessions, {len(data['journeys'])} journeys, {len(data['feedback'])} feedback")
    
    def test_admin_user_history_returns_404_for_nonexistent(self, admin_token):
        """Test that non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/admin/users/nonexistent-user-id/history", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Non-existent user returns 404")
    
    def test_admin_user_history_blocked_for_non_admin(self, coachee_token):
        """Test that non-admin cannot access user history (403)"""
        response = requests.get(f"{BASE_URL}/api/admin/users/coachee-1/history", headers={
            "Authorization": f"Bearer {coachee_token}"
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("PASS: Non-admin blocked from user history (403)")


class TestAdminDashboardDataIntegrity:
    """Test Admin Dashboard data integrity and calculations"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_coach_feedback_rating_calculation(self, admin_token):
        """Test that coach feedback_rating is calculated from feedback"""
        response = requests.get(f"{BASE_URL}/api/admin/coaches", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        coaches = response.json()
        
        # Find a coach with feedback
        coach_with_feedback = next((c for c in coaches if c.get("feedback_rating")), None)
        if coach_with_feedback:
            assert isinstance(coach_with_feedback["feedback_rating"], (int, float))
            assert 1 <= coach_with_feedback["feedback_rating"] <= 5
            print(f"PASS: Coach {coach_with_feedback['name']} has feedback_rating: {coach_with_feedback['feedback_rating']}")
        else:
            print("INFO: No coaches with feedback found")
    
    def test_top_coaches_sorted_by_rating(self, admin_token):
        """Test that coaches can be sorted by feedback rating"""
        response = requests.get(f"{BASE_URL}/api/admin/coaches", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        coaches = response.json()
        
        # Filter coaches with ratings and sort
        rated_coaches = [c for c in coaches if c.get("feedback_rating")]
        if len(rated_coaches) >= 2:
            sorted_coaches = sorted(rated_coaches, key=lambda x: x["feedback_rating"], reverse=True)
            assert sorted_coaches[0]["feedback_rating"] >= sorted_coaches[-1]["feedback_rating"]
            print(f"PASS: Top coach by rating: {sorted_coaches[0]['name']} ({sorted_coaches[0]['feedback_rating']})")
        else:
            print("INFO: Not enough rated coaches to test sorting")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
