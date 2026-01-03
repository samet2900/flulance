"""
FLULANCE API Backend Tests - FAZ 2
Tests for Influencer Stats, Reviews, and Badge/Verification endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://influmarket-11.preview.emergentagent.com')

# Test credentials
INFLUENCER_USER = {"email": "ayse@influencer.com", "password": "test123"}
BRAND_USER = {"email": "marka@test.com", "password": "test123"}
ADMIN_USER = {"email": "admin@flulance.com", "password": "admin123"}


class TestInfluencerStatsEndpoints:
    """Influencer Statistics endpoint tests (FAZ 2)"""
    
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
    
    def test_get_my_stats_initial(self):
        """Test getting influencer stats (may be null initially)"""
        response = requests.get(
            f"{BASE_URL}/api/influencer-stats/me",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        # Stats may be null or contain data
        if data:
            assert "stats_id" in data
            assert "user_id" in data
            print(f"Stats found: total_reach={data.get('total_reach')}")
        else:
            print("No stats exist yet")
    
    def test_create_update_stats(self):
        """Test creating/updating influencer stats"""
        stats_data = {
            "instagram_followers": 150000,
            "instagram_engagement": 4.5,
            "tiktok_followers": 500000,
            "tiktok_engagement": 8.2,
            "youtube_subscribers": 100000,
            "youtube_avg_views": 25000,
            "twitter_followers": 50000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/influencer-stats",
            headers=self.headers,
            json=stats_data
        )
        assert response.status_code == 200, f"Create stats failed: {response.text}"
        
        data = response.json()
        assert data["instagram_followers"] == stats_data["instagram_followers"]
        assert data["instagram_engagement"] == stats_data["instagram_engagement"]
        assert data["tiktok_followers"] == stats_data["tiktok_followers"]
        assert data["youtube_subscribers"] == stats_data["youtube_subscribers"]
        assert "stats_id" in data
        assert "total_reach" in data
        # Total reach should be sum of all followers
        expected_reach = 150000 + 500000 + 100000 + 50000
        assert data["total_reach"] == expected_reach
        print(f"Stats created/updated: stats_id={data['stats_id']}, total_reach={data['total_reach']}")
        
        # Verify persistence with GET
        get_response = requests.get(
            f"{BASE_URL}/api/influencer-stats/me",
            headers=self.headers
        )
        assert get_response.status_code == 200
        fetched_data = get_response.json()
        assert fetched_data["instagram_followers"] == stats_data["instagram_followers"]
        assert fetched_data["total_reach"] == expected_reach
    
    def test_get_public_stats(self):
        """Test getting influencer stats by user_id (public endpoint)"""
        # First get my user_id
        user_id = self.user_data.get("user_id")
        
        response = requests.get(f"{BASE_URL}/api/influencer-stats/{user_id}")
        assert response.status_code == 200
        data = response.json()
        if data:
            assert data["user_id"] == user_id
            print(f"Public stats retrieved for user: {user_id}")
        else:
            print("No public stats found")


class TestReviewEndpoints:
    """Review/Rating endpoint tests (FAZ 2)"""
    
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
    
    def test_get_my_reviews(self):
        """Test getting reviews about me"""
        response = requests.get(
            f"{BASE_URL}/api/reviews/my-reviews",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} reviews about me")
    
    def test_get_given_reviews(self):
        """Test getting reviews I've given"""
        response = requests.get(
            f"{BASE_URL}/api/reviews/given",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} reviews I've given")
    
    def test_get_user_reviews_public(self):
        """Test getting reviews for a user (public endpoint)"""
        user_id = self.user_data.get("user_id")
        
        response = requests.get(f"{BASE_URL}/api/reviews/user/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} public reviews for user")


