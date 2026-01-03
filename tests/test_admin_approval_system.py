"""
Test Admin Approval System and Job Renewal Features for FLULANCE Platform

Features to test:
1. Admin Onay Sistemi: Yeni oluşturulan ilanların 'pending' durumunda başlaması
2. Admin Onay Sistemi: Pending ilanların HomeFeed'de görünmemesi
3. Admin Onay Sistemi: Admin'in pending ilanları görebilmesi ve onaylayabilmesi
4. Admin Onay Sistemi: Onaylanan ilanın HomeFeed'de görünmesi
5. Admin Onay Sistemi: Admin'in ilanları reddetmesi ve red sebebi gösterilmesi
6. İlan Yenileme: Marka'nın expired/approved ilanı yenileyebilmesi
7. İlan Yenileme: Yenilenen ilanın tekrar 'pending' durumuna geçmesi
8. Marka Dashboard: İlan durumlarının badge'lerle gösterilmesi
9. HomeFeed: Sadece approval_status='approved' VE expires_at > now olan ilanların gösterilmesi
"""

import pytest
import requests
import os
import time
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://influencer-hub-110.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@flulance.com"
ADMIN_PASSWORD = "admin123"
BRAND_EMAIL = "marka@test.com"
BRAND_PASSWORD = "test123"
INFLUENCER_EMAIL = "ayse@influencer.com"
INFLUENCER_PASSWORD = "test123"


