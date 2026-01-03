"""
Test Etap 3 Features - Admin Panel Enhancements
- Dashboard Stats with detailed statistics
- Popup Notification Management
- Activity Logs
- Content Management (Blog, Success Stories, Events, FAQ)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://influencer-hub-110.preview.emergentagent.com')

class TestAdminDashboardStats:
    """Test /api/admin/dashboard-stats endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@flulance.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        # Extract session token from cookies
        self.session_token = response.cookies.get('session_token')
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
    
    def test_dashboard_stats_returns_user_stats(self):
        """Dashboard stats should return user statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "users" in data
        assert "total" in data["users"]
        assert "brands" in data["users"]
        assert "influencers" in data["users"]
        assert "growth" in data["users"]
        assert isinstance(data["users"]["growth"], list)
    
    def test_dashboard_stats_returns_job_stats(self):
        """Dashboard stats should return job statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "jobs" in data
        assert "total" in data["jobs"]
        assert "open" in data["jobs"]
        assert "pending" in data["jobs"]
        assert "approved" in data["jobs"]
    
    def test_dashboard_stats_returns_match_stats(self):
        """Dashboard stats should return match statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "matches" in data
        assert "total" in data["matches"]
        assert "active" in data["matches"]
        assert "completed" in data["matches"]
    
    def test_dashboard_stats_returns_application_stats(self):
        """Dashboard stats should return application statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "applications" in data
        assert "total" in data["applications"]
        assert "pending" in data["applications"]
        assert "accepted" in data["applications"]
    
    def test_dashboard_stats_returns_category_distribution(self):
        """Dashboard stats should return category distribution for bar chart"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)
        if len(data["categories"]) > 0:
            assert "name" in data["categories"][0]
            assert "count" in data["categories"][0]
    
    def test_dashboard_stats_requires_admin(self):
        """Dashboard stats should require admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats")
        assert response.status_code == 401


