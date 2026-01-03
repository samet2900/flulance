"""
FLULANCE API Backend Tests - FAZ 3
Tests for File Upload, Chat Attachments, Contracts, Milestones, Media Library, and Advanced Search
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://influmarket-11.preview.emergentagent.com')

# Test credentials
INFLUENCER_USER = {"email": "ayse@influencer.com", "password": "test123"}
BRAND_USER = {"email": "marka@test.com", "password": "test123"}
ADMIN_USER = {"email": "admin@flulance.com", "password": "admin123"}


class TestFileUploadEndpoint:
    """File upload endpoint tests (FAZ 3)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as influencer and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=INFLUENCER_USER
        )
        assert login_response.status_code == 200, f"Influencer login failed: {login_response.text}"
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        self.user_data = login_response.json()
        print(f"Logged in as influencer: {self.user_data.get('name')}")
    
    def test_upload_image_file(self):
        """Test uploading an image file"""
        # Create a simple test image (1x1 PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('test_image.png', io.BytesIO(png_data), 'image/png')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload",
            headers=self.headers,
            files=files
        )
        assert response.status_code == 200, f"Upload failed: {response.text}"
        
        data = response.json()
        assert "filename" in data
        assert "url" in data
        assert data["file_type"] == "image"
        assert data["original_filename"] == "test_image.png"
        print(f"Image uploaded: {data['url']}")
    
    def test_upload_pdf_file(self):
        """Test uploading a PDF file"""
        # Simple PDF content
        pdf_data = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n116\n%%EOF'
        
        files = {
            'file': ('test_document.pdf', io.BytesIO(pdf_data), 'application/pdf')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload",
            headers=self.headers,
            files=files
        )
        assert response.status_code == 200, f"Upload failed: {response.text}"
        
        data = response.json()
        assert data["file_type"] == "document"
        print(f"PDF uploaded: {data['url']}")
    
    def test_upload_without_auth(self):
        """Test that upload requires authentication"""
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('test.png', io.BytesIO(png_data), 'image/png')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/upload",
            files=files
        )
        assert response.status_code == 401
        print("Upload without auth correctly rejected")


class TestMediaLibraryEndpoints:
    """Media Library endpoint tests (FAZ 3)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as influencer and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=INFLUENCER_USER
        )
        assert login_response.status_code == 200, f"Influencer login failed: {login_response.text}"
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        self.user_data = login_response.json()
    
    def test_upload_to_media_library(self):
        """Test uploading file to media library with tags"""
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('portfolio_image.png', io.BytesIO(png_data), 'image/png')
        }
        data = {
            'tags': 'portfolio, test, faz3',
            'description': 'Test portfolio image for FAZ 3'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/media-library",
            headers=self.headers,
            files=files,
            data=data
        )
        assert response.status_code == 200, f"Media library upload failed: {response.text}"
        
        result = response.json()
        assert "media_id" in result
        assert result["file_type"] == "image"
        assert "portfolio" in result["tags"]
        assert result["description"] == "Test portfolio image for FAZ 3"
        print(f"Media uploaded to library: {result['media_id']}")
        
        # Store for later tests
        self.uploaded_media_id = result["media_id"]
        return result["media_id"]
    
    def test_get_media_library(self):
        """Test getting media library"""
        response = requests.get(
            f"{BASE_URL}/api/media-library",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} items in media library")
        
        if len(data) > 0:
            item = data[0]
            assert "media_id" in item
            assert "url" in item
            assert "file_type" in item
    
    def test_get_media_library_filtered(self):
        """Test getting media library with file type filter"""
        response = requests.get(
            f"{BASE_URL}/api/media-library?file_type=image",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # All items should be images
        for item in data:
            assert item["file_type"] == "image"
        print(f"Found {len(data)} images in media library")
    
    def test_delete_media_from_library(self):
        """Test deleting media from library"""
        # First upload a file
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('to_delete.png', io.BytesIO(png_data), 'image/png')
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/media-library",
            headers=self.headers,
            files=files,
            data={'tags': 'delete_test', 'description': 'To be deleted'}
        )
        assert upload_response.status_code == 200
        media_id = upload_response.json()["media_id"]
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/media-library/{media_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"Media {media_id} deleted successfully")
        
        # Verify it's gone
        get_response = requests.get(
            f"{BASE_URL}/api/media-library",
            headers=self.headers
        )
        media_list = get_response.json()
        media_ids = [m["media_id"] for m in media_list]
        assert media_id not in media_ids
        print("Verified: Media no longer in library")


class TestContractEndpoints:
    """Contract endpoint tests (FAZ 3)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as brand user and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=BRAND_USER
        )
        assert login_response.status_code == 200, f"Brand login failed: {login_response.text}"
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        self.user_data = login_response.json()
        print(f"Logged in as brand: {self.user_data.get('name')}")
    
    def test_get_my_contracts(self):
        """Test getting contracts for current user"""
        response = requests.get(
            f"{BASE_URL}/api/contracts/my-contracts",
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} contracts")
    
    def test_create_contract_requires_match(self):
        """Test that contract creation requires a valid match"""
        contract_data = {
            "match_id": "invalid_match_id",
            "title": "Test Contract",
            "description": "Test contract description",
            "total_amount": 5000,
            "payment_terms": "milestone",
            "start_date": "2025-01-01",
            "end_date": "2025-02-01",
            "terms_and_conditions": "Test terms"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/contracts",
            headers=self.headers,
            json=contract_data
        )
        assert response.status_code == 404  # Match not found
        print("Contract creation with invalid match correctly rejected")
    
    def test_create_contract_with_valid_match(self):
        """Test creating a contract with a valid match"""
        # First get matches
        matches_response = requests.get(
            f"{BASE_URL}/api/matches/my-matches",
            headers=self.headers
        )
        matches = matches_response.json()
        
        if len(matches) == 0:
            pytest.skip("No matches available for contract test")
        
        match = matches[0]
        match_id = match["match_id"]
        
        contract_data = {
            "match_id": match_id,
            "title": f"Test Contract for {match['job_title']}",
            "description": "Test contract description for FAZ 3 testing",
            "total_amount": 5000,
            "payment_terms": "milestone",
            "start_date": "2025-01-01",
            "end_date": "2025-02-01",
            "terms_and_conditions": "Test terms and conditions"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/contracts",
            headers=self.headers,
            json=contract_data
        )
        
        # May fail if contract already exists for this match
        if response.status_code == 400 and "already exists" in response.text:
            print("Contract already exists for this match - expected behavior")
            return
        
        assert response.status_code == 200, f"Contract creation failed: {response.text}"
        
        data = response.json()
        assert "contract_id" in data
        assert data["status"] == "draft"
        assert data["total_amount"] == 5000
        print(f"Contract created: {data['contract_id']}")


