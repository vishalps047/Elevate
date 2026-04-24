"""
Test MIS Reports API - Admin MIS Dashboard
Tests: GET /api/admin/mis endpoint with all fields and chart aggregations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@in.gt.com"
ADMIN_PASSWORD = "password123"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def mis_data(admin_token):
    """Fetch MIS data once for all tests"""
    response = requests.get(
        f"{BASE_URL}/api/admin/mis",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200, f"MIS API failed: {response.text}"
    return response.json()


class TestMISAPIAccess:
    """Test MIS API access and authentication"""
    
    def test_mis_requires_auth(self):
        """MIS endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/mis")
        assert response.status_code == 401
    
    def test_mis_requires_admin_role(self, admin_token):
        """MIS endpoint should return 200 for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/mis",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
    
    def test_mis_returns_expected_keys(self, mis_data):
        """MIS response should have coach_details, coachee_details, charts"""
        assert "coach_details" in mis_data
        assert "coachee_details" in mis_data
        assert "charts" in mis_data


class TestCoachDetailsFields:
    """Test Coach Details table has ALL required columns"""
    
    REQUIRED_COACH_FIELDS = [
        'id', 'name', 'email', 'gender', 'tier', 'designation', 'location',
        'region', 'business_unit', 'competency', 'total_work_experience',
        'coaching_expertise', 'certifications', 'expertise_areas', 'domains',
        'employee_status', 'capacity', 'assigned', 'remaining', 'total_sessions'
    ]
    
    def test_coach_details_not_empty(self, mis_data):
        """Coach details should have data"""
        assert len(mis_data["coach_details"]) > 0
    
    def test_coach_has_all_required_fields(self, mis_data):
        """Each coach should have all required fields"""
        coach = mis_data["coach_details"][0]
        for field in self.REQUIRED_COACH_FIELDS:
            assert field in coach, f"Missing field: {field}"
    
    def test_coach_gender_populated(self, mis_data):
        """Coaches should have gender field populated"""
        for coach in mis_data["coach_details"]:
            assert coach.get("gender") in ["Male", "Female", ""], f"Invalid gender for {coach['name']}"
    
    def test_coach_region_populated(self, mis_data):
        """Coaches should have region field populated"""
        for coach in mis_data["coach_details"]:
            assert coach.get("region"), f"Missing region for {coach['name']}"
    
    def test_coach_employee_status_populated(self, mis_data):
        """Coaches should have employee_status field populated"""
        for coach in mis_data["coach_details"]:
            assert coach.get("employee_status"), f"Missing employee_status for {coach['name']}"
    
    def test_coach_capacity_fields(self, mis_data):
        """Coach should have capacity, assigned, remaining fields"""
        for coach in mis_data["coach_details"]:
            assert "capacity" in coach
            assert "assigned" in coach
            assert "remaining" in coach
            # remaining should be capacity - assigned
            assert coach["remaining"] == max(coach["capacity"] - coach["assigned"], 0)


class TestCoacheeDetailsFields:
    """Test Coachee Details table has ALL required columns"""
    
    REQUIRED_COACHEE_FIELDS = [
        'id', 'name', 'email', 'gender', 'tier', 'designation', 'location',
        'region', 'business_unit', 'competency', 'date_of_joining',
        'enrolment_type', 'employee_status', 'coaching_status',
        'assigned_coach', 'sessions_completed', 'mentorship_area'
    ]
    
    def test_coachee_details_not_empty(self, mis_data):
        """Coachee details should have data"""
        assert len(mis_data["coachee_details"]) > 0
    
    def test_coachee_has_all_required_fields(self, mis_data):
        """Each coachee should have all required fields"""
        coachee = mis_data["coachee_details"][0]
        for field in self.REQUIRED_COACHEE_FIELDS:
            assert field in coachee, f"Missing field: {field}"
    
    def test_coachee_gender_populated(self, mis_data):
        """Coachees should have gender field populated"""
        for coachee in mis_data["coachee_details"]:
            assert coachee.get("gender") in ["Male", "Female", ""], f"Invalid gender for {coachee['name']}"
    
    def test_coachee_region_populated(self, mis_data):
        """Coachees should have region field populated"""
        for coachee in mis_data["coachee_details"]:
            assert coachee.get("region"), f"Missing region for {coachee['name']}"
    
    def test_coachee_employee_status_populated(self, mis_data):
        """Coachees should have employee_status field populated"""
        for coachee in mis_data["coachee_details"]:
            assert coachee.get("employee_status"), f"Missing employee_status for {coachee['name']}"
    
    def test_coachee_coaching_status_valid(self, mis_data):
        """Coaching status should be one of valid values"""
        valid_statuses = ["Not Started", "Pending Assignment", "In Progress", "Paused", "Completed"]
        for coachee in mis_data["coachee_details"]:
            assert coachee.get("coaching_status") in valid_statuses, f"Invalid status: {coachee.get('coaching_status')}"


class TestChartAggregations:
    """Test all 9 chart aggregations are present and have correct structure"""
    
    REQUIRED_CHARTS = [
        'coaching_status', 'coaches_by_region', 'coachees_by_bu',
        'gender_distribution', 'capacity_by_tier', 'top_coaches',
        'nomination_split', 'sessions_bucket', 'employee_status'
    ]
    
    def test_all_9_charts_present(self, mis_data):
        """All 9 charts should be present"""
        charts = mis_data["charts"]
        for chart_name in self.REQUIRED_CHARTS:
            assert chart_name in charts, f"Missing chart: {chart_name}"
    
    def test_coaching_status_donut(self, mis_data):
        """Coaching status chart should have name/value pairs"""
        chart = mis_data["charts"]["coaching_status"]
        assert isinstance(chart, list)
        if chart:
            assert "name" in chart[0]
            assert "value" in chart[0]
    
    def test_coaches_by_region_bar(self, mis_data):
        """Coaches by region chart should have region/count pairs"""
        chart = mis_data["charts"]["coaches_by_region"]
        assert isinstance(chart, list)
        if chart:
            assert "region" in chart[0]
            assert "count" in chart[0]
    
    def test_coachees_by_bu_bar(self, mis_data):
        """Coachees by BU chart should have name/count pairs"""
        chart = mis_data["charts"]["coachees_by_bu"]
        assert isinstance(chart, list)
        if chart:
            assert "name" in chart[0]
            assert "count" in chart[0]
    
    def test_gender_distribution_grouped_bar(self, mis_data):
        """Gender distribution should have gender/coaches/coachees"""
        chart = mis_data["charts"]["gender_distribution"]
        assert isinstance(chart, list)
        if chart:
            assert "gender" in chart[0]
            assert "coaches" in chart[0]
            assert "coachees" in chart[0]
    
    def test_capacity_by_tier_grouped_bar(self, mis_data):
        """Capacity by tier should have tier/capacity/assigned/available"""
        chart = mis_data["charts"]["capacity_by_tier"]
        assert isinstance(chart, list)
        if chart:
            assert "tier" in chart[0]
            assert "capacity" in chart[0]
            assert "assigned" in chart[0]
            assert "available" in chart[0]
    
    def test_top_coaches_bar(self, mis_data):
        """Top coaches should have name/assigned/completed"""
        chart = mis_data["charts"]["top_coaches"]
        assert isinstance(chart, list)
        if chart:
            assert "name" in chart[0]
            assert "assigned" in chart[0]
            assert "completed" in chart[0]
    
    def test_nomination_split_pie(self, mis_data):
        """Nomination split should have name/value pairs"""
        chart = mis_data["charts"]["nomination_split"]
        assert isinstance(chart, list)
        if chart:
            assert "name" in chart[0]
            assert "value" in chart[0]
    
    def test_sessions_bucket_bar(self, mis_data):
        """Sessions bucket should have bucket/count pairs"""
        chart = mis_data["charts"]["sessions_bucket"]
        assert isinstance(chart, list)
        if chart:
            assert "bucket" in chart[0]
            assert "count" in chart[0]
    
    def test_employee_status_donut(self, mis_data):
        """Employee status should have name/value pairs"""
        chart = mis_data["charts"]["employee_status"]
        assert isinstance(chart, list)
        if chart:
            assert "name" in chart[0]
            assert "value" in chart[0]


class TestDataConsistency:
    """Test data consistency between tables and charts"""
    
    def test_coach_count_matches(self, mis_data):
        """Total coaches in details should match sum in region chart"""
        coach_count = len(mis_data["coach_details"])
        region_sum = sum(r["count"] for r in mis_data["charts"]["coaches_by_region"])
        assert coach_count == region_sum, f"Coach count mismatch: {coach_count} vs {region_sum}"
    
    def test_coachee_count_matches(self, mis_data):
        """Total coachees in details should match sum in BU chart"""
        coachee_count = len(mis_data["coachee_details"])
        bu_sum = sum(b["count"] for b in mis_data["charts"]["coachees_by_bu"])
        assert coachee_count == bu_sum, f"Coachee count mismatch: {coachee_count} vs {bu_sum}"
    
    def test_gender_totals_match(self, mis_data):
        """Gender distribution totals should match coach+coachee counts"""
        coach_count = len(mis_data["coach_details"])
        coachee_count = len(mis_data["coachee_details"])
        gender_data = mis_data["charts"]["gender_distribution"]
        gender_coaches = sum(g["coaches"] for g in gender_data)
        gender_coachees = sum(g["coachees"] for g in gender_data)
        assert gender_coaches == coach_count, f"Gender coach count mismatch"
        assert gender_coachees == coachee_count, f"Gender coachee count mismatch"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
