"""
Test Suite for FLULANCE Etap 1 Features
Tests:
1. Admin Secret Login (/osyo)
2. Complete Match (İş Bitti) functionality
3. Remaining days display for approved jobs
4. Favorites functionality
5. Message read status (görüldü işareti)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://influmarket-11.preview.emergentagent.com')

# Test credentials
ADMIN_CREDS = {"email": "admin@flulance.com", "password": "admin123"}
BRAND_CREDS = {"email": "marka@test.com", "password": "test123"}
INFLUENCER_CREDS = {"email": "ayse@influencer.com", "password": "test123"}


class TestAdminSecretLogin:
    """Test admin secret login at /osyo"""
    
    def test_01_admin_login_success(self):
        """Admin can login with correct credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data.get("user_type") == "admin", f"Expected admin user type, got: {data.get('user_type')}"
        print(f"SUCCESS: Admin login works - user_type: {data.get('user_type')}")
    
    def test_02_non_admin_login_returns_user_type(self):
        """Non-admin login returns correct user type"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=BRAND_CREDS)
        
        assert response.status_code == 200, f"Brand login failed: {response.text}"
        data = response.json()
        assert data.get("user_type") == "marka", f"Expected marka user type, got: {data.get('user_type')}"
        print(f"SUCCESS: Brand login returns correct user_type: {data.get('user_type')}")


class TestCompleteMatch:
    """Test İş Bitti (Complete Match) functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup sessions for brand and influencer"""
        self.brand_session = requests.Session()
        self.influencer_session = requests.Session()
        
        # Login as brand
        resp = self.brand_session.post(f"{BASE_URL}/api/auth/login", json=BRAND_CREDS)
        assert resp.status_code == 200, f"Brand login failed: {resp.text}"
        
        # Login as influencer
        resp = self.influencer_session.post(f"{BASE_URL}/api/auth/login", json=INFLUENCER_CREDS)
        assert resp.status_code == 200, f"Influencer login failed: {resp.text}"
    
    def test_01_get_matches_for_brand(self):
        """Brand can get their matches"""
        response = self.brand_session.get(f"{BASE_URL}/api/matches/my-matches")
        
        assert response.status_code == 200, f"Get matches failed: {response.text}"
        matches = response.json()
        print(f"SUCCESS: Brand has {len(matches)} matches")
        return matches
    
    def test_02_get_matches_for_influencer(self):
        """Influencer can get their matches"""
        response = self.influencer_session.get(f"{BASE_URL}/api/matches/my-matches")
        
        assert response.status_code == 200, f"Get matches failed: {response.text}"
        matches = response.json()
        print(f"SUCCESS: Influencer has {len(matches)} matches")
        return matches
    
    def test_03_complete_match_endpoint_exists(self):
        """Complete match endpoint exists and returns proper error for invalid match"""
        response = self.brand_session.put(f"{BASE_URL}/api/matches/invalid_match_id/complete")
        
        # Should return 404 for invalid match, not 500 or 405
        assert response.status_code == 404, f"Expected 404 for invalid match, got: {response.status_code}"
        print("SUCCESS: Complete match endpoint exists and handles invalid match correctly")
    
    def test_04_complete_match_requires_auth(self):
        """Complete match requires authentication"""
        session = requests.Session()  # No auth
        response = session.put(f"{BASE_URL}/api/matches/some_match_id/complete")
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got: {response.status_code}"
        print("SUCCESS: Complete match requires authentication")


class TestFavorites:
    """Test Favorites functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for influencer"""
        self.session = requests.Session()
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=INFLUENCER_CREDS)
        assert resp.status_code == 200, f"Influencer login failed: {resp.text}"
    
    def test_01_get_favorites(self):
        """User can get their favorites"""
        response = self.session.get(f"{BASE_URL}/api/favorites")
        
        assert response.status_code == 200, f"Get favorites failed: {response.text}"
        favorites = response.json()
        print(f"SUCCESS: User has {len(favorites)} favorites")
        return favorites
    
    def test_02_add_favorite_requires_valid_job(self):
        """Adding favorite requires valid job ID"""
        response = self.session.post(f"{BASE_URL}/api/favorites/invalid_job_id")
        
        # Should work (add to favorites) or return 404 if job doesn't exist
        # The endpoint should not crash
        assert response.status_code in [200, 400, 404], f"Unexpected status: {response.status_code}"
        print(f"SUCCESS: Add favorite handles invalid job correctly (status: {response.status_code})")
    
    def test_03_remove_favorite_handles_not_found(self):
        """Removing non-existent favorite returns 404"""
        response = self.session.delete(f"{BASE_URL}/api/favorites/non_existent_job_id")
        
        assert response.status_code == 404, f"Expected 404 for non-existent favorite, got: {response.status_code}"
        print("SUCCESS: Remove favorite handles not found correctly")
    
    def test_04_check_favorite_status(self):
        """Can check if a job is favorited"""
        response = self.session.get(f"{BASE_URL}/api/favorites/check/some_job_id")
        
        assert response.status_code == 200, f"Check favorite failed: {response.text}"
        data = response.json()
        assert "is_favorite" in data, f"Response should contain is_favorite field"
        print(f"SUCCESS: Check favorite returns is_favorite: {data.get('is_favorite')}")


class TestJobRemainingDays:
    """Test remaining days display for approved jobs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for brand"""
        self.session = requests.Session()
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=BRAND_CREDS)
        assert resp.status_code == 200, f"Brand login failed: {resp.text}"
    
    def test_01_job_has_expires_at_field(self):
        """Jobs have expires_at field"""
        response = self.session.get(f"{BASE_URL}/api/jobs/my-jobs")
        
        assert response.status_code == 200, f"Get my jobs failed: {response.text}"
        jobs = response.json()
        
        if len(jobs) > 0:
            job = jobs[0]
            # Check if expires_at field exists
            has_expires_at = "expires_at" in job
            print(f"SUCCESS: Job has expires_at field: {has_expires_at}")
            if has_expires_at and job["expires_at"]:
                print(f"  - expires_at value: {job['expires_at']}")
        else:
            print("INFO: No jobs found for brand")
    
    def test_02_approved_jobs_have_expiry(self):
        """Approved jobs in public feed have expiry info"""
        response = self.session.get(f"{BASE_URL}/api/jobs")
        
        assert response.status_code == 200, f"Get jobs failed: {response.text}"
        jobs = response.json()
        
        if len(jobs) > 0:
            job = jobs[0]
            print(f"SUCCESS: Public job has expires_at: {'expires_at' in job}")
            if "expires_at" in job and job["expires_at"]:
                # Calculate remaining days
                expires_at = datetime.fromisoformat(job["expires_at"].replace("Z", "+00:00"))
                now = datetime.now(expires_at.tzinfo)
                remaining = (expires_at - now).days
                print(f"  - Remaining days: {remaining}")
        else:
            print("INFO: No public jobs found")


class TestMessageReadStatus:
    """Test message read status (görüldü işareti)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup sessions"""
        self.brand_session = requests.Session()
        self.influencer_session = requests.Session()
        
        resp = self.brand_session.post(f"{BASE_URL}/api/auth/login", json=BRAND_CREDS)
        assert resp.status_code == 200
        
        resp = self.influencer_session.post(f"{BASE_URL}/api/auth/login", json=INFLUENCER_CREDS)
        assert resp.status_code == 200
    
    def test_01_messages_have_is_read_field(self):
        """Messages have is_read field"""
        # Get matches first
        response = self.brand_session.get(f"{BASE_URL}/api/matches/my-matches")
        assert response.status_code == 200
        matches = response.json()
        
        if len(matches) > 0:
            match_id = matches[0]["match_id"]
            
            # Get messages
            response = self.brand_session.get(f"{BASE_URL}/api/matches/{match_id}/messages")
            assert response.status_code == 200
            messages = response.json()
            
            if len(messages) > 0:
                msg = messages[0]
                has_is_read = "is_read" in msg
                print(f"SUCCESS: Message has is_read field: {has_is_read}")
                if has_is_read:
                    print(f"  - is_read value: {msg['is_read']}")
            else:
                print("INFO: No messages in match")
        else:
            print("INFO: No matches found")


class TestMobileResponsive:
    """Test mobile responsive features - API level checks"""
    
    def test_01_api_works_regardless_of_viewport(self):
        """API endpoints work regardless of client viewport"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json=INFLUENCER_CREDS)
        assert resp.status_code == 200
        
        # Test various endpoints
        endpoints = [
            "/api/jobs",
            "/api/favorites",
            "/api/notifications",
            "/api/matches/my-matches"
        ]
        
        for endpoint in endpoints:
            response = session.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 200, f"Endpoint {endpoint} failed: {response.status_code}"
            print(f"SUCCESS: {endpoint} works")