class TestChatWithAttachments:
    """Chat with attachments endpoint tests (FAZ 3)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as influencer and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=INFLUENCER_USER
        )
        assert login_response.status_code == 200, f"Influencer login failed: {login_response.text}"
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        self.user_data = login_response.json()
    
    def test_send_message_with_attachment(self):
        """Test sending a message with file attachment"""
        # Get matches
        matches_response = requests.get(
            f"{BASE_URL}/api/matches/my-matches",
            headers=self.headers
        )
        matches = matches_response.json()
        
        if len(matches) == 0:
            pytest.skip("No matches available for chat test")
        
        match_id = matches[0]["match_id"]
        
        # Create test image
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('chat_attachment.png', io.BytesIO(png_data), 'image/png')
        }
        data = {
            'message': 'Test message with attachment from FAZ 3 tests'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/matches/{match_id}/messages/with-attachment",
            headers=self.headers,
            files=files,
            data=data
        )
        assert response.status_code == 200, f"Send message with attachment failed: {response.text}"
        
        result = response.json()
        assert "message_id" in result
        assert result["message"] == "Test message with attachment from FAZ 3 tests"
        assert result["attachment"] is not None
        assert result["attachment"]["file_type"] == "image"
        print(f"Message with attachment sent: {result['message_id']}")
    
    def test_send_message_without_attachment(self):
        """Test sending a message without attachment (text only)"""
        # Get matches
        matches_response = requests.get(
            f"{BASE_URL}/api/matches/my-matches",
            headers=self.headers
        )
        matches = matches_response.json()
        
        if len(matches) == 0:
            pytest.skip("No matches available for chat test")
        
        match_id = matches[0]["match_id"]
        
        data = {
            'message': 'Test text-only message from FAZ 3 tests'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/matches/{match_id}/messages/with-attachment",
            headers=self.headers,
            data=data
        )
        assert response.status_code == 200, f"Send text message failed: {response.text}"
        
        result = response.json()
        assert result["message"] == "Test text-only message from FAZ 3 tests"
        assert result["attachment"] is None
        print(f"Text message sent: {result['message_id']}")
    
    def test_get_messages_with_attachments(self):
        """Test getting messages including those with attachments"""
        # Get matches
        matches_response = requests.get(
            f"{BASE_URL}/api/matches/my-matches",
            headers=self.headers
        )
        matches = matches_response.json()
        
        if len(matches) == 0:
            pytest.skip("No matches available for chat test")
        
        match_id = matches[0]["match_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/matches/{match_id}/messages",
            headers=self.headers
        )
        assert response.status_code == 200
        
        messages = response.json()
        assert isinstance(messages, list)
        
        # Check if any messages have attachments
        messages_with_attachments = [m for m in messages if m.get("attachment")]
        print(f"Found {len(messages)} messages, {len(messages_with_attachments)} with attachments")


class TestAdvancedSearchEndpoints:
    """Advanced search endpoint tests (FAZ 3)"""
    
    def test_search_jobs_basic(self):
        """Test basic job search"""
        response = requests.get(f"{BASE_URL}/api/search/jobs")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        assert "total" in data
        assert isinstance(data["results"], list)
        print(f"Found {data['total']} jobs in search")
    
    def test_search_jobs_with_query(self):
        """Test job search with text query"""
        response = requests.get(f"{BASE_URL}/api/search/jobs?q=instagram")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        print(f"Found {data['total']} jobs matching 'instagram'")
    
    def test_search_jobs_with_category_filter(self):
        """Test job search with category filter"""
        response = requests.get(f"{BASE_URL}/api/search/jobs?category=Ürün Tanıtımı")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        # All results should have the specified category
        for job in data["results"]:
            assert job["category"] == "Ürün Tanıtımı"
        print(f"Found {data['total']} jobs in 'Ürün Tanıtımı' category")
    
    def test_search_jobs_with_budget_filter(self):
        """Test job search with budget range filter"""
        response = requests.get(f"{BASE_URL}/api/search/jobs?min_budget=1000&max_budget=10000")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        # All results should be within budget range
        for job in data["results"]:
            assert job["budget"] >= 1000
            assert job["budget"] <= 10000
        print(f"Found {data['total']} jobs with budget 1000-10000")
    
    def test_search_jobs_with_platform_filter(self):
        """Test job search with platform filter"""
        response = requests.get(f"{BASE_URL}/api/search/jobs?platform=instagram")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        # All results should include instagram platform
        for job in data["results"]:
            assert "instagram" in job["platforms"]
        print(f"Found {data['total']} jobs for Instagram platform")
    
    def test_search_jobs_with_sorting(self):
        """Test job search with sorting"""
        # Sort by budget descending
        response = requests.get(f"{BASE_URL}/api/search/jobs?sort_by=budget&sort_order=desc")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        
        # Verify sorting
        if len(data["results"]) > 1:
            budgets = [job["budget"] for job in data["results"]]
            assert budgets == sorted(budgets, reverse=True)
            print(f"Jobs sorted by budget (desc): {budgets[:5]}...")
    
    def test_search_influencers_basic(self):
        """Test basic influencer search"""
        response = requests.get(f"{BASE_URL}/api/search/influencers")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        assert "total" in data
        print(f"Found {data['total']} influencers in search")
    
    def test_search_influencers_with_specialty(self):
        """Test influencer search with specialty filter"""
        response = requests.get(f"{BASE_URL}/api/search/influencers?specialty=Moda")
        assert response.status_code == 200
        
        data = response.json()
        assert "results" in data
        print(f"Found {data['total']} influencers with 'Moda' specialty")


class TestMilestoneEndpoints:
    """Milestone endpoint tests (FAZ 3)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as brand user and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=BRAND_USER
        )
        assert login_response.status_code == 200, f"Brand login failed: {login_response.text}"
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        self.user_data = login_response.json()
    
    def test_get_milestones_for_contract(self):
        """Test getting milestones for a contract"""
        # First get contracts
        contracts_response = requests.get(
            f"{BASE_URL}/api/contracts/my-contracts",
            headers=self.headers
        )
        contracts = contracts_response.json()
        
        if len(contracts) == 0:
            pytest.skip("No contracts available for milestone test")
        
        contract_id = contracts[0]["contract_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}/milestones",
            headers=self.headers
        )
        assert response.status_code == 200
        
        milestones = response.json()
        assert isinstance(milestones, list)
        print(f"Found {len(milestones)} milestones for contract {contract_id}")
    
    def test_create_milestone_for_contract(self):
        """Test creating a milestone for a contract"""
        # First get contracts
        contracts_response = requests.get(
            f"{BASE_URL}/api/contracts/my-contracts",
            headers=self.headers
        )
        contracts = contracts_response.json()
        
        if len(contracts) == 0:
            pytest.skip("No contracts available for milestone test")
        
        contract_id = contracts[0]["contract_id"]
        
        milestone_data = {
            "title": "Test Milestone - FAZ 3",
            "description": "Test milestone description",
            "due_date": "2025-01-15",
            "amount": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/contracts/{contract_id}/milestones",
            headers=self.headers,
            json=milestone_data
        )
        assert response.status_code == 200, f"Create milestone failed: {response.text}"
        
        data = response.json()
        assert "milestone_id" in data
        assert data["title"] == "Test Milestone - FAZ 3"
        assert data["status"] == "pending"
        print(f"Milestone created: {data['milestone_id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
