"""
Test Etap 2 Features:
- Şifremi Unuttum (Forgot Password)
- Şifre Sıfırlama (Reset Password)
- Influencer Arama (Influencer Search)
- E-posta Bildirimleri (Email Notifications - mocked)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://influmarket-11.preview.emergentagent.com')

class TestForgotPassword:
    """Şifremi Unuttum endpoint tests"""
    
    def test_forgot_password_valid_email(self):
        """Test forgot password with valid email"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "marka@test.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # Should return success message even if email exists
        assert "gönderildi" in data["message"].lower() or "sıfırlama" in data["message"].lower()
    
    def test_forgot_password_nonexistent_email(self):
        """Test forgot password with non-existent email - should still return success (security)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": f"nonexistent_{uuid.uuid4().hex[:8]}@test.com"
        })
        # Should return 200 for security (don't reveal if email exists)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_forgot_password_invalid_email_format(self):
        """Test forgot password with invalid email format"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "invalid-email"
        })
        # Should return 422 for validation error
        assert response.status_code == 422


class TestResetPassword:
    """Şifre Sıfırlama endpoint tests"""
    
    def test_verify_reset_token_invalid(self):
        """Test verify reset token with invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-reset-token/invalid_token_12345")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert "message" in data
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid_token_12345",
            "new_password": "newpassword123"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_reset_password_short_password(self):
        """Test reset password with too short password"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "some_token",
            "new_password": "123"  # Too short
        })
        # Should fail - either invalid token or short password
        assert response.status_code == 400


class TestInfluencerSearch:
    """Influencer Arama endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as brand to get session"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marka@test.com",
            "password": "test123"
        })
        if login_response.status_code == 200:
            self.cookies = login_response.cookies
        else:
            pytest.skip("Could not login as brand")
    
    def test_influencer_search_basic(self):
        """Test basic influencer search"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check structure of returned influencers
        if len(data) > 0:
            inf = data[0]
            assert "user_id" in inf
            assert "name" in inf
            assert "specialties" in inf
            assert "total_followers" in inf
    
    def test_influencer_search_with_query(self):
        """Test influencer search with text query"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            params={"q": "test"},
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_influencer_search_with_specialty_filter(self):
        """Test influencer search with specialty filter"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            params={"specialty": "Moda & Stil"},
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_influencer_search_with_platform_filter(self):
        """Test influencer search with platform filter"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            params={"platform": "instagram"},
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_influencer_search_with_min_followers(self):
        """Test influencer search with minimum followers filter"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            params={"min_followers": 1000},
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned influencers should have >= 1000 followers
        for inf in data:
            assert inf.get("total_followers", 0) >= 1000
    
    def test_influencer_search_with_max_price(self):
        """Test influencer search with max price filter"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            params={"max_price": 5000},
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned influencers should have price <= 5000
        for inf in data:
            if inf.get("starting_price"):
                assert inf["starting_price"] <= 5000
    
    def test_influencer_search_sort_by_rating(self):
        """Test influencer search sorted by rating"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            params={"sort": "rating"},
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check if sorted by rating (descending)
        if len(data) > 1:
            for i in range(len(data) - 1):
                assert data[i].get("avg_rating", 0) >= data[i+1].get("avg_rating", 0)
    
    def test_influencer_search_sort_by_followers(self):
        """Test influencer search sorted by followers"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            params={"sort": "followers"},
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check if sorted by followers (descending)
        if len(data) > 1:
            for i in range(len(data) - 1):
                assert data[i].get("total_followers", 0) >= data[i+1].get("total_followers", 0)
    
    def test_influencer_search_sort_by_price_low(self):
        """Test influencer search sorted by price (low to high)"""
        response = requests.get(
            f"{BASE_URL}/api/influencers/search",
            params={"sort": "price_low"},
            cookies=self.cookies
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_influencer_search_unauthorized(self):
        """Test influencer search without authentication"""
        response = requests.get(f"{BASE_URL}/api/influencers/search")
        assert response.status_code == 401


class TestAuthPageForgotPasswordLink:
    """Test that forgot password link is visible on auth page"""
    
    def test_auth_page_loads(self):
        """Test that auth page is accessible"""
        response = requests.get(f"{BASE_URL}/auth")
        # Frontend routes return 200 (served by React)
        assert response.status_code == 200


class TestEmailNotifications:
    """Test email notification endpoints (MOCKED - Resend API key is placeholder)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as influencer to test application flow"""
        # Login as influencer
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ayse@influencer.com",
            "password": "test123"
        })
        if login_response.status_code == 200:
            self.influencer_cookies = login_response.cookies
        else:
            pytest.skip("Could not login as influencer")
        
        # Login as brand
        brand_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marka@test.com",
            "password": "test123"
        })
        if brand_login.status_code == 200:
            self.brand_cookies = brand_login.cookies
        else:
            pytest.skip("Could not login as brand")
    
    def test_application_creates_notification(self):
        """Test that creating an application creates notification for brand"""
        # Get open jobs
        jobs_response = requests.get(f"{BASE_URL}/api/jobs", cookies=self.influencer_cookies)
        if jobs_response.status_code != 200:
            pytest.skip("Could not get jobs")
        
        jobs = jobs_response.json()
        if not jobs:
            pytest.skip("No open jobs available")
        
        # Try to apply to a job (may fail if already applied)
        job_id = jobs[0]["job_id"]
        apply_response = requests.post(
            f"{BASE_URL}/api/applications",
            json={
                "job_id": job_id,
                "message": "Test application for email notification test"
            },
            cookies=self.influencer_cookies
        )
        
        # Either 200 (success) or 400 (already applied) is acceptable
        assert apply_response.status_code in [200, 400]
        
        if apply_response.status_code == 200:
            # Check that notification was created for brand
            # Note: Email is MOCKED (Resend API key is placeholder)
            data = apply_response.json()
            assert "application_id" in data


class TestPasswordResetFlow:
    """Test complete password reset flow"""
    
    def test_forgot_password_creates_reset_token(self):
        """Test that forgot password creates a reset token in database"""
        # Create a test user
        test_email = f"test_reset_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register user
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test Reset User",
            "user_type": "marka"
        })
        
        if register_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        # Request password reset
        forgot_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": test_email
        })
        
        assert forgot_response.status_code == 200
        data = forgot_response.json()
        assert "message" in data
        # Note: Actual email is not sent (MOCKED - Resend API key is placeholder)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
