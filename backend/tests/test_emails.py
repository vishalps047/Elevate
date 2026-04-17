"""
Backend tests for Email feature - ELEVATE Platform
Tests: GET /api/emails, PUT /api/emails/{id}/read, PUT /api/emails/read-all
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials with new @in.gt.com domain
COACH_EMAIL = "fatema.hunaid@in.gt.com"
COACHEE_EMAIL = "sarah.johnson@in.gt.com"
ADMIN_EMAIL = "admin@in.gt.com"
PASSWORD = "password123"

# Additional coachees
COACHEE_PRIYA = "priya.sharma@in.gt.com"
COACHEE_ROHAN = "rohan.mehta@in.gt.com"
COACHEE_ANANYA = "ananya.reddy@in.gt.com"
COACHEE_VIKRAM = "vikram.singh@in.gt.com"
COACHEE_ALEX = "alex.morgan@in.gt.com"


class TestLogin:
    """Test login with new @in.gt.com emails"""
    
    def test_coach_login(self):
        """Coach login with fatema.hunaid@in.gt.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Coach login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == COACH_EMAIL
        assert data["user"]["role"] == "coach"
        print(f"PASS: Coach login with {COACH_EMAIL}")
    
    def test_coachee_login(self):
        """Coachee login with sarah.johnson@in.gt.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACHEE_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Coachee login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == COACHEE_EMAIL
        assert data["user"]["role"] == "coachee"
        print(f"PASS: Coachee login with {COACHEE_EMAIL}")
    
    def test_admin_login(self):
        """Admin login with admin@in.gt.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"PASS: Admin login with {ADMIN_EMAIL}")
    
    def test_additional_coachees_login(self):
        """Test login for all 6 coachees"""
        coachees = [COACHEE_EMAIL, COACHEE_ALEX, COACHEE_PRIYA, COACHEE_ROHAN, COACHEE_ANANYA, COACHEE_VIKRAM]
        for email in coachees:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": PASSWORD
            })
            assert response.status_code == 200, f"Login failed for {email}: {response.text}"
            data = response.json()
            assert data["user"]["role"] == "coachee"
            print(f"PASS: Coachee login with {email}")


@pytest.fixture
def coach_token():
    """Get coach auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Coach login failed")


@pytest.fixture
def coachee_token():
    """Get coachee auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACHEE_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Coachee login failed")


@pytest.fixture
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Admin login failed")