class TestPopupSettings:
    """Test popup notification management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@flulance.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.session_token = response.cookies.get('session_token')
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
    
    def test_get_admin_popup_settings(self):
        """Admin should be able to get popup settings"""
        response = requests.get(f"{BASE_URL}/api/admin/popup-settings", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "enabled" in data
        assert "title" in data
        assert "content" in data
        assert "button_text" in data
    
    def test_update_popup_settings(self):
        """Admin should be able to update popup settings"""
        test_title = f"Test Popup {uuid.uuid4().hex[:8]}"
        
        response = requests.put(f"{BASE_URL}/api/admin/popup-settings", 
            headers=self.headers,
            json={
                "enabled": True,
                "title": test_title,
                "content": "Test content",
                "button_text": "OK",
                "button_link": "/test",
                "show_once": True
            }
        )
        assert response.status_code == 200
        
        # Verify update
        response = requests.get(f"{BASE_URL}/api/admin/popup-settings", headers=self.headers)
        data = response.json()
        assert data["title"] == test_title
    
    def test_public_popup_settings_returns_enabled_popup(self):
        """Public endpoint should return popup if enabled"""
        # First enable popup
        requests.put(f"{BASE_URL}/api/admin/popup-settings", 
            headers=self.headers,
            json={
                "enabled": True,
                "title": "Public Test",
                "content": "Public content",
                "button_text": "OK",
                "button_link": "",
                "show_once": True
            }
        )
        
        # Check public endpoint
        response = requests.get(f"{BASE_URL}/api/popup-settings")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("enabled") == True
        assert "title" in data
    
    def test_public_popup_settings_returns_disabled_when_off(self):
        """Public endpoint should return enabled=false when disabled"""
        # Disable popup
        requests.put(f"{BASE_URL}/api/admin/popup-settings", 
            headers=self.headers,
            json={
                "enabled": False,
                "title": "Disabled",
                "content": "Content",
                "button_text": "OK",
                "button_link": "",
                "show_once": True
            }
        )
        
        # Check public endpoint
        response = requests.get(f"{BASE_URL}/api/popup-settings")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("enabled") == False


class TestActivityLogs:
    """Test activity logs endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@flulance.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.session_token = response.cookies.get('session_token')
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
    
    def test_get_activity_logs(self):
        """Admin should be able to get activity logs"""
        response = requests.get(f"{BASE_URL}/api/admin/activity-logs", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_activity_logs_requires_admin(self):
        """Activity logs should require admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/activity-logs")
        assert response.status_code == 401


class TestContentManagement:
    """Test content management endpoints (Blog, Success Stories, Events, FAQ)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@flulance.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        self.session_token = response.cookies.get('session_token')
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        self.created_content_ids = []
    
    def teardown_method(self):
        """Clean up created content"""
        for content_id in self.created_content_ids:
            try:
                requests.delete(f"{BASE_URL}/api/admin/content/{content_id}", headers=self.headers)
            except:
                pass
    
    def test_create_blog_content(self):
        """Admin should be able to create blog content"""
        response = requests.post(f"{BASE_URL}/api/admin/content",
            headers=self.headers,
            json={
                "content_type": "blog",
                "title": f"TEST_Blog_{uuid.uuid4().hex[:8]}",
                "content": "Test blog content",
                "summary": "Test summary",
                "author": "Test Author",
                "is_published": True,
                "is_featured": False,
                "tags": ["test"]
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "content_id" in data
        assert data["content_type"] == "blog"
        self.created_content_ids.append(data["content_id"])
    
    def test_create_faq_content(self):
        """Admin should be able to create FAQ content"""
        response = requests.post(f"{BASE_URL}/api/admin/content",
            headers=self.headers,
            json={
                "content_type": "faq",
                "question": f"TEST_Question_{uuid.uuid4().hex[:8]}?",
                "answer": "Test answer",
                "category": "Genel",
                "is_published": True,
                "order": 1
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "content_id" in data
        assert data["content_type"] == "faq"
        assert "question" in data
        assert "answer" in data
        self.created_content_ids.append(data["content_id"])
    
    def test_create_event_content(self):
        """Admin should be able to create event content"""
        response = requests.post(f"{BASE_URL}/api/admin/content",
            headers=self.headers,
            json={
                "content_type": "event",
                "title": f"TEST_Event_{uuid.uuid4().hex[:8]}",
                "content": "Test event description",
                "event_date": "2026-02-01",
                "event_link": "https://example.com",
                "event_type": "webinar",
                "is_published": True
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "content_id" in data
        assert data["content_type"] == "event"
        self.created_content_ids.append(data["content_id"])
    
    def test_create_success_story_content(self):
        """Admin should be able to create success story content"""
        response = requests.post(f"{BASE_URL}/api/admin/content",
            headers=self.headers,
            json={
                "content_type": "success_stories",
                "title": f"TEST_Story_{uuid.uuid4().hex[:8]}",
                "content": "Test success story content",
                "summary": "Test summary",
                "is_published": True,
                "is_featured": True
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "content_id" in data
        assert data["content_type"] == "success_stories"
        self.created_content_ids.append(data["content_id"])
    
    def test_get_admin_content_by_type(self):
        """Admin should be able to get content by type"""
        # Create a blog first
        create_response = requests.post(f"{BASE_URL}/api/admin/content",
            headers=self.headers,
            json={
                "content_type": "blog",
                "title": f"TEST_GetBlog_{uuid.uuid4().hex[:8]}",
                "content": "Test content",
                "is_published": True
            }
        )
        content_id = create_response.json()["content_id"]
        self.created_content_ids.append(content_id)
        
        # Get blog content
        response = requests.get(f"{BASE_URL}/api/admin/content/blog", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_content(self):
        """Admin should be able to update content"""
        # Create content first
        create_response = requests.post(f"{BASE_URL}/api/admin/content",
            headers=self.headers,
            json={
                "content_type": "blog",
                "title": "Original Title",
                "content": "Original content",
                "is_published": False
            }
        )
        content_id = create_response.json()["content_id"]
        self.created_content_ids.append(content_id)
        
        # Update content
        response = requests.put(f"{BASE_URL}/api/admin/content/{content_id}",
            headers=self.headers,
            json={
                "title": "Updated Title",
                "is_published": True
            }
        )
        assert response.status_code == 200
    
    def test_delete_content(self):
        """Admin should be able to delete content"""
        # Create content first
        create_response = requests.post(f"{BASE_URL}/api/admin/content",
            headers=self.headers,
            json={
                "content_type": "blog",
                "title": "To Delete",
                "content": "Delete me",
                "is_published": False
            }
        )
        content_id = create_response.json()["content_id"]
        
        # Delete content
        response = requests.delete(f"{BASE_URL}/api/admin/content/{content_id}", headers=self.headers)
        assert response.status_code == 200
    
    def test_public_content_endpoint(self):
        """Public endpoint should return published content"""
        # Create published content
        create_response = requests.post(f"{BASE_URL}/api/admin/content",
            headers=self.headers,
            json={
                "content_type": "blog",
                "title": f"TEST_Public_{uuid.uuid4().hex[:8]}",
                "content": "Public content",
                "is_published": True
            }
        )
        content_id = create_response.json()["content_id"]
        self.created_content_ids.append(content_id)
        
        # Get public content
        response = requests.get(f"{BASE_URL}/api/content/blog")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_content_requires_admin(self):
        """Content management should require admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/content/blog")
        assert response.status_code == 401
        
        response = requests.post(f"{BASE_URL}/api/admin/content", json={"content_type": "blog"})
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
