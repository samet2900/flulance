"""
Test Job CRUD Bug Fixes - Testing 3 reported bugs:
1. Job creation button not working
2. Modal closing when clicking outside (frontend only)
3. No job editing feature (PUT /api/jobs/{job_id})

Test credentials: marka@test.com / test123
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestJobCRUDBugFixes:
    """Test job creation, update, and delete functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login and get session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as brand user
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "marka@test.com", "password": "test123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Extract session cookie
        self.cookies = login_response.cookies
        self.user = login_response.json()
        
        yield
        
        # Cleanup - delete test jobs
        try:
            jobs_response = self.session.get(
                f"{BASE_URL}/api/jobs/my-jobs",
                cookies=self.cookies
            )
            if jobs_response.status_code == 200:
                for job in jobs_response.json():
                    if job.get('title', '').startswith('TEST_'):
                        self.session.delete(
                            f"{BASE_URL}/api/jobs/{job['job_id']}",
                            cookies=self.cookies
                        )
        except:
            pass
    
    # ============= BUG FIX 1: Job Creation =============
    
    def test_01_create_job_basic(self):
        """Test basic job creation - Bug Fix #1"""
        job_data = {
            "title": f"TEST_Job_Creation_{uuid.uuid4().hex[:8]}",
            "description": "Test job description for bug fix verification",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram", "tiktok"]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Job creation failed: {response.text}"
        
        created_job = response.json()
        assert created_job["title"] == job_data["title"]
        assert created_job["description"] == job_data["description"]
        assert created_job["category"] == job_data["category"]
        assert created_job["budget"] == job_data["budget"]
        assert set(created_job["platforms"]) == set(job_data["platforms"])
        assert created_job["status"] == "open"
        assert "job_id" in created_job
        
        print(f"✓ Job created successfully: {created_job['job_id']}")
    
    def test_02_create_job_with_premium_features(self):
        """Test job creation with premium features (is_featured, is_urgent)"""
        job_data = {
            "title": f"TEST_Premium_Job_{uuid.uuid4().hex[:8]}",
            "description": "Test premium job with featured and urgent flags",
            "category": "Video İçerik",
            "budget": 10000,
            "platforms": ["youtube"],
            "is_featured": True,
            "is_urgent": True
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Premium job creation failed: {response.text}"
        
        created_job = response.json()
        assert created_job["is_featured"] == True
        assert created_job["is_urgent"] == True
        
        print(f"✓ Premium job created: {created_job['job_id']}")
    
    def test_03_create_job_with_all_fields(self):
        """Test job creation with all optional fields"""
        job_data = {
            "title": f"TEST_Full_Job_{uuid.uuid4().hex[:8]}",
            "description": "Complete job with all fields",
            "category": "Marka Elçiliği",
            "budget": 15000,
            "platforms": ["instagram", "tiktok", "youtube"],
            "deadline_days": 14,
            "start_date": "2025-01-15",
            "revision_rounds": 3,
            "experience_level": "intermediate",
            "min_followers": 50000,
            "content_requirements": {"videos": 2, "images": 5, "stories": 10},
            "target_audience": {"age_range": "18-35", "location": "Türkiye"},
            "copyright": "shared",
            "is_featured": True,
            "is_urgent": False
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        
        assert response.status_code == 200, f"Full job creation failed: {response.text}"
        
        created_job = response.json()
        assert created_job["deadline_days"] == 14
        assert created_job["revision_rounds"] == 3
        assert created_job["experience_level"] == "intermediate"
        assert created_job["min_followers"] == 50000
        
        print(f"✓ Full job created: {created_job['job_id']}")
    
    # ============= BUG FIX 3: Job Editing (PUT endpoint) =============
    
    def test_04_update_job_title_and_description(self):
        """Test job update - Bug Fix #3: Edit job feature"""
        # First create a job
        job_data = {
            "title": f"TEST_Update_Job_{uuid.uuid4().hex[:8]}",
            "description": "Original description",
            "category": "Story Paylaşımı",
            "budget": 3000,
            "platforms": ["instagram"]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        
        # Update the job
        update_data = {
            "title": "TEST_Updated_Title",
            "description": "Updated description for testing"
        }
        
        update_response = self.session.put(
            f"{BASE_URL}/api/jobs/{job_id}",
            json=update_data,
            cookies=self.cookies
        )
        
        assert update_response.status_code == 200, f"Job update failed: {update_response.text}"
        
        updated_job = update_response.json()
        assert updated_job["title"] == "TEST_Updated_Title"
        assert updated_job["description"] == "Updated description for testing"
        
        # Verify with GET
        get_response = self.session.get(
            f"{BASE_URL}/api/jobs/{job_id}",
            cookies=self.cookies
        )
        assert get_response.status_code == 200
        fetched_job = get_response.json()
        assert fetched_job["title"] == "TEST_Updated_Title"
        
        print(f"✓ Job title/description updated: {job_id}")
    
    def test_05_update_job_budget_and_category(self):
        """Test updating job budget and category"""
        # Create job
        job_data = {
            "title": f"TEST_Budget_Update_{uuid.uuid4().hex[:8]}",
            "description": "Test budget update",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram"]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        
        # Update budget and category
        update_data = {
            "budget": 8000,
            "category": "Video İçerik"
        }
        
        update_response = self.session.put(
            f"{BASE_URL}/api/jobs/{job_id}",
            json=update_data,
            cookies=self.cookies
        )
        
        assert update_response.status_code == 200
        updated_job = update_response.json()
        assert updated_job["budget"] == 8000
        assert updated_job["category"] == "Video İçerik"
        
        print(f"✓ Job budget/category updated: {job_id}")
    
    def test_06_update_job_platforms(self):
        """Test updating job platforms"""
        # Create job
        job_data = {
            "title": f"TEST_Platform_Update_{uuid.uuid4().hex[:8]}",
            "description": "Test platform update",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram"]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        
        # Update platforms
        update_data = {
            "platforms": ["instagram", "tiktok", "youtube"]
        }
        
        update_response = self.session.put(
            f"{BASE_URL}/api/jobs/{job_id}",
            json=update_data,
            cookies=self.cookies
        )
        
        assert update_response.status_code == 200
        updated_job = update_response.json()
        assert set(updated_job["platforms"]) == {"instagram", "tiktok", "youtube"}
        
        print(f"✓ Job platforms updated: {job_id}")
    
    def test_07_update_job_premium_features(self):
        """Test updating premium features (is_featured, is_urgent)"""
        # Create job without premium features
        job_data = {
            "title": f"TEST_Premium_Update_{uuid.uuid4().hex[:8]}",
            "description": "Test premium update",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram"],
            "is_featured": False,
            "is_urgent": False
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        
        # Update to enable premium features
        update_data = {
            "is_featured": True,
            "is_urgent": True
        }
        
        update_response = self.session.put(
            f"{BASE_URL}/api/jobs/{job_id}",
            json=update_data,
            cookies=self.cookies
        )
        
        assert update_response.status_code == 200
        updated_job = update_response.json()
        assert updated_job["is_featured"] == True
        assert updated_job["is_urgent"] == True
        
        print(f"✓ Job premium features updated: {job_id}")
    
    def test_08_update_job_status(self):
        """Test updating job status"""
        # Create job
        job_data = {
            "title": f"TEST_Status_Update_{uuid.uuid4().hex[:8]}",
            "description": "Test status update",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram"]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        assert create_response.json()["status"] == "open"
        
        # Update status to closed
        update_data = {
            "status": "closed"
        }
        
        update_response = self.session.put(
            f"{BASE_URL}/api/jobs/{job_id}",
            json=update_data,
            cookies=self.cookies
        )
        
        assert update_response.status_code == 200
        updated_job = update_response.json()
        assert updated_job["status"] == "closed"
        
        print(f"✓ Job status updated: {job_id}")
    
    # ============= Job Delete Tests =============
    
    def test_09_delete_job(self):
        """Test job deletion"""
        # Create job
        job_data = {
            "title": f"TEST_Delete_Job_{uuid.uuid4().hex[:8]}",
            "description": "Test delete",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram"]
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/jobs",
            json=job_data,
            cookies=self.cookies
        )
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        
        # Delete job
        delete_response = self.session.delete(
            f"{BASE_URL}/api/jobs/{job_id}",
            cookies=self.cookies
        )
        
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = self.session.get(
            f"{BASE_URL}/api/jobs/{job_id}",
            cookies=self.cookies
        )
        assert get_response.status_code == 404
        
        print(f"✓ Job deleted: {job_id}")
    
    # ============= Job List Tests =============
    
    def test_10_get_my_jobs(self):
        """Test getting brand's own jobs"""
        response = self.session.get(
            f"{BASE_URL}/api/jobs/my-jobs",
            cookies=self.cookies
        )
        
        assert response.status_code == 200
        jobs = response.json()
        assert isinstance(jobs, list)
        
        # All jobs should belong to current user
        for job in jobs:
            assert job["brand_user_id"] == self.user["user_id"]
        
        print(f"✓ Got {len(jobs)} jobs for brand")
    
    # ============= Error Handling Tests =============
    
    def test_11_update_nonexistent_job(self):
        """Test updating a job that doesn't exist"""
        update_response = self.session.put(
            f"{BASE_URL}/api/jobs/nonexistent_job_id",
            json={"title": "Test"},
            cookies=self.cookies
        )
        
        assert update_response.status_code == 404
        print("✓ Correctly returns 404 for nonexistent job")
    
    def test_12_delete_nonexistent_job(self):
        """Test deleting a job that doesn't exist"""
        delete_response = self.session.delete(
            f"{BASE_URL}/api/jobs/nonexistent_job_id",
            cookies=self.cookies
        )
        
        assert delete_response.status_code == 404
        print("✓ Correctly returns 404 for nonexistent job deletion")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