def get_token_for_email(email):
    """Helper to get token for any user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    return None


class TestEmailsAPI:
    """Test GET /api/emails endpoint"""
    
    def test_emails_requires_auth(self):
        """GET /api/emails requires authentication"""
        response = requests.get(f"{BASE_URL}/api/emails")
        assert response.status_code == 401
        print("PASS: GET /api/emails requires auth")
    
    def test_coach_gets_coach_emails(self, coach_token):
        """Coach (Fatema) gets coach-specific emails"""
        headers = {"Authorization": f"Bearer {coach_token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        assert isinstance(emails, list)
        assert len(emails) > 0, "Coach should have emails"
        
        # Verify emails are for coach
        for email in emails:
            assert "id" in email
            assert "subject" in email
            assert "body" in email
            assert "from_email" in email
            assert "to_email" in email
            assert "read" in email
            assert "created_at" in email
        
        # Check for coach-specific email subjects
        subjects = [e["subject"] for e in emails]
        coach_subjects = ["Availability requested", "Guidelines for coach", "Coach reminder"]
        has_coach_email = any(any(cs in s for cs in coach_subjects) for s in subjects)
        assert has_coach_email, f"Coach should have coach-specific emails. Got: {subjects}"
        print(f"PASS: Coach has {len(emails)} emails with coach-specific content")
    
    def test_coachee_gets_coachee_emails(self, coachee_token):
        """Coachee (Sarah) gets coachee-specific emails"""
        headers = {"Authorization": f"Bearer {coachee_token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        assert isinstance(emails, list)
        assert len(emails) > 0, "Coachee should have emails"
        
        # Check for coachee-specific email subjects
        subjects = [e["subject"] for e in emails]
        coachee_subjects = ["registration status", "preferences received", "learning journey", "feedback"]
        has_coachee_email = any(any(cs in s.lower() for cs in coachee_subjects) for s in subjects)
        assert has_coachee_email, f"Coachee should have coachee-specific emails. Got: {subjects}"
        print(f"PASS: Coachee has {len(emails)} emails with coachee-specific content")
    
    def test_admin_gets_admin_emails(self, admin_token):
        """Admin gets admin-specific emails"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        assert isinstance(emails, list)
        assert len(emails) > 0, "Admin should have emails"
        
        # Check for admin-specific email subjects
        subjects = [e["subject"] for e in emails]
        admin_subjects = ["registration", "confirmed", "completed"]
        has_admin_email = any(any(as_ in s.lower() for as_ in admin_subjects) for s in subjects)
        assert has_admin_email, f"Admin should have admin-specific emails. Got: {subjects}"
        print(f"PASS: Admin has {len(emails)} emails with admin-specific content")
    
    def test_emails_sorted_by_date_desc(self, coachee_token):
        """Emails are sorted by created_at descending (newest first)"""
        headers = {"Authorization": f"Bearer {coachee_token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        
        if len(emails) > 1:
            dates = [e["created_at"] for e in emails]
            assert dates == sorted(dates, reverse=True), "Emails should be sorted newest first"
        print("PASS: Emails sorted by date descending")
    
    def test_email_has_required_fields(self, coachee_token):
        """Each email has all required fields"""
        headers = {"Authorization": f"Bearer {coachee_token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        
        required_fields = ["id", "from_email", "from_name", "to_email", "to_user_id", 
                          "subject", "body", "preview", "read", "created_at"]
        
        for email in emails:
            for field in required_fields:
                assert field in email, f"Email missing field: {field}"
        print("PASS: All emails have required fields")
    
    def test_email_from_platform(self, coachee_token):
        """All emails are from Elevate@in.gt.com"""
        headers = {"Authorization": f"Bearer {coachee_token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        
        for email in emails:
            assert email["from_email"] == "Elevate@in.gt.com", f"Email from wrong sender: {email['from_email']}"
            assert email["from_name"] == "Elevate Team"
        print("PASS: All emails from Elevate@in.gt.com")


class TestMarkEmailRead:
    """Test PUT /api/emails/{id}/read endpoint"""
    
    def test_mark_read_requires_auth(self):
        """PUT /api/emails/{id}/read requires authentication"""
        response = requests.put(f"{BASE_URL}/api/emails/email-1/read")
        assert response.status_code == 401
        print("PASS: Mark email read requires auth")
    
    def test_mark_email_read(self, coachee_token):
        """Mark an unread email as read"""
        headers = {"Authorization": f"Bearer {coachee_token}"}
        
        # Get emails first
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        
        # Find an unread email
        unread_emails = [e for e in emails if not e["read"]]
        if not unread_emails:
            pytest.skip("No unread emails to test")
        
        email_id = unread_emails[0]["id"]
        
        # Mark as read
        response = requests.put(f"{BASE_URL}/api/emails/{email_id}/read", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        
        # Verify it's now read
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        emails = response.json()
        email = next((e for e in emails if e["id"] == email_id), None)
        assert email is not None
        assert email["read"] == True
        print(f"PASS: Email {email_id} marked as read")


class TestMarkAllEmailsRead:
    """Test PUT /api/emails/read-all endpoint"""
    
    def test_mark_all_read_requires_auth(self):
        """PUT /api/emails/read-all requires authentication"""
        response = requests.put(f"{BASE_URL}/api/emails/read-all")
        assert response.status_code == 401
        print("PASS: Mark all emails read requires auth")
    
    def test_mark_all_emails_read(self, admin_token):
        """Mark all emails as read for admin"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Mark all as read
        response = requests.put(f"{BASE_URL}/api/emails/read-all", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        
        # Verify all are read
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        emails = response.json()
        unread_count = sum(1 for e in emails if not e["read"])
        assert unread_count == 0, f"Expected 0 unread, got {unread_count}"
        print("PASS: All admin emails marked as read")


class TestUserSpecificEmails:
    """Test that each user only sees their own emails"""
    
    def test_coachee_priya_has_emails(self):
        """Priya Sharma (coachee-3) has her own emails"""
        token = get_token_for_email(COACHEE_PRIYA)
        assert token, "Failed to login as Priya"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        assert len(emails) > 0, "Priya should have emails"
        
        # Verify emails are addressed to Priya
        for email in emails:
            assert email["to_email"] == COACHEE_PRIYA
        print(f"PASS: Priya has {len(emails)} emails addressed to her")
    
    def test_coachee_rohan_has_emails(self):
        """Rohan Mehta (coachee-4) has his own emails"""
        token = get_token_for_email(COACHEE_ROHAN)
        assert token, "Failed to login as Rohan"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        assert len(emails) > 0, "Rohan should have emails"
        
        for email in emails:
            assert email["to_email"] == COACHEE_ROHAN
        print(f"PASS: Rohan has {len(emails)} emails addressed to him")
    
    def test_coachee_ananya_has_emails(self):
        """Ananya Reddy (coachee-5) has her own emails"""
        token = get_token_for_email(COACHEE_ANANYA)
        assert token, "Failed to login as Ananya"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        assert len(emails) > 0, "Ananya should have emails"
        
        for email in emails:
            assert email["to_email"] == COACHEE_ANANYA
        print(f"PASS: Ananya has {len(emails)} emails addressed to her")
    
    def test_coachee_vikram_has_emails(self):
        """Vikram Singh (coachee-6) has his own emails"""
        token = get_token_for_email(COACHEE_VIKRAM)
        assert token, "Failed to login as Vikram"
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        assert response.status_code == 200
        emails = response.json()
        assert len(emails) > 0, "Vikram should have emails"
        
        for email in emails:
            assert email["to_email"] == COACHEE_VIKRAM
        print(f"PASS: Vikram has {len(emails)} emails addressed to him")
    
    def test_users_cannot_see_others_emails(self):
        """Users can only see their own emails"""
        # Get Sarah's emails
        sarah_token = get_token_for_email(COACHEE_EMAIL)
        headers = {"Authorization": f"Bearer {sarah_token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        sarah_emails = response.json()
        
        # Get Priya's emails
        priya_token = get_token_for_email(COACHEE_PRIYA)
        headers = {"Authorization": f"Bearer {priya_token}"}
        response = requests.get(f"{BASE_URL}/api/emails", headers=headers)
        priya_emails = response.json()
        
        # Verify no overlap in email IDs
        sarah_ids = {e["id"] for e in sarah_emails}
        priya_ids = {e["id"] for e in priya_emails}
        overlap = sarah_ids & priya_ids
        assert len(overlap) == 0, f"Users should not share emails. Overlap: {overlap}"
        print("PASS: Users cannot see each other's emails")


class TestPublicStats:
    """Test that public stats reflect 6 coachees"""
    
    def test_public_stats_shows_6_coachees(self):
        """Public stats should show 6 coachees"""
        response = requests.get(f"{BASE_URL}/api/public/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["coachees"] == 6, f"Expected 6 coachees, got {data['coachees']}"
        assert data["coaches"] == 6, f"Expected 6 coaches, got {data['coaches']}"
        print(f"PASS: Public stats shows {data['coachees']} coachees and {data['coaches']} coaches")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