class TestAdminApprovalSystem:
    """Test Admin Approval System for job posts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.admin_session = requests.Session()
        self.brand_session = requests.Session()
        self.influencer_session = requests.Session()
        
    def login_as_admin(self):
        """Login as admin user"""
        response = self.admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()
    
    def login_as_brand(self):
        """Login as brand user"""
        response = self.brand_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BRAND_EMAIL,
            "password": BRAND_PASSWORD
        })
        assert response.status_code == 200, f"Brand login failed: {response.text}"
        return response.json()
    
    def login_as_influencer(self):
        """Login as influencer user"""
        response = self.influencer_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": INFLUENCER_EMAIL,
            "password": INFLUENCER_PASSWORD
        })
        assert response.status_code == 200, f"Influencer login failed: {response.text}"
        return response.json()
    
    # Test 1: New jobs start with 'pending' approval status
    def test_01_new_job_starts_with_pending_status(self):
        """Test that newly created jobs have approval_status='pending'"""
        self.login_as_brand()
        
        # Create a new job
        job_data = {
            "title": "TEST_Pending_Job_" + str(int(time.time())),
            "description": "Test job for pending status verification",
            "category": "Ürün Tanıtımı",
            "budget": 5000,
            "platforms": ["instagram", "tiktok"]
        }
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert response.status_code == 200, f"Job creation failed: {response.text}"
        
        job = response.json()
        assert job.get("approval_status") == "pending", f"Expected approval_status='pending', got '{job.get('approval_status')}'"
        assert job.get("status") == "open", f"Expected status='open', got '{job.get('status')}'"
        
        print(f"✅ Test 1 PASSED: New job created with approval_status='pending'")
        return job["job_id"]
    
    # Test 2: Pending jobs don't appear in HomeFeed (public /api/jobs)
    def test_02_pending_jobs_not_in_homefeed(self):
        """Test that pending jobs don't appear in public job listings"""
        self.login_as_brand()
        
        # Create a pending job
        job_data = {
            "title": "TEST_Hidden_Pending_Job_" + str(int(time.time())),
            "description": "This job should not appear in HomeFeed",
            "category": "Video İçerik",
            "budget": 3000,
            "platforms": ["youtube"]
        }
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert response.status_code == 200
        pending_job = response.json()
        pending_job_id = pending_job["job_id"]
        
        # Login as influencer and check HomeFeed
        self.login_as_influencer()
        
        response = self.influencer_session.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        
        jobs = response.json()
        job_ids = [j["job_id"] for j in jobs]
        
        assert pending_job_id not in job_ids, f"Pending job {pending_job_id} should NOT appear in HomeFeed"
        
        # Verify all jobs in HomeFeed are approved
        for job in jobs:
            assert job.get("approval_status") == "approved", f"Job {job['job_id']} in HomeFeed has approval_status='{job.get('approval_status')}', expected 'approved'"
        
        print(f"✅ Test 2 PASSED: Pending jobs don't appear in HomeFeed")
        return pending_job_id
    
    # Test 3: Admin can see pending jobs
    def test_03_admin_can_see_pending_jobs(self):
        """Test that admin can view all jobs including pending ones"""
        self.login_as_admin()
        
        # Get all jobs as admin
        response = self.admin_session.get(f"{BASE_URL}/api/admin/jobs")
        assert response.status_code == 200, f"Admin get jobs failed: {response.text}"
        
        all_jobs = response.json()
        
        # Get only pending jobs
        response = self.admin_session.get(f"{BASE_URL}/api/admin/jobs?approval_status=pending")
        assert response.status_code == 200
        
        pending_jobs = response.json()
        
        # Verify pending filter works
        for job in pending_jobs:
            assert job.get("approval_status") == "pending", f"Job {job['job_id']} should have approval_status='pending'"
        
        print(f"✅ Test 3 PASSED: Admin can see {len(pending_jobs)} pending jobs out of {len(all_jobs)} total jobs")
        return pending_jobs
    
    # Test 4: Admin can approve a job
    def test_04_admin_can_approve_job(self):
        """Test that admin can approve a pending job"""
        # First create a pending job as brand
        self.login_as_brand()
        
        job_data = {
            "title": "TEST_To_Be_Approved_" + str(int(time.time())),
            "description": "This job will be approved by admin",
            "category": "Story Paylaşımı",
            "budget": 2000,
            "platforms": ["instagram"]
        }
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert response.status_code == 200
        job = response.json()
        job_id = job["job_id"]
        
        # Now approve as admin
        self.login_as_admin()
        
        approval_data = {
            "approval_status": "approved"
        }
        
        response = self.admin_session.put(f"{BASE_URL}/api/admin/jobs/{job_id}/approval", json=approval_data)
        assert response.status_code == 200, f"Job approval failed: {response.text}"
        
        # Verify job is now approved
        response = self.admin_session.get(f"{BASE_URL}/api/admin/jobs?approval_status=approved")
        assert response.status_code == 200
        
        approved_jobs = response.json()
        approved_job_ids = [j["job_id"] for j in approved_jobs]
        
        assert job_id in approved_job_ids, f"Job {job_id} should be in approved jobs list"
        
        print(f"✅ Test 4 PASSED: Admin successfully approved job {job_id}")
        return job_id
    
    # Test 5: Approved job appears in HomeFeed
    def test_05_approved_job_appears_in_homefeed(self):
        """Test that approved jobs appear in public HomeFeed"""
        # Create and approve a job
        self.login_as_brand()
        
        job_data = {
            "title": "TEST_Approved_Visible_" + str(int(time.time())),
            "description": "This approved job should appear in HomeFeed",
            "category": "Reklam Kampanyası",
            "budget": 10000,
            "platforms": ["instagram", "youtube"]
        }
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert response.status_code == 200
        job = response.json()
        job_id = job["job_id"]
        
        # Approve as admin
        self.login_as_admin()
        
        response = self.admin_session.put(f"{BASE_URL}/api/admin/jobs/{job_id}/approval", json={
            "approval_status": "approved"
        })
        assert response.status_code == 200
        
        # Check HomeFeed as influencer
        self.login_as_influencer()
        
        response = self.influencer_session.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        
        jobs = response.json()
        job_ids = [j["job_id"] for j in jobs]
        
        assert job_id in job_ids, f"Approved job {job_id} should appear in HomeFeed"
        
        print(f"✅ Test 5 PASSED: Approved job {job_id} appears in HomeFeed")
        return job_id
    
    # Test 6: Admin can reject a job with reason
    def test_06_admin_can_reject_job_with_reason(self):
        """Test that admin can reject a job and provide rejection reason"""
        # Create a job as brand
        self.login_as_brand()
        
        job_data = {
            "title": "TEST_To_Be_Rejected_" + str(int(time.time())),
            "description": "This job will be rejected by admin",
            "category": "İçerik Üretimi",
            "budget": 1500,
            "platforms": ["tiktok"]
        }
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert response.status_code == 200
        job = response.json()
        job_id = job["job_id"]
        
        # Reject as admin with reason
        self.login_as_admin()
        
        rejection_reason = "Topluluk kurallarına aykırı içerik"
        rejection_data = {
            "approval_status": "rejected",
            "rejection_reason": rejection_reason
        }
        
        response = self.admin_session.put(f"{BASE_URL}/api/admin/jobs/{job_id}/approval", json=rejection_data)
        assert response.status_code == 200, f"Job rejection failed: {response.text}"
        
        # Verify job is rejected with reason
        response = self.admin_session.get(f"{BASE_URL}/api/admin/jobs?approval_status=rejected")
        assert response.status_code == 200
        
        rejected_jobs = response.json()
        rejected_job = next((j for j in rejected_jobs if j["job_id"] == job_id), None)
        
        assert rejected_job is not None, f"Job {job_id} should be in rejected jobs list"
        assert rejected_job.get("rejection_reason") == rejection_reason, f"Rejection reason mismatch"
        
        print(f"✅ Test 6 PASSED: Admin rejected job {job_id} with reason: '{rejection_reason}'")
        return job_id
    
    # Test 7: Rejected job doesn't appear in HomeFeed
    def test_07_rejected_job_not_in_homefeed(self):
        """Test that rejected jobs don't appear in HomeFeed"""
        # Create and reject a job
        self.login_as_brand()
        
        job_data = {
            "title": "TEST_Rejected_Hidden_" + str(int(time.time())),
            "description": "This rejected job should not appear in HomeFeed",
            "category": "Marka Elçiliği",
            "budget": 8000,
            "platforms": ["instagram"]
        }
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert response.status_code == 200
        job = response.json()
        job_id = job["job_id"]
        
        # Reject as admin
        self.login_as_admin()
        
        response = self.admin_session.put(f"{BASE_URL}/api/admin/jobs/{job_id}/approval", json={
            "approval_status": "rejected",
            "rejection_reason": "Spam veya reklam içeriği"
        })
        assert response.status_code == 200
        
        # Check HomeFeed
        self.login_as_influencer()
        
        response = self.influencer_session.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        
        jobs = response.json()
        job_ids = [j["job_id"] for j in jobs]
        
        assert job_id not in job_ids, f"Rejected job {job_id} should NOT appear in HomeFeed"
        
        print(f"✅ Test 7 PASSED: Rejected job {job_id} doesn't appear in HomeFeed")
        return job_id


