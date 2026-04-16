"""
Iteration 7 Backend Tests
Tests for:
1. Registration form (POST /api/registrations) - creates pending registration, prevents duplicates
2. Registration listing (GET /api/registrations) - admin only
3. Registration approval (PUT /api/registrations/{id}/approve) - creates user account
4. Registration rejection (PUT /api/registrations/{id}/reject) - marks rejected
5. Session notes (POST/GET /api/sessions/{id}/notes) - only for completed sessions
6. Public stats (GET /api/public/stats) - no auth required
7. Admin MIS (GET /api/admin/mis) - coach occupancy, coachee status, location/BU distribution
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@elevate.com"
ADMIN_PASSWORD = "password123"
COACH_EMAIL = "fatema@elevate.com"
COACH_PASSWORD = "password123"
COACHEE_EMAIL = "sarah@elevate.com"
COACHEE_PASSWORD = "password123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def coach_token():
    """Get coach auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_EMAIL,
        "password": COACH_PASSWORD
    })
    assert response.status_code == 200, f"Coach login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def coachee_token():
    """Get coachee auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACHEE_EMAIL,
        "password": COACHEE_PASSWORD
    })
    assert response.status_code == 200, f"Coachee login failed: {response.text}"
    return response.json()["token"]


class TestPublicStats:
    """Test GET /api/public/stats - no auth required"""
    
    def test_public_stats_no_auth(self):
        """Public stats should work without authentication"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200
        data = response.json()
        assert "coaches" in data
        assert "coachees" in data
        assert "sessions_completed" in data
        assert isinstance(data["coaches"], int)
        assert isinstance(data["coachees"], int)
        assert isinstance(data["sessions_completed"], int)
        print(f"Public stats: {data}")
    
    def test_public_stats_values(self):
        """Verify public stats have expected values from seed data"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        data = response.json()
        # From seed: 6 coaches, 2 coachees, 6 completed sessions
        assert data["coaches"] >= 6, "Should have at least 6 coaches"
        assert data["coachees"] >= 2, "Should have at least 2 coachees"
        assert data["sessions_completed"] >= 6, "Should have at least 6 completed sessions"


class TestRegistrationSubmission:
    """Test POST /api/registrations - no auth required"""
    
    def test_submit_coachee_registration(self):
        """Submit a coachee registration"""
        unique_email = f"test_coachee_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "role": "coachee",
            "name": "Test Coachee User",
            "email": unique_email,
            "date_of_joining": "2024-01-15",
            "tier": "T2",
            "designation": "Manager",
            "location": "MUM",
            "business_unit": "Audit & Assurance",
            "competency": "External Audit",
            "co_supercoach": "John Doe",
            "enrolment_type": "Self-nomination",
            "reason_for_enrolment": "To develop leadership skills"
        }
        response = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "message" in data
        print(f"Coachee registration created: {data['id']}")
        return data["id"]
    
    def test_submit_coach_registration(self):
        """Submit a coach registration"""
        unique_email = f"test_coach_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "role": "coach",
            "name": "Test Coach User",
            "email": unique_email,
            "date_of_joining": "2020-06-01",
            "tier": "T4",
            "designation": "Senior Manager",
            "location": "DEL",
            "business_unit": "Advisory",
            "nominated_coachees": []
        }
        response = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"Coach registration created: {data['id']}")
    
    def test_submit_coach_with_nominations(self):
        """Submit a coach registration with coachee nominations"""
        unique_email = f"test_coach_nom_{uuid.uuid4().hex[:8]}@test.com"
        nominee_email = f"test_nominee_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "role": "coach",
            "name": "Test Coach With Nominees",
            "email": unique_email,
            "designation": "Director",
            "location": "BLR",
            "business_unit": "Tax",
            "nominated_coachees": [
                {"name": "Nominated Coachee 1", "email": nominee_email}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"Coach with nominations created: {data['id']}")
    
    def test_duplicate_email_rejected(self):
        """Duplicate email should be rejected"""
        # First registration
        unique_email = f"test_dup_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "role": "coachee",
            "name": "First User",
            "email": unique_email,
            "designation": "Manager",
            "location": "MUM",
            "business_unit": "Audit & Assurance",
            "reason_for_enrolment": "Test"
        }
        response1 = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert response1.status_code == 200
        
        # Duplicate registration
        payload["name"] = "Second User"
        response2 = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert response2.status_code == 400, "Duplicate email should be rejected"
        print("Duplicate email correctly rejected")
    
    def test_existing_user_email_rejected(self):
        """Registration with existing user email should be rejected"""
        payload = {
            "role": "coachee",
            "name": "Fake Sarah",
            "email": COACHEE_EMAIL,  # Already exists
            "designation": "Manager",
            "location": "MUM",
            "business_unit": "Audit & Assurance",
            "reason_for_enrolment": "Test"
        }
        response = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert response.status_code == 400, "Existing user email should be rejected"
        print("Existing user email correctly rejected")


class TestRegistrationListing:
    """Test GET /api/registrations - admin only"""
    
    def test_list_registrations_admin(self, admin_token):
        """Admin can list registrations"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/registrations?status=all", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin can see {len(data)} registrations")
    
    def test_list_registrations_pending(self, admin_token):
        """Admin can filter pending registrations"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/registrations?status=pending", headers=headers)
        assert response.status_code == 200
        data = response.json()
        for reg in data:
            assert reg["status"] == "pending"
        print(f"Found {len(data)} pending registrations")
    
    def test_list_registrations_coach_forbidden(self, coach_token):
        """Coach cannot list registrations"""
        headers = {"Authorization": f"Bearer {coach_token}"}
        response = requests.get(f"{BASE_URL}/api/registrations", headers=headers)
        assert response.status_code == 403
        print("Coach correctly forbidden from listing registrations")
    
    def test_list_registrations_coachee_forbidden(self, coachee_token):
        """Coachee cannot list registrations"""
        headers = {"Authorization": f"Bearer {coachee_token}"}
        response = requests.get(f"{BASE_URL}/api/registrations", headers=headers)
        assert response.status_code == 403
        print("Coachee correctly forbidden from listing registrations")


class TestRegistrationApproval:
    """Test PUT /api/registrations/{id}/approve"""
    
    def test_approve_registration(self, admin_token):
        """Admin can approve a registration"""
        # First create a registration
        unique_email = f"test_approve_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "role": "coachee",
            "name": "Approval Test User",
            "email": unique_email,
            "designation": "Manager",
            "location": "MUM",
            "business_unit": "Audit & Assurance",
            "reason_for_enrolment": "Test approval"
        }
        create_resp = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["id"]
        
        # Approve it
        headers = {"Authorization": f"Bearer {admin_token}"}
        approve_resp = requests.put(f"{BASE_URL}/api/registrations/{reg_id}/approve", headers=headers)
        assert approve_resp.status_code == 200, f"Approval failed: {approve_resp.text}"
        data = approve_resp.json()
        assert "message" in data
        print(f"Registration approved: {data['message']}")
        
        # Verify user was created by trying to login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "password123"  # Default password
        })
        assert login_resp.status_code == 200, "Approved user should be able to login"
        print("Approved user can login successfully")
    
    def test_approve_nonexistent_registration(self, admin_token):
        """Approving nonexistent registration returns 404"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(f"{BASE_URL}/api/registrations/nonexistent-id/approve", headers=headers)
        assert response.status_code == 404
        print("Nonexistent registration correctly returns 404")
    
    def test_approve_coach_forbidden(self, coach_token):
        """Coach cannot approve registrations"""
        headers = {"Authorization": f"Bearer {coach_token}"}
        response = requests.put(f"{BASE_URL}/api/registrations/any-id/approve", headers=headers)
        assert response.status_code == 403
        print("Coach correctly forbidden from approving")