class TestReviewCreation:
    """Test review creation with match (FAZ 2)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as influencer and get matches"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=INFLUENCER_USER
        )
        assert login_response.status_code == 200
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        self.user_data = login_response.json()
    
    def test_get_matches_for_review(self):
        """Test getting matches to review"""
        response = requests.get(
            f"{BASE_URL}/api/matches/my-matches",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} matches")
        
        if len(data) > 0:
            match = data[0]
            assert "match_id" in match
            assert "brand_name" in match
            print(f"First match: {match['match_id']} with {match['brand_name']}")
    
    def test_create_review_validation(self):
        """Test review creation validation (rating must be 1-5)"""
        # First get a match
        matches_response = requests.get(
            f"{BASE_URL}/api/matches/my-matches",
            headers=self.headers
        )
        matches = matches_response.json()
        
        if len(matches) == 0:
            pytest.skip("No matches available for review test")
        
        match_id = matches[0]["match_id"]
        
        # Test invalid rating (0)
        review_data = {
            "match_id": match_id,
            "rating": 0,
            "comment": "Test review",
            "review_type": "influencer_to_brand"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            headers=self.headers,
            json=review_data
        )
        assert response.status_code == 400
        print("Invalid rating (0) correctly rejected")
        
        # Test invalid rating (6)
        review_data["rating"] = 6
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            headers=self.headers,
            json=review_data
        )
        assert response.status_code == 400
        print("Invalid rating (6) correctly rejected")


class TestBadgeEndpoints:
    """Badge/Verification endpoint tests (FAZ 2)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_USER
        )
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
        self.admin_data = login_response.json()
        print(f"Logged in as admin: {self.admin_data.get('name')}")
    
    def test_get_all_badges(self):
        """Test getting all badges (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/badges",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} badges in system")
    
    def test_get_users_for_badge(self):
        """Test getting users list for badge assignment"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Find non-admin users
        non_admin_users = [u for u in data if u["user_type"] != "admin"]
        print(f"Found {len(non_admin_users)} non-admin users for badge assignment")
        
        if len(non_admin_users) > 0:
            user = non_admin_users[0]
            print(f"First user: {user['name']} ({user['user_type']}) - badge: {user.get('badge')}")
    
    def test_award_badge_to_user(self):
        """Test awarding a badge to a user"""
        # Get users
        users_response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=self.headers
        )
        users = users_response.json()
        
        # Find an influencer user
        influencer_users = [u for u in users if u["user_type"] == "influencer"]
        if len(influencer_users) == 0:
            pytest.skip("No influencer users available for badge test")
        
        target_user = influencer_users[0]
        user_id = target_user["user_id"]
        
        # Award verified badge
        badge_data = {
            "badge_type": "verified",
            "reason": "API Test - Verified badge"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/badges/{user_id}",
            headers=self.headers,
            json=badge_data
        )
        assert response.status_code == 200, f"Award badge failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"Badge 'verified' awarded to user {user_id}")
        
        # Verify badge was assigned
        user_badges_response = requests.get(f"{BASE_URL}/api/badges/user/{user_id}")
        assert user_badges_response.status_code == 200
        badges_data = user_badges_response.json()
        assert badges_data["current_badge"] == "verified"
        print(f"Verified: User now has badge '{badges_data['current_badge']}'")
    
    def test_award_badge_invalid_type(self):
        """Test awarding invalid badge type"""
        # Get users
        users_response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=self.headers
        )
        users = users_response.json()
        
        non_admin_users = [u for u in users if u["user_type"] != "admin"]
        if len(non_admin_users) == 0:
            pytest.skip("No users available for badge test")
        
        user_id = non_admin_users[0]["user_id"]
        
        # Try invalid badge type
        badge_data = {
            "badge_type": "invalid_badge",
            "reason": "Test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/badges/{user_id}",
            headers=self.headers,
            json=badge_data
        )
        assert response.status_code == 400
        print("Invalid badge type correctly rejected")
    
    def test_remove_badge_from_user(self):
        """Test removing a badge from a user"""
        # Get users
        users_response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=self.headers
        )
        users = users_response.json()
        
        # Find user with badge
        users_with_badge = [u for u in users if u.get("badge")]
        if len(users_with_badge) == 0:
            pytest.skip("No users with badges to remove")
        
        target_user = users_with_badge[0]
        user_id = target_user["user_id"]
        
        response = requests.delete(
            f"{BASE_URL}/api/admin/badges/{user_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Badge removed from user {user_id}")
        
        # Verify badge was removed
        user_badges_response = requests.get(f"{BASE_URL}/api/badges/user/{user_id}")
        assert user_badges_response.status_code == 200
        badges_data = user_badges_response.json()
        assert badges_data["current_badge"] is None
        print("Verified: User badge is now None")


class TestBadgeNonAdminAccess:
    """Test badge endpoints with non-admin user (should fail)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as influencer (non-admin)"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=INFLUENCER_USER
        )
        assert login_response.status_code == 200
        
        self.session_token = login_response.cookies.get("session_token")
        self.headers = {"Authorization": f"Bearer {self.session_token}"}
    
    def test_non_admin_cannot_award_badge(self):
        """Test that non-admin cannot award badges"""
        badge_data = {
            "badge_type": "verified",
            "reason": "Test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/badges/some_user_id",
            headers=self.headers,
            json=badge_data
        )
        assert response.status_code == 403
        print("Non-admin correctly denied badge award access")
    
    def test_non_admin_cannot_get_all_badges(self):
        """Test that non-admin cannot get all badges"""
        response = requests.get(
            f"{BASE_URL}/api/admin/badges",
            headers=self.headers
        )
        assert response.status_code == 403
        print("Non-admin correctly denied badge list access")


class TestPublicBadgeEndpoints:
    """Test public badge endpoints"""
    
    def test_get_user_badges_public(self):
        """Test getting user badges (public endpoint)"""
        # First login to get a user_id
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=INFLUENCER_USER
        )
        user_id = login_response.json().get("user_id")
        
        response = requests.get(f"{BASE_URL}/api/badges/user/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "current_badge" in data
        assert "badge_history" in data
        print(f"User badge info: current={data['current_badge']}, history_count={len(data['badge_history'])}")


class TestTopInfluencers:
    """Test top influencers endpoint"""
    
    def test_get_top_influencers(self):
        """Test getting top influencers by rating and reach"""
        response = requests.get(f"{BASE_URL}/api/influencer-stats/top-influencers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} top influencers")
        
        if len(data) > 0:
            top = data[0]
            assert "user" in top
            assert "stats" in top
            print(f"Top influencer: {top['user'].get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