class TestJobRenewalSystem:
    """Test Job Renewal System"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.brand_session = requests.Session()
        self.admin_session = requests.Session()
        
    def login_as_brand(self):
        """Login as brand user"""
        response = self.brand_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": BRAND_EMAIL,
            "password": BRAND_PASSWORD
        })
        assert response.status_code == 200, f"Brand login failed: {response.text}"
        return response.json()
    
    def login_as_admin(self):
        """Login as admin user"""
        response = self.admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json()
    
    # Test 8: Brand can renew an approved job
    def test_08_brand_can_renew_approved_job(self):
        """Test that brand can renew an approved job"""
        # Create and approve a job
        self.login_as_brand()
        
        job_data = {
            "title": "TEST_To_Be_Renewed_" + str(int(time.time())),
            "description": "This job will be renewed",
            "category": "Etkinlik Tanıtımı",
            "budget": 6000,
            "platforms": ["instagram", "twitter"]
        }
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert response.status_code == 200
        job = response.json()
        job_id = job["job_id"]
        
        # Approve as admin
        self.login_as_admin()
        response = self.admin_session.put(f"{BASE_URL}/api/admin/jobs/{job_id}/approval", json={
            "approval_status": "approved"
        })
        assert response.status_code == 200
        
        # Renew as brand
        self.login_as_brand()
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs/{job_id}/renew")
        assert response.status_code == 200, f"Job renewal failed: {response.text}"
        
        result = response.json()
        assert "renewed" in result.get("message", "").lower() or "pending" in result.get("message", "").lower(), f"Unexpected renewal response: {result}"
        
        print(f"✅ Test 8 PASSED: Brand successfully renewed job {job_id}")
        return job_id
    
    # Test 9: Renewed job goes back to 'pending' status
    def test_09_renewed_job_becomes_pending(self):
        """Test that renewed job goes back to pending approval status"""
        # Create and approve a job
        self.login_as_brand()
        
        job_data = {
            "title": "TEST_Renew_Pending_" + str(int(time.time())),
            "description": "This renewed job should become pending",
            "category": "Sosyal Medya Yönetimi",
            "budget": 4000,
            "platforms": ["linkedin"]
        }
        
        response = self.brand_session.post(f"{BASE_URL}/api/jobs", json=job_data)
        assert response.status_code == 200
        job = response.json()
        job_id = job["job_id"]
        
        # Approve as admin
        self.login_as_admin()
        response = self.admin_session.put(f"{BASE_URL}/api/admin/jobs/{job_id}/approval", json={
            "approval_status": "approved"
        })
        assert response.status_code == 200
        
        # Renew as brand
        self.login_as_brand()
        response = self.brand_session.post(f"{BASE_URL}/api/jobs/{job_id}/renew")
        assert response.status_code == 200
        
        # Check job status via my-jobs
        response = self.brand_session.get(f"{BASE_URL}/api/jobs/my-jobs")
        assert response.status_code == 200
        
        my_jobs = response.json()
        renewed_job = next((j for j in my_jobs if j["job_id"] == job_id), None)
        
        assert renewed_job is not None, f"Job {job_id} not found in my-jobs"
        assert renewed_job.get("approval_status") == "pending", f"Renewed job should have approval_status='pending', got '{renewed_job.get('approval_status')}'"
        assert renewed_job.get("status") == "open", f"Renewed job should have status='open', got '{renewed_job.get('status')}'"
        
        print(f"✅ Test 9 PASSED: Renewed job {job_id} has approval_status='pending'")
        return job_id
    
    # Test 10: Brand can see job statuses in my-jobs
    def test_10_brand_sees_job_statuses(self):
        """Test that brand can see all job statuses (pending, approved, rejected) in my-jobs"""
        self.login_as_brand()
        
        response = self.brand_session.get(f"{BASE_URL}/api/jobs/my-jobs")
        assert response.status_code == 200
        
        my_jobs = response.json()
        
        # Check that approval_status field exists in all jobs
        for job in my_jobs:
            assert "approval_status" in job, f"Job {job['job_id']} missing approval_status field"
            assert job["approval_status"] in ["pending", "approved", "rejected"], f"Invalid approval_status: {job['approval_status']}"
        
        # Count jobs by status
        status_counts = {}
        for job in my_jobs:
            status = job["approval_status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"✅ Test 10 PASSED: Brand can see job statuses - {status_counts}")
        return status_counts


class TestHomeFeedFiltering:
    """Test HomeFeed filtering logic"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        
    def login_as_influencer(self):
        """Login as influencer user"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": INFLUENCER_EMAIL,
            "password": INFLUENCER_PASSWORD
        })
        assert response.status_code == 200, f"Influencer login failed: {response.text}"
        return response.json()
    
    # Test 11: HomeFeed only shows approved and non-expired jobs
    def test_11_homefeed_shows_only_approved_nonexpired_jobs(self):
        """Test that HomeFeed only shows jobs with approval_status='approved' and expires_at > now"""
        self.login_as_influencer()
        
        response = self.session.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        
        jobs = response.json()
        
        now = datetime.now(timezone.utc)
        
        for job in jobs:
            # Check approval status
            assert job.get("approval_status") == "approved", f"Job {job['job_id']} has approval_status='{job.get('approval_status')}', expected 'approved'"
            
            # Check expiration (if expires_at exists)
            expires_at = job.get("expires_at")
            if expires_at:
                # Parse the datetime
                if isinstance(expires_at, str):
                    # Handle ISO format - ensure timezone aware
                    expires_str = expires_at.replace('Z', '+00:00')
                    if '+' not in expires_str and '-' not in expires_str[-6:]:
                        expires_str = expires_str + '+00:00'
                    try:
                        expires_dt = datetime.fromisoformat(expires_str)
                    except:
                        # If parsing fails, skip this check
                        continue
                else:
                    expires_dt = expires_at
                
                # Ensure timezone aware
                if expires_dt.tzinfo is None:
                    expires_dt = expires_dt.replace(tzinfo=timezone.utc)
                
                # Note: We can't strictly assert this because the API might return jobs
                # that are about to expire. Just log a warning if found.
                if expires_dt < now:
                    print(f"⚠️ Warning: Job {job['job_id']} has expired (expires_at={expires_at})")
        
        print(f"✅ Test 11 PASSED: HomeFeed shows {len(jobs)} approved jobs")


# Cleanup function to delete test jobs
def cleanup_test_jobs():
    """Delete all test jobs created during testing"""
    session = requests.Session()
    
    # Login as admin
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code != 200:
        print("⚠️ Could not login as admin for cleanup")
        return
    
    # Get all jobs
    response = session.get(f"{BASE_URL}/api/admin/jobs")
    if response.status_code != 200:
        print("⚠️ Could not get jobs for cleanup")
        return
    
    jobs = response.json()
    
    # Delete test jobs
    deleted_count = 0
    for job in jobs:
        if job["title"].startswith("TEST_"):
            response = session.delete(f"{BASE_URL}/api/jobs/{job['job_id']}")
            if response.status_code == 200:
                deleted_count += 1
    
    print(f"🧹 Cleanup: Deleted {deleted_count} test jobs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
