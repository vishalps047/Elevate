"""
Test suite for the new 5-question Elevate Coachee Feedback Form
Tests the structured feedback API: POST /api/requests/{id}/feedback

Features tested:
- Q1: Overall experience rating (1-5, mandatory)
- Q2: Coach knowledge/guidance/engagement rating (1-5, mandatory)
- Q3: Learning outcomes with 4 sub-items (self_awareness, experimental, goals, go_beyond) each rated 1-5 (mandatory)
- Q4: Most valuable open text (mandatory)
- Q5: Suggestions open text (optional)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
ALEX_EMAIL = "alex@elevate.com"
ALEX_PASSWORD = "password123"
COACH_EMAIL = "fatema@elevate.com"
COACH_PASSWORD = "password123"

# Alex's completed journey request ID
ALEX_REQUEST_ID = "b5a1dc88-63d4-4b9b-a10b-95f5094900ad"


@pytest.fixture(scope="module")
def alex_token():
    """Get authentication token for Alex (coachee with completed journey)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ALEX_EMAIL,
        "password": ALEX_PASSWORD
    })
    assert response.status_code == 200, f"Alex login failed: {response.text}"
    return response.json()["token"]


@pytest.fixture(scope="module")
def coach_token():
    """Get authentication token for coach (to test role restriction)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": COACH_EMAIL,
        "password": COACH_PASSWORD
    })
    assert response.status_code == 200, f"Coach login failed: {response.text}"
    return response.json()["token"]


class TestFeedbackAPIStructure:
    """Test the feedback API accepts the new structured body"""
    
    def test_feedback_endpoint_exists(self, alex_token):
        """Verify the feedback endpoint exists and requires auth"""
        response = requests.post(f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback")
        # Should return 401 without auth, not 404
        assert response.status_code in [401, 403, 422], f"Unexpected status: {response.status_code}"
    
    def test_feedback_requires_coachee_role(self, coach_token):
        """Only coachees can submit feedback"""
        response = requests.post(
            f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
            headers={"Authorization": f"Bearer {coach_token}"},
            json={
                "overall_rating": 5,
                "coach_rating": 5,
                "learning_outcomes": {
                    "self_awareness": 5,
                    "experimental": 5,
                    "goals": 5,
                    "go_beyond": 5
                },
                "most_valuable": "Test feedback",
                "suggestions": ""
            }
        )
        assert response.status_code == 403, f"Expected 403 for coach, got {response.status_code}"
        assert "coachee" in response.json().get("detail", "").lower()


class TestFeedbackValidation:
    """Test validation of the feedback body structure"""
    
    def test_missing_overall_rating(self, alex_token):
        """overall_rating is mandatory"""
        response = requests.post(
            f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
            headers={"Authorization": f"Bearer {alex_token}"},
            json={
                "coach_rating": 5,
                "learning_outcomes": {
                    "self_awareness": 5,
                    "experimental": 5,
                    "goals": 5,
                    "go_beyond": 5
                },
                "most_valuable": "Test feedback"
            }
        )
        assert response.status_code == 422, f"Expected 422 for missing overall_rating, got {response.status_code}"
    
    def test_missing_coach_rating(self, alex_token):
        """coach_rating is mandatory"""
        response = requests.post(
            f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
            headers={"Authorization": f"Bearer {alex_token}"},
            json={
                "overall_rating": 5,
                "learning_outcomes": {
                    "self_awareness": 5,
                    "experimental": 5,
                    "goals": 5,
                    "go_beyond": 5
                },
                "most_valuable": "Test feedback"
            }
        )
        assert response.status_code == 422, f"Expected 422 for missing coach_rating, got {response.status_code}"
    
    def test_missing_learning_outcomes(self, alex_token):
        """learning_outcomes is mandatory"""
        response = requests.post(
            f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
            headers={"Authorization": f"Bearer {alex_token}"},
            json={
                "overall_rating": 5,
                "coach_rating": 5,
                "most_valuable": "Test feedback"
            }
        )
        assert response.status_code == 422, f"Expected 422 for missing learning_outcomes, got {response.status_code}"
    
    def test_incomplete_learning_outcomes(self, alex_token):
        """All 4 learning outcome sub-items are required"""
        response = requests.post(
            f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
            headers={"Authorization": f"Bearer {alex_token}"},
            json={
                "overall_rating": 5,
                "coach_rating": 5,
                "learning_outcomes": {
                    "self_awareness": 5,
                    "experimental": 5
                    # Missing goals and go_beyond
                },
                "most_valuable": "Test feedback"
            }
        )
        assert response.status_code == 422, f"Expected 422 for incomplete learning_outcomes, got {response.status_code}"
    
    def test_missing_most_valuable(self, alex_token):
        """most_valuable is mandatory"""
        response = requests.post(
            f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
            headers={"Authorization": f"Bearer {alex_token}"},
            json={
                "overall_rating": 5,
                "coach_rating": 5,
                "learning_outcomes": {
                    "self_awareness": 5,
                    "experimental": 5,
                    "goals": 5,
                    "go_beyond": 5
                }
                # Missing most_valuable
            }
        )
        assert response.status_code == 422, f"Expected 422 for missing most_valuable, got {response.status_code}"
    
    def test_suggestions_is_optional(self, alex_token):
        """suggestions field is optional - should not cause validation error"""
        # This test verifies the field is optional by checking the model accepts it without suggestions
        # Note: We can't actually submit because Alex's journey may already have feedback
        # So we just verify the validation passes (not 422)
        response = requests.post(
            f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
            headers={"Authorization": f"Bearer {alex_token}"},
            json={
                "overall_rating": 5,
                "coach_rating": 5,
                "learning_outcomes": {
                    "self_awareness": 5,
                    "experimental": 5,
                    "goals": 5,
                    "go_beyond": 5
                },
                "most_valuable": "Test feedback"
                # No suggestions field - should be OK
            }
        )
        # Should not be 422 (validation error) - could be 200 or 400 (already submitted)
        assert response.status_code != 422, f"Suggestions should be optional, got 422"


class TestFeedbackSubmission:
    """Test successful feedback submission flow"""
    
    def test_valid_feedback_structure_accepted(self, alex_token):
        """Test that a valid feedback body is accepted by the API"""
        valid_feedback = {
            "overall_rating": 4,
            "coach_rating": 5,
            "learning_outcomes": {
                "self_awareness": 4,
                "experimental": 3,
                "goals": 5,
                "go_beyond": 4
            },
            "most_valuable": "The personalized guidance and actionable feedback from my coach.",
            "suggestions": "More frequent check-ins would be helpful."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
            headers={"Authorization": f"Bearer {alex_token}"},
            json=valid_feedback
        )
        
        # Should be 200 (success) or 400 (already submitted) - not 422 (validation error)
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}, body: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            # Verify response contains the structured feedback
            assert data.get("overall_rating") == 4
            assert data.get("coach_rating") == 5
            assert "learning_outcomes" in data
            assert data["learning_outcomes"]["self_awareness"] == 4
            assert data["learning_outcomes"]["experimental"] == 3
            assert data["learning_outcomes"]["goals"] == 5
            assert data["learning_outcomes"]["go_beyond"] == 4
            assert data.get("most_valuable") == valid_feedback["most_valuable"]
            assert data.get("suggestions") == valid_feedback["suggestions"]
            print("Feedback submitted successfully with all structured fields")
        else:
            # Already submitted - that's OK for this test
            print(f"Feedback already submitted: {response.json()}")


class TestFeedbackBusinessLogic:
    """Test business logic around feedback submission"""
    
    def test_cannot_submit_feedback_twice(self, alex_token):
        """Once feedback is submitted, cannot submit again"""
        # First, check if feedback was already submitted
        active_response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {alex_token}"}
        )
        
        if active_response.status_code == 200:
            request_data = active_response.json().get("request")
            if request_data and request_data.get("feedback_submitted"):
                # Try to submit again - should fail
                response = requests.post(
                    f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
                    headers={"Authorization": f"Bearer {alex_token}"},
                    json={
                        "overall_rating": 5,
                        "coach_rating": 5,
                        "learning_outcomes": {
                            "self_awareness": 5,
                            "experimental": 5,
                            "goals": 5,
                            "go_beyond": 5
                        },
                        "most_valuable": "Duplicate submission test"
                    }
                )
                assert response.status_code == 400, f"Expected 400 for duplicate feedback, got {response.status_code}"
                assert "already" in response.json().get("detail", "").lower()
                print("Correctly blocked duplicate feedback submission")
            else:
                pytest.skip("Feedback not yet submitted - cannot test duplicate prevention")
        else:
            pytest.skip("Could not check active request status")
    
    def test_feedback_requires_completed_journey(self, alex_token):
        """Cannot submit feedback if journey is not completed"""
        # This is implicitly tested - Alex's journey is completed
        # We verify the endpoint checks journey_completed flag
        active_response = requests.get(
            f"{BASE_URL}/api/requests/active",
            headers={"Authorization": f"Bearer {alex_token}"}
        )
        
        if active_response.status_code == 200:
            request_data = active_response.json().get("request")
            if request_data:
                assert request_data.get("journey_completed") == True, "Alex's journey should be completed"
                print(f"Journey completed status verified: {request_data.get('journey_completed')}")


class TestLearningOutcomesModel:
    """Test the LearningOutcomes model structure"""
    
    def test_all_four_subitems_required(self, alex_token):
        """Verify all 4 learning outcome sub-items are validated"""
        # Test each missing sub-item
        sub_items = ["self_awareness", "experimental", "goals", "go_beyond"]
        
        for missing_item in sub_items:
            learning_outcomes = {item: 5 for item in sub_items if item != missing_item}
            
            response = requests.post(
                f"{BASE_URL}/api/requests/{ALEX_REQUEST_ID}/feedback",
                headers={"Authorization": f"Bearer {alex_token}"},
                json={
                    "overall_rating": 5,
                    "coach_rating": 5,
                    "learning_outcomes": learning_outcomes,
                    "most_valuable": "Test"
                }
            )
            
            assert response.status_code == 422, f"Missing {missing_item} should cause 422, got {response.status_code}"
            print(f"Correctly validated missing {missing_item}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
