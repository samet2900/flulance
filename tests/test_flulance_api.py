"""
FLULANCE API Backend Tests
Tests for Brand Profile and Job Creation endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://influence-network.preview.emergentagent.com')

# Test credentials
BRAND_USER = {"email": "marka@test.com", "password": "test123"}


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with brand user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=BRAND_USER
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == BRAND_USER["email"]
        assert data["user_type"] == "marka"
        print(f"Login successful: {data['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_auth_me_without_token(self):
        """Test /auth/me without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


class TestBrandProfileEndpoints:
    """Brand Profile CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=BRAND_USER
        )
        assert login_response.status_code == 200
        
        # Get session token from cookies
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
    
    def test_get_brand_profile(self):
        """Test getting brand profile"""
        response = requests.get(
            f"{BASE_URL}/api/brand-profile/me",
            headers=self.headers
        )
        assert response.status_code == 200
        # Profile may be null or contain data
        data = response.json()
        if data:
            assert "company_name" in data
            assert "industry" in data
            print(f"Brand profile found: {data.get('company_name')}")
        else:
            print("No brand profile exists yet")
    
    def test_create_update_brand_profile(self):
        """Test creating/updating brand profile"""
        profile_data = {
            "company_name": "Test Firma API",
            "industry": "Teknoloji",
            "founded_year": 2021,
            "employee_count": "11-50",
            "website": "https://testfirma-api.com",
            "bio": "API test firma açıklaması",
            "phone": "+90 555 987 6543",
            "address": "Ankara, Türkiye",
            "social_media": {
                "instagram": "@testfirmaapi",
                "linkedin": "/company/testfirmaapi"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/brand-profile",
            headers=self.headers,
            json=profile_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["company_name"] == profile_data["company_name"]
        assert data["industry"] == profile_data["industry"]
        assert data["founded_year"] == profile_data["founded_year"]
        assert "profile_id" in data
        print(f"Brand profile created/updated: {data['profile_id']}")
        
        # Verify persistence with GET
        get_response = requests.get(
            f"{BASE_URL}/api/brand-profile/me",
            headers=self.headers
        )
        assert get_response.status_code == 200
        fetched_data = get_response.json()
        assert fetched_data["company_name"] == profile_data["company_name"]


class TestJobEndpoints:
    """Job Post CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=BRAND_USER
        )
        assert login_response.status_code == 200
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
    
    def test_get_my_jobs(self):
        """Test getting brand's jobs"""
        response = requests.get(
            f"{BASE_URL}/api/jobs/my-jobs",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} jobs")
    
    def test_create_job_basic(self):
        """Test creating a basic job"""
        job_data = {
            "title": "TEST_API_Basic_Job",
            "description": "Bu bir API test iş ilanıdır",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/jobs",
            headers=self.headers,
            json=job_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == job_data["title"]
        assert data["budget"] == job_data["budget"]
        assert data["status"] == "open"
        assert "job_id" in data
        print(f"Basic job created: {data['job_id']}")
    
    def test_create_job_extended_fields(self):
        """Test creating a job with all extended fields"""
        job_data = {
            "title": "TEST_API_Extended_Job",
            "description": "Bu bir genişletilmiş API test iş ilanıdır",
            "category": "Video İçerik",
            "budget": 10000,
            "platforms": ["instagram", "tiktok", "youtube"],
            "deadline_days": 14,
            "start_date": "2026-02-01",
            "revision_rounds": 3,
            "experience_level": "intermediate",
            "min_followers": 50000,
            "content_requirements": {
                "videos": 3,
                "images": 10,
                "stories": 5
            },
            "target_audience": {
                "age_range": "18-35",
                "location": "Türkiye"
            },
            "copyright": "shared"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/jobs",
            headers=self.headers,
            json=job_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == job_data["title"]
        assert data["deadline_days"] == job_data["deadline_days"]
        assert data["revision_rounds"] == job_data["revision_rounds"]
        assert data["experience_level"] == job_data["experience_level"]
        assert data["min_followers"] == job_data["min_followers"]
        assert data["content_requirements"]["videos"] == 3
        assert data["target_audience"]["age_range"] == "18-35"
        assert data["copyright"] == "shared"
        print(f"Extended job created: {data['job_id']}")
    
    def test_get_all_open_jobs(self):
        """Test getting all open jobs"""
        response = requests.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned jobs should be open
        for job in data:
            assert job["status"] == "open"
        print(f"Found {len(data)} open jobs")


class TestNotificationEndpoints:
    """Notification endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=BRAND_USER
        )
        assert login_response.status_code == 200
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
    
    def test_get_unread_count(self):
        """Test getting unread notification count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/unread-count",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"Unread notifications: {data['count']}")
    
    def test_get_notifications(self):
        """Test getting notifications list"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} notifications")


class TestPublicEndpoints:
    """Public endpoint tests (no auth required)"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "FLULANCE API"
        assert data["status"] == "active"
    
    def test_get_announcements(self):
        """Test getting announcements"""
        response = requests.get(f"{BASE_URL}/api/announcements")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} announcements")
    
    def test_get_trending_categories(self):
        """Test getting trending categories"""
        response = requests.get(f"{BASE_URL}/api/trending/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} trending categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
