"""
Profile Edit Feature Tests - Iteration 8
Tests for PUT /api/auth/profile and POST /api/auth/avatar endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
COACH_EMAIL = "fatema@elevate.com"
COACHEE_EMAIL = "sarah@elevate.com"
ADMIN_EMAIL = "admin@elevate.com"
PASSWORD = "password123"


class TestLogin:
    """Test login functionality for all roles"""
    
    def test_coach_login(self):
        """Test coach can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Coach login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "coach"
        assert data["user"]["email"] == COACH_EMAIL
        print(f"PASS: Coach login successful - {data['user']['name']}")
    
    def test_coachee_login(self):
        """Test coachee can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Coachee login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "coachee"
        assert data["user"]["email"] == COACHEE_EMAIL
        print(f"PASS: Coachee login successful - {data['user']['name']}")
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"PASS: Admin login successful - {data['user']['name']}")


@pytest.fixture
def coach_token():
    """Get coach auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_EMAIL,
        "password": PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Coach login failed")
    return response.json()["token"]


@pytest.fixture
def coachee_token():
    """Get coachee auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACHEE_EMAIL,
        "password": PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Coachee login failed")
    return response.json()["token"]


@pytest.fixture
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Admin login failed")
    return response.json()["token"]


class TestCoachProfileUpdate:
    """Test coach profile update - allowed fields: title, location, experience, about, expertise, domains, certifications"""
    
    def test_coach_update_title(self, coach_token):
        """Coach can update title"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"title": "TEST_Executive Leadership Coach"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Executive Leadership Coach"
        print("PASS: Coach can update title")
    
    def test_coach_update_location(self, coach_token):
        """Coach can update location"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"location": "TEST_Mumbai, India"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["location"] == "TEST_Mumbai, India"
        print("PASS: Coach can update location")
    
    def test_coach_update_experience(self, coach_token):
        """Coach can update experience"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"experience": "TEST_20+ years"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["experience"] == "TEST_20+ years"
        print("PASS: Coach can update experience")
    
    def test_coach_update_about(self, coach_token):
        """Coach can update about"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"about": "TEST_Experienced coach specializing in leadership development"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["about"] == "TEST_Experienced coach specializing in leadership development"
        print("PASS: Coach can update about")
    
    def test_coach_update_expertise_tags(self, coach_token):
        """Coach can update expertise tags (array)"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"expertise": ["TEST_Leadership", "TEST_Communication", "TEST_Strategy"]}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "TEST_Leadership" in data.get("expertise", [])
        print("PASS: Coach can update expertise tags")
    
    def test_coach_update_domains_tags(self, coach_token):
        """Coach can update domains tags (array)"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"domains": ["TEST_Finance", "TEST_Technology"]}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "TEST_Finance" in data.get("domains", [])
        print("PASS: Coach can update domains tags")
    
    def test_coach_update_certifications_tags(self, coach_token):
        """Coach can update certifications tags (array)"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"certifications": ["TEST_ICF PCC", "TEST_EMCC"]}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "TEST_ICF PCC" in data.get("certifications", [])
        print("PASS: Coach can update certifications tags")
    
    def test_coach_cannot_update_coachee_fields(self, coach_token):
        """Coach cannot update coachee-specific fields"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"job_title": "TEST_Should Not Work", "department": "TEST_Should Not Work"}
        )
        # Should return 400 because no valid fields to update
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Coach cannot update coachee-specific fields")


class TestCoacheeProfileUpdate:
    """Test coachee profile update - allowed fields: job_title, department, tier, designation, location, business_unit, competency, date_of_joining, enrolment_type, reason_for_enrolment"""
    
    def test_coachee_update_job_title(self, coachee_token):
        """Coachee can update job_title"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"job_title": "TEST_Senior Manager"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["job_title"] == "TEST_Senior Manager"
        print("PASS: Coachee can update job_title")
    
    def test_coachee_update_department(self, coachee_token):
        """Coachee can update department"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"department": "TEST_Audit & Assurance"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["department"] == "TEST_Audit & Assurance"
        print("PASS: Coachee can update department")
    
    def test_coachee_update_tier(self, coachee_token):
        """Coachee can update tier"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"tier": "T2"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["tier"] == "T2"
        print("PASS: Coachee can update tier")
    
    def test_coachee_update_designation(self, coachee_token):
        """Coachee can update designation"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"designation": "TEST_Manager"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["designation"] == "TEST_Manager"
        print("PASS: Coachee can update designation")
    
    def test_coachee_update_location(self, coachee_token):
        """Coachee can update location"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"location": "DEL"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["location"] == "DEL"
        print("PASS: Coachee can update location")
    
    def test_coachee_update_business_unit(self, coachee_token):
        """Coachee can update business_unit"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"business_unit": "TEST_Advisory"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["business_unit"] == "TEST_Advisory"
        print("PASS: Coachee can update business_unit")
    
    def test_coachee_update_competency(self, coachee_token):
        """Coachee can update competency"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"competency": "TEST_Risk Advisory"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["competency"] == "TEST_Risk Advisory"
        print("PASS: Coachee can update competency")
    
    def test_coachee_update_date_of_joining(self, coachee_token):
        """Coachee can update date_of_joining"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"date_of_joining": "2024-01-15"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["date_of_joining"] == "2024-01-15"
        print("PASS: Coachee can update date_of_joining")
    
    def test_coachee_update_enrolment_type(self, coachee_token):
        """Coachee can update enrolment_type"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"enrolment_type": "Coach-nominated"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["enrolment_type"] == "Coach-nominated"
        print("PASS: Coachee can update enrolment_type")
    
    def test_coachee_update_reason_for_enrolment(self, coachee_token):
        """Coachee can update reason_for_enrolment"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"reason_for_enrolment": "TEST_Career growth and leadership development"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["reason_for_enrolment"] == "TEST_Career growth and leadership development"
        print("PASS: Coachee can update reason_for_enrolment")
    
    def test_coachee_cannot_update_coach_fields(self, coachee_token):
        """Coachee cannot update coach-specific fields"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"title": "TEST_Should Not Work", "experience": "TEST_Should Not Work"}
        )
        # Should return 400 because no valid fields to update
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Coachee cannot update coach-specific fields")