class TestRegistrationRejection:
    """Test PUT /api/registrations/{id}/reject"""
    
    def test_reject_registration(self, admin_token):
        """Admin can reject a registration"""
        # First create a registration
        unique_email = f"test_reject_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "role": "coachee",
            "name": "Rejection Test User",
            "email": unique_email,
            "designation": "Manager",
            "location": "MUM",
            "business_unit": "Audit & Assurance",
            "reason_for_enrolment": "Test rejection"
        }
        create_resp = requests.post(f"{BASE_URL}/api/registrations", json=payload)
        assert create_resp.status_code == 200
        reg_id = create_resp.json()["id"]
        
        # Reject it
        headers = {"Authorization": f"Bearer {admin_token}"}
        reject_resp = requests.put(f"{BASE_URL}/api/registrations/{reg_id}/reject", headers=headers)
        assert reject_resp.status_code == 200, f"Rejection failed: {reject_resp.text}"
        data = reject_resp.json()
        assert "message" in data
        print(f"Registration rejected: {data['message']}")
    
    def test_reject_nonexistent_registration(self, admin_token):
        """Rejecting nonexistent registration returns 404"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(f"{BASE_URL}/api/registrations/nonexistent-id/reject", headers=headers)
        assert response.status_code == 404
        print("Nonexistent registration correctly returns 404")


class TestSessionNotes:
    """Test POST/GET /api/sessions/{id}/notes"""
    
    def test_add_note_to_completed_session(self, coachee_token):
        """Can add note to completed session"""
        # Sarah has completed sessions from past journey (past-session-0 to past-session-5)
        session_id = "past-session-0"
        headers = {"Authorization": f"Bearer {coachee_token}"}
        payload = {"content": "This was a great session! Learned a lot about goal setting."}
        
        response = requests.post(f"{BASE_URL}/api/sessions/{session_id}/notes", json=payload, headers=headers)
        assert response.status_code == 200, f"Add note failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["content"] == payload["content"]
        assert data["user_name"] == "Sarah Johnson"
        assert data["user_role"] == "coachee"
        print(f"Note added successfully: {data['id']}")
    
    def test_get_session_notes(self, coachee_token):
        """Can get notes for a session"""
        session_id = "past-session-0"
        headers = {"Authorization": f"Bearer {coachee_token}"}
        
        response = requests.get(f"{BASE_URL}/api/sessions/{session_id}/notes", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} notes for session")
    
    def test_add_note_to_nonexistent_session(self, coachee_token):
        """Adding note to nonexistent session returns 404"""
        headers = {"Authorization": f"Bearer {coachee_token}"}
        payload = {"content": "Test note"}
        
        response = requests.post(f"{BASE_URL}/api/sessions/nonexistent-session/notes", json=payload, headers=headers)
        assert response.status_code == 404
        print("Nonexistent session correctly returns 404")
    
    def test_coach_can_add_note(self):
        """Coach can add note to their completed session"""
        # Login as Gaurav (coach-3) who has the past sessions with Sarah
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "gaurav@elevate.com",
            "password": "password123"
        })
        assert login_resp.status_code == 200
        coach_token = login_resp.json()["token"]
        
        session_id = "past-session-1"
        headers = {"Authorization": f"Bearer {coach_token}"}
        payload = {"content": "Great progress on stakeholder mapping!"}
        
        response = requests.post(f"{BASE_URL}/api/sessions/{session_id}/notes", json=payload, headers=headers)
        assert response.status_code == 200, f"Coach add note failed: {response.text}"
        data = response.json()
        assert data["user_role"] == "coach"
        print("Coach can add notes to their sessions")


class TestSessionNotesRestrictions:
    """Test session notes restrictions"""
    
    def test_cannot_add_note_to_upcoming_session(self, coachee_token):
        """Cannot add note to non-completed session"""
        # First, we need to find or create an upcoming session
        # For now, let's test with a session that doesn't exist or isn't completed
        headers = {"Authorization": f"Bearer {coachee_token}"}
        
        # Get sessions to find an upcoming one
        sessions_resp = requests.get(f"{BASE_URL}/api/sessions", headers=headers)
        if sessions_resp.status_code == 200:
            sessions = sessions_resp.json()
            upcoming = [s for s in sessions if s.get("status") == "upcoming"]
            if upcoming:
                session_id = upcoming[0]["id"]
                payload = {"content": "Test note on upcoming session"}
                response = requests.post(f"{BASE_URL}/api/sessions/{session_id}/notes", json=payload, headers=headers)
                assert response.status_code == 400, "Should not allow notes on upcoming sessions"
                print("Correctly blocked notes on upcoming session")
            else:
                print("No upcoming sessions to test - skipping")
        else:
            print("Could not get sessions - skipping upcoming session test")
    
    def test_unauthorized_user_cannot_add_note(self, coach_token):
        """User not part of session cannot add note"""
        # Fatema (coach-1) is not part of Sarah's past sessions with Gaurav
        session_id = "past-session-0"
        headers = {"Authorization": f"Bearer {coach_token}"}
        payload = {"content": "Unauthorized note attempt"}
        
        response = requests.post(f"{BASE_URL}/api/sessions/{session_id}/notes", json=payload, headers=headers)
        assert response.status_code == 403, "Unauthorized user should be blocked"
        print("Unauthorized user correctly blocked from adding notes")


class TestAdminMIS:
    """Test GET /api/admin/mis"""
    
    def test_mis_returns_all_fields(self, admin_token):
        """MIS endpoint returns all required fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/mis", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check all required fields
        assert "coach_occupancy" in data
        assert "coachee_statuses" in data
        assert "location_distribution" in data
        assert "business_unit_distribution" in data
        assert "nomination_breakdown" in data
        print("MIS endpoint returns all required fields")
    
    def test_coach_occupancy_structure(self, admin_token):
        """Coach occupancy has correct structure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/mis", headers=headers)
        data = response.json()
        
        assert len(data["coach_occupancy"]) >= 6, "Should have at least 6 coaches"
        for coach in data["coach_occupancy"]:
            assert "id" in coach
            assert "name" in coach
            assert "capacity" in coach
            assert "assigned" in coach
            assert "remaining" in coach
            assert isinstance(coach["capacity"], int)
            assert isinstance(coach["assigned"], int)
            assert isinstance(coach["remaining"], int)
        print(f"Coach occupancy has {len(data['coach_occupancy'])} coaches with correct structure")
    
    def test_coachee_statuses_structure(self, admin_token):
        """Coachee statuses has correct structure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/mis", headers=headers)
        data = response.json()
        
        assert len(data["coachee_statuses"]) >= 2, "Should have at least 2 coachees"
        for coachee in data["coachee_statuses"]:
            assert "id" in coachee
            assert "name" in coachee
            assert "coaching_status" in coachee
            assert "sessions_completed" in coachee
        print(f"Coachee statuses has {len(data['coachee_statuses'])} coachees with correct structure")
    
    def test_location_distribution(self, admin_token):
        """Location distribution has correct structure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/mis", headers=headers)
        data = response.json()
        
        for loc in data["location_distribution"]:
            assert "location" in loc
            assert "coaches" in loc
            assert "coachees" in loc
        print(f"Location distribution has {len(data['location_distribution'])} locations")
    
    def test_business_unit_distribution(self, admin_token):
        """Business unit distribution has correct structure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/mis", headers=headers)
        data = response.json()
        
        for bu in data["business_unit_distribution"]:
            assert "name" in bu
            assert "value" in bu
        print(f"BU distribution has {len(data['business_unit_distribution'])} units")
    
    def test_mis_coach_forbidden(self, coach_token):
        """Coach cannot access MIS"""
        headers = {"Authorization": f"Bearer {coach_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/mis", headers=headers)
        assert response.status_code == 403
        print("Coach correctly forbidden from MIS")
    
    def test_mis_coachee_forbidden(self, coachee_token):
        """Coachee cannot access MIS"""
        headers = {"Authorization": f"Bearer {coachee_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/mis", headers=headers)
        assert response.status_code == 403
        print("Coachee correctly forbidden from MIS")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
