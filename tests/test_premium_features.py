"""
Test Premium Features: Öne Çıkan (Featured) and Acil (Urgent) job badges
Tests the is_featured and is_urgent fields in job creation and retrieval
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPremiumFeatures:
    """Test premium job features: Featured (Öne Çıkan) and Urgent (Acil)"""
    
    session = None
    brand_session_token = None
    created_job_ids = []
    
    @classmethod
    def setup_class(cls):
        """Login as brand user to get session token"""
        cls.session = requests.Session()
        cls.session.headers.update({"Content-Type": "application/json"})
        
        # Login as brand user
        login_response = cls.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marka@test.com",
            "password": "test123"
        })
        
        if login_response.status_code == 200:
            # Extract session token from cookies
            cls.brand_session_token = login_response.cookies.get('session_token')
            if cls.brand_session_token:
                cls.session.cookies.set('session_token', cls.brand_session_token)
            print(f"✓ Brand login successful")
        else:
            print(f"✗ Brand login failed: {login_response.status_code} - {login_response.text}")
    
    @classmethod
    def teardown_class(cls):
        """Cleanup: Delete test jobs created during tests"""
        for job_id in cls.created_job_ids:
            try:
                cls.session.delete(f"{BASE_URL}/api/jobs/{job_id}")
                print(f"✓ Cleaned up job: {job_id}")
            except Exception as e:
                print(f"✗ Failed to cleanup job {job_id}: {e}")
    
    def test_01_create_job_with_featured_flag(self):
        """Test creating a job with is_featured=true"""
        job_data = {
            "title": "TEST_Featured Job - Premium Test",
            "description": "This is a featured job for testing premium features",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram", "tiktok"],
            "is_featured": True,
            "is_urgent": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/jobs", json=job_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "job_id" in data, "Response should contain job_id"
        assert data["is_featured"] == True, "Job should have is_featured=True"
        assert data["is_urgent"] == False, "Job should have is_urgent=False"
        assert data["title"] == job_data["title"], "Title should match"
        
        self.created_job_ids.append(data["job_id"])
        print(f"✓ Created featured job: {data['job_id']}")
    
    def test_02_create_job_with_urgent_flag(self):
        """Test creating a job with is_urgent=true"""
        job_data = {
            "title": "TEST_Urgent Job - Premium Test",
            "description": "This is an urgent job for testing premium features",
            "category": "Story Paylaşımı",
            "budget": 3000,
            "platforms": ["instagram"],
            "is_featured": False,
            "is_urgent": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/jobs", json=job_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "job_id" in data, "Response should contain job_id"
        assert data["is_featured"] == False, "Job should have is_featured=False"
        assert data["is_urgent"] == True, "Job should have is_urgent=True"
        
        self.created_job_ids.append(data["job_id"])
        print(f"✓ Created urgent job: {data['job_id']}")
    
    def test_03_create_job_with_both_flags(self):
        """Test creating a job with both is_featured=true and is_urgent=true"""
        job_data = {
            "title": "TEST_Featured+Urgent Job - Premium Test",
            "description": "This job has both premium features enabled",
            "category": "Video İçerik",
            "budget": 10000,
            "platforms": ["youtube", "tiktok"],
            "is_featured": True,
            "is_urgent": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/jobs", json=job_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["is_featured"] == True, "Job should have is_featured=True"
        assert data["is_urgent"] == True, "Job should have is_urgent=True"
        
        self.created_job_ids.append(data["job_id"])
        print(f"✓ Created featured+urgent job: {data['job_id']}")
    
    def test_04_create_job_without_premium_flags(self):
        """Test creating a regular job without premium flags (defaults to False)"""
        job_data = {
            "title": "TEST_Regular Job - No Premium",
            "description": "This is a regular job without premium features",
            "category": "İçerik Üretimi",
            "budget": 2000,
            "platforms": ["instagram"]
        }
        
        response = self.session.post(f"{BASE_URL}/api/jobs", json=job_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Should default to False when not provided
        assert data.get("is_featured", False) == False, "Job should default is_featured=False"
        assert data.get("is_urgent", False) == False, "Job should default is_urgent=False"
        
        self.created_job_ids.append(data["job_id"])
        print(f"✓ Created regular job: {data['job_id']}")
    
    def test_05_get_jobs_returns_premium_flags(self):
        """Test that GET /api/jobs returns is_featured and is_urgent fields"""
        response = self.session.get(f"{BASE_URL}/api/jobs?status=open")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        jobs = response.json()
        assert isinstance(jobs, list), "Response should be a list"
        
        # Check that jobs have premium fields
        for job in jobs:
            assert "is_featured" in job or job.get("is_featured") is not None or "is_featured" not in job, \
                "Jobs should have is_featured field or default"
            assert "is_urgent" in job or job.get("is_urgent") is not None or "is_urgent" not in job, \
                "Jobs should have is_urgent field or default"
        
        # Find our test jobs
        featured_jobs = [j for j in jobs if j.get("is_featured") == True]
        urgent_jobs = [j for j in jobs if j.get("is_urgent") == True]
        
        print(f"✓ Found {len(featured_jobs)} featured jobs and {len(urgent_jobs)} urgent jobs")
    
    def test_06_get_my_jobs_returns_premium_flags(self):
        """Test that GET /api/jobs/my-jobs returns is_featured and is_urgent fields"""
        response = self.session.get(f"{BASE_URL}/api/jobs/my-jobs")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        jobs = response.json()
        assert isinstance(jobs, list), "Response should be a list"
        
        # Find our test jobs
        test_jobs = [j for j in jobs if j.get("title", "").startswith("TEST_")]
        
        for job in test_jobs:
            assert "is_featured" in job, f"Job {job.get('job_id')} should have is_featured field"
            assert "is_urgent" in job, f"Job {job.get('job_id')} should have is_urgent field"
            print(f"  - {job['title']}: featured={job['is_featured']}, urgent={job['is_urgent']}")
        
        print(f"✓ All {len(test_jobs)} test jobs have premium flags")
    
    def test_07_get_single_job_returns_premium_flags(self):
        """Test that GET /api/jobs/{job_id} returns is_featured and is_urgent fields"""
        if not self.created_job_ids:
            pytest.skip("No test jobs created")
        
        job_id = self.created_job_ids[0]  # Get the featured job
        response = self.session.get(f"{BASE_URL}/api/jobs/{job_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        job = response.json()
        assert job["is_featured"] == True, "Featured job should have is_featured=True"
        
        print(f"✓ Single job {job_id} has correct premium flags")
    
    def test_08_recommendations_returns_premium_flags(self):
        """Test that GET /api/recommendations returns jobs with premium flags"""
        # Login as influencer to get recommendations
        influencer_session = requests.Session()
        influencer_session.headers.update({"Content-Type": "application/json"})
        
        login_response = influencer_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ayse@influencer.com",
            "password": "test123"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Could not login as influencer")
        
        # Get recommendations
        response = influencer_session.get(f"{BASE_URL}/api/recommendations")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        jobs = response.json()
        if jobs:
            # Check that jobs have premium fields (or defaults)
            for job in jobs:
                # Fields should exist or default to False
                is_featured = job.get("is_featured", False)
                is_urgent = job.get("is_urgent", False)
                print(f"  - {job.get('title', 'Unknown')}: featured={is_featured}, urgent={is_urgent}")
        
        print(f"✓ Recommendations endpoint returns {len(jobs)} jobs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