class TestAdminProfileUpdate:
    """Test admin profile update - only avatar allowed"""
    
    def test_admin_cannot_update_coach_fields(self, admin_token):
        """Admin cannot update coach-specific fields"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"title": "TEST_Should Not Work", "experience": "TEST_Should Not Work"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Admin cannot update coach-specific fields")
    
    def test_admin_cannot_update_coachee_fields(self, admin_token):
        """Admin cannot update coachee-specific fields"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"job_title": "TEST_Should Not Work", "department": "TEST_Should Not Work"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("PASS: Admin cannot update coachee-specific fields")


class TestAvatarUpload:
    """Test avatar upload endpoint POST /api/auth/avatar"""
    
    def test_avatar_upload_requires_auth(self):
        """Avatar upload requires authentication"""
        # Create a simple test image
        import io
        image_data = io.BytesIO(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)
        response = requests.post(
            f"{BASE_URL}/api/auth/avatar",
            files={"file": ("test.png", image_data, "image/png")}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Avatar upload requires authentication")
    
    def test_avatar_upload_rejects_non_image(self, coach_token):
        """Avatar upload rejects non-image files"""
        import io
        text_data = io.BytesIO(b'This is not an image')
        response = requests.post(
            f"{BASE_URL}/api/auth/avatar",
            headers={"Authorization": f"Bearer {coach_token}"},
            files={"file": ("test.txt", text_data, "text/plain")}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Avatar upload rejects non-image files")


class TestProfileUpdateValidation:
    """Test profile update validation"""
    
    def test_profile_update_requires_auth(self):
        """Profile update requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            json={"title": "TEST_Should Not Work"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Profile update requires authentication")
    
    def test_profile_update_empty_body_rejected(self, coach_token):
        """Profile update with empty body is rejected"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Profile update with empty body is rejected")


class TestGetMe:
    """Test GET /api/auth/me endpoint returns updated profile"""
    
    def test_get_me_returns_updated_coach_profile(self, coach_token):
        """GET /me returns updated coach profile after update"""
        # First update
        update_response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={"about": "TEST_Updated about section for verification"}
        )
        assert update_response.status_code == 200
        
        # Then verify via GET /me
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {coach_token}"}
        )
        assert me_response.status_code == 200
        data = me_response.json()
        assert data["about"] == "TEST_Updated about section for verification"
        print("PASS: GET /me returns updated coach profile")
    
    def test_get_me_returns_updated_coachee_profile(self, coachee_token):
        """GET /me returns updated coachee profile after update"""
        # First update
        update_response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {coachee_token}"},
            json={"competency": "TEST_Updated competency for verification"}
        )
        assert update_response.status_code == 200
        
        # Then verify via GET /me
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {coachee_token}"}
        )
        assert me_response.status_code == 200
        data = me_response.json()
        assert data["competency"] == "TEST_Updated competency for verification"
        print("PASS: GET /me returns updated coachee profile")