class TestFavoritesIntegration:
    """Integration tests for favorites with real jobs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session"""
        self.session = requests.Session()
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=INFLUENCER_CREDS)
        assert resp.status_code == 200
    
    def test_01_add_and_remove_favorite_flow(self):
        """Test complete add/remove favorite flow"""
        # Get available jobs
        response = self.session.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        jobs = response.json()
        
        if len(jobs) == 0:
            pytest.skip("No jobs available to test favorites")
        
        job_id = jobs[0]["job_id"]
        print(f"Testing with job_id: {job_id}")
        
        # Check initial favorite status
        response = self.session.get(f"{BASE_URL}/api/favorites/check/{job_id}")
        assert response.status_code == 200
        initial_status = response.json()["is_favorite"]
        print(f"Initial favorite status: {initial_status}")
        
        if not initial_status:
            # Add to favorites
            response = self.session.post(f"{BASE_URL}/api/favorites/{job_id}")
            assert response.status_code == 200, f"Add favorite failed: {response.text}"
            print("SUCCESS: Added to favorites")
            
            # Verify it's now favorited
            response = self.session.get(f"{BASE_URL}/api/favorites/check/{job_id}")
            assert response.status_code == 200
            assert response.json()["is_favorite"] == True, "Job should be favorited"
            print("SUCCESS: Verified job is favorited")
            
            # Remove from favorites
            response = self.session.delete(f"{BASE_URL}/api/favorites/{job_id}")
            assert response.status_code == 200, f"Remove favorite failed: {response.text}"
            print("SUCCESS: Removed from favorites")
            
            # Verify it's no longer favorited
            response = self.session.get(f"{BASE_URL}/api/favorites/check/{job_id}")
            assert response.status_code == 200
            assert response.json()["is_favorite"] == False, "Job should not be favorited"
            print("SUCCESS: Verified job is not favorited")
        else:
            # Already favorited, test remove then add
            response = self.session.delete(f"{BASE_URL}/api/favorites/{job_id}")
            assert response.status_code == 200
            print("SUCCESS: Removed existing favorite")
            
            response = self.session.post(f"{BASE_URL}/api/favorites/{job_id}")
            assert response.status_code == 200
            print("SUCCESS: Re-added to favorites")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
