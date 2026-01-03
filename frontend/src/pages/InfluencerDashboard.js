import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Briefcase, Send, MessageCircle, Plus, Edit, Star, TrendingUp, BarChart3, Award, Users, Eye, Image, Video, FileText, Trash2, Upload, X, Loader2, FileIcon } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const InfluencerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditStats, setShowEditStats] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [mediaFilter, setMediaFilter] = useState('all');
  const [uploading, setUploading] = useState(false);

  const [statsForm, setStatsForm] = useState({
    instagram_followers: '',
    instagram_engagement: '',
    tiktok_followers: '',
    tiktok_engagement: '',
    youtube_subscribers: '',
    youtube_avg_views: '',
    twitter_followers: ''
  });

  const [profileForm, setProfileForm] = useState({
    bio: '',
    specialties: [],
    starting_price: '',
    social_media: {
      instagram: '',
      tiktok: '',
      youtube: '',
      twitter: '',
      linkedin: '',
      facebook: ''
    },
    image_url: '',
    portfolio_items: []
  });

  const specialtiesList = [
    'Moda', 'Lifestyle', 'Güzellik', 'Teknoloji', 'Oyun', 'İnceleme',
    'Yemek', 'Mutfak', 'Tarif', 'Fitness', 'Sağlık', 'Motivasyon',
    'Seyahat', 'Vlog', 'Eğitim', 'İş Dünyası', 'Finans', 'Sanat'
  ];

  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook'];

  const categories = [
    'Ürün Tanıtımı', 'Story Paylaşımı', 'Video İçerik', 'Reklam Kampanyası',
    'Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Marka Elçiliği', 'Etkinlik Tanıtımı'
  ];

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'profile') {
        fetchProfile();
        fetchStats();
        fetchReviews();
      } else if (activeTab === 'jobs') {
        fetchJobs();
      } else if (activeTab === 'applications') {
        fetchApplications();
      } else if (activeTab === 'matches') {
        fetchMatches();
      } else if (activeTab === 'stats') {
        fetchStats();
      } else if (activeTab === 'reviews') {
        fetchReviews();
      } else if (activeTab === 'media') {
        fetchMediaLibrary();
      }
    }
  }, [user, activeTab, filterCategory, filterPlatform]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/profile/me`, {
        withCredentials: true
      });
      if (response.data) {
        setProfile(response.data);
        setProfileForm({
          bio: response.data.bio || '',
          specialties: response.data.specialties || [],
          starting_price: response.data.starting_price || '',
          social_media: response.data.social_media || {
            instagram: '',
            tiktok: '',
            youtube: '',
            twitter: '',
            linkedin: '',
            facebook: ''
          },
          image_url: response.data.image_url || '',
          portfolio_items: response.data.portfolio_items || []
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterPlatform) params.append('platform', filterPlatform);
      params.append('status', 'open');
      
      const response = await axios.get(`${API_URL}/api/jobs?${params.toString()}`, {
        withCredentials: true
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/applications/my-applications`, {
        withCredentials: true
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/matches/my-matches`, {
        withCredentials: true
      });
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/influencer-stats/me`, {
        withCredentials: true
      });
      if (response.data) {
        setStats(response.data);
        setStatsForm({
          instagram_followers: response.data.instagram_followers || '',
          instagram_engagement: response.data.instagram_engagement || '',
          tiktok_followers: response.data.tiktok_followers || '',
          tiktok_engagement: response.data.tiktok_engagement || '',
          youtube_subscribers: response.data.youtube_subscribers || '',
          youtube_avg_views: response.data.youtube_avg_views || '',
          twitter_followers: response.data.twitter_followers || ''
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reviews/my-reviews`, {
        withCredentials: true
      });
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSaveStats = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        instagram_followers: statsForm.instagram_followers ? parseInt(statsForm.instagram_followers) : null,
        instagram_engagement: statsForm.instagram_engagement ? parseFloat(statsForm.instagram_engagement) : null,
        tiktok_followers: statsForm.tiktok_followers ? parseInt(statsForm.tiktok_followers) : null,
        tiktok_engagement: statsForm.tiktok_engagement ? parseFloat(statsForm.tiktok_engagement) : null,
        youtube_subscribers: statsForm.youtube_subscribers ? parseInt(statsForm.youtube_subscribers) : null,
        youtube_avg_views: statsForm.youtube_avg_views ? parseInt(statsForm.youtube_avg_views) : null,
        twitter_followers: statsForm.twitter_followers ? parseInt(statsForm.twitter_followers) : null
      };
      
      await axios.post(`${API_URL}/api/influencer-stats`, payload, {
        withCredentials: true
      });
      
      setShowEditStats(false);
      fetchStats();
      alert('İstatistikler başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving stats:', error);
      alert('İstatistikler kaydedilirken bir hata oluştu');
    }
  };

  const handleSubmitReview = async (matchId, rating, comment) => {
    try {
      await axios.post(`${API_URL}/api/reviews`, {
        match_id: matchId,
        rating: rating,
        comment: comment,
        review_type: 'influencer_to_brand'
      }, {
        withCredentials: true
      });
      
      setShowReviewModal(null);
      alert('Değerlendirmeniz gönderildi!');
      fetchMatches();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.detail || 'Değerlendirme gönderilirken bir hata oluştu');
    }
  };

  const fetchMediaLibrary = async () => {
    setLoading(true);
    try {
      const url = mediaFilter === 'all' 
        ? `${API_URL}/api/media-library`
        : `${API_URL}/api/media-library?file_type=${mediaFilter}`;
      
      const response = await axios.get(url, { withCredentials: true });
      setMediaLibrary(response.data);
    } catch (error) {
      console.error('Error fetching media library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMedia = async (file, tags, description) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tags', tags);
      formData.append('description', description);

      await axios.post(`${API_URL}/api/media-library`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowUploadModal(false);
      fetchMediaLibrary();
      alert('Dosya başarıyla yüklendi!');
    } catch (error) {
      console.error('Error uploading media:', error);
      alert(error.response?.data?.detail || 'Dosya yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`${API_URL}/api/media-library/${mediaId}`, { withCredentials: true });
      fetchMediaLibrary();
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Dosya silinirken bir hata oluştu');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/profile`, {
        ...profileForm,
        starting_price: parseFloat(profileForm.starting_price)
      }, {
        withCredentials: true
      });
      
      setShowEditProfile(false);
      fetchProfile();
      alert('Profil başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Profil kaydedilirken bir hata oluştu');
    }
  };

  const handleApplyJob = async (jobId, message) => {
    try {
      await axios.post(`${API_URL}/api/applications`, {
        job_id: jobId,
        message: message
      }, {
        withCredentials: true
      });
      
      setSelectedJob(null);
      alert('Başvurunuz gönderildi!');
      fetchApplications();
    } catch (error) {
      console.error('Error applying to job:', error);
      alert(error.response?.data?.detail || 'Başvuru gönderilirken bir hata oluştu');
    }
  };

  const toggleSpecialty = (specialty) => {
    setProfileForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
      navigate('/');
    } catch (error) {
      navigate('/');
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-profile"
          >
            <User className="w-5 h-5" />
            Profilim
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-stats"
          >
            <BarChart3 className="w-5 h-5" />
            İstatistiklerim
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-reviews"
          >
            <Star className="w-5 h-5" />
            Değerlendirmeler
            {stats && stats.total_reviews > 0 && (
              <span className="bg-yellow-500/30 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                {stats.average_rating.toFixed(1)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'jobs'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-jobs"
          >
            <Briefcase className="w-5 h-5" />
            İş İlanları
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'applications'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-applications"
          >
            <Send className="w-5 h-5" />
            Başvurularım
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matches'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-matches"
          >
            <MessageCircle className="w-5 h-5" />
            Eşleşmeler & Sohbet
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Profilim</h2>
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                data-testid="edit-profile-btn"
              >
                {profile ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {profile ? 'Profili Düzenle' : 'Profil Oluştur'}
              </button>
            </div>

            {profile ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20" data-testid="profile-card">
                <div className="flex items-start gap-6 mb-6">
                  {profile.image_url && (
                    <img src={profile.image_url} alt={user.name} className="w-32 h-32 rounded-full object-cover" />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{user.name}</h3>
                    <p className="text-gray-300 mb-4">{profile.bio}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.specialties.map((specialty) => (
                        <span key={specialty} className="px-3 py-1 bg-purple-500/30 rounded-full text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <p className="text-green-400 font-bold text-xl">
                      Başlangıç Fiyatı: {profile.starting_price.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-lg font-semibold mb-4">Sosyal Medya</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {Object.entries(profile.social_media).map(([platform, handle]) => (
                      handle && (
                        <div key={platform} className="flex items-center gap-2 text-gray-300">
                          <span className="capitalize font-medium">{platform}:</span>
                          <span>{handle}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-4">Henüz profilinizi oluşturmadınız</p>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  Profil Oluştur
                </button>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">İş İlanları</h2>
            
            {/* Filters */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
                data-testid="filter-category"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
                data-testid="filter-platform"
              >
                <option value="">Tüm Platformlar</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform} className="capitalize">{platform}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Şu anda açık iş ilanı yok</p>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="jobs-list">
                {jobs.map((job) => (
                  <div key={job.job_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                        <p className="text-gray-400 mb-2">Marka: {job.brand_name}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-purple-500/30 rounded-full text-sm">{job.category}</span>
                          <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm font-semibold">{job.budget.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.platforms.map((platform) => (
                        <span key={platform} className="px-3 py-1 bg-blue-500/30 rounded-full text-sm capitalize">
                          {platform}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                      data-testid={`apply-job-${job.job_id}`}
                    >
                      Başvur
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Başvurularım</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Send className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz başvurunuz yok</p>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="applications-list">
                {applications.map((app) => (
                  <div key={app.application_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">İş ID: {app.job_id}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          app.status === 'pending' ? 'bg-yellow-500/30' :
                          app.status === 'accepted' ? 'bg-green-500/30' : 'bg-red-500/30'
                        }`}>
                          {app.status === 'pending' ? 'Beklemede' :
                           app.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300">{app.message}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Başvuru Tarihi: {new Date(app.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Eşleşmeler & Sohbet</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz eşleşmeniz yok</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {matches.map((match) => (
                  <div key={match.match_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20" data-testid={`match-${match.match_id}`}>
                    <h3 className="text-xl font-bold mb-2">{match.job_title}</h3>
                    <p className="text-gray-400 mb-4">Marka: <span className="text-white font-semibold">{match.brand_name}</span></p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedMatch(match)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                        data-testid={`open-chat-${match.match_id}`}
                      >
                        <MessageCircle className="w-5 h-5" />
                        Sohbet
                      </button>
                      <button
                        onClick={() => setShowReviewModal(match)}
                        className="flex-1 px-4 py-3 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                        data-testid={`review-btn-${match.match_id}`}
                      >
                        <Star className="w-5 h-5" />
                        Değerlendir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">İstatistiklerim</h2>
              <button
                onClick={() => setShowEditStats(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                data-testid="edit-stats-btn"
              >
                <Edit className="w-5 h-5" />
                {stats ? 'İstatistikleri Düzenle' : 'İstatistik Ekle'}
              </button>
            </div>

            {stats ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-8 h-8 text-purple-400" />
                      <span className="text-gray-400">Toplam Erişim</span>
                    </div>
                    <p className="text-3xl font-bold">{(stats.total_reach || 0).toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Star className="w-8 h-8 text-yellow-400" />
                      <span className="text-gray-400">Ortalama Puan</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}</p>
                    <p className="text-sm text-gray-400">{stats.total_reviews || 0} değerlendirme</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-8 h-8 text-green-400" />
                      <span className="text-gray-400">Tamamlanan İş</span>
                    </div>
                    <p className="text-3xl font-bold">{stats.completed_jobs || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-8 h-8 text-blue-400" />
                      <span className="text-gray-400">Rozet</span>
                    </div>
                    <p className="text-xl font-bold capitalize">{user?.badge || 'Yok'}</p>
                  </div>
                </div>

                {/* Platform Stats */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <h3 className="text-xl font-bold mb-6">Platform İstatistikleri</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Instagram */}
                    {(stats.instagram_followers || stats.instagram_engagement) && (
                      <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-4 border border-pink-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold">IG</span>
                          </div>
                          <span className="font-semibold">Instagram</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">Takipçi</p>
                            <p className="text-xl font-bold">{(stats.instagram_followers || 0).toLocaleString('tr-TR')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Engagement</p>
                            <p className="text-xl font-bold">{stats.instagram_engagement || 0}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TikTok */}
                    {(stats.tiktok_followers || stats.tiktok_engagement) && (
                      <div className="bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-xl p-4 border border-cyan-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold">TT</span>
                          </div>
                          <span className="font-semibold">TikTok</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">Takipçi</p>
                            <p className="text-xl font-bold">{(stats.tiktok_followers || 0).toLocaleString('tr-TR')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Engagement</p>
                            <p className="text-xl font-bold">{stats.tiktok_engagement || 0}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* YouTube */}
                    {(stats.youtube_subscribers || stats.youtube_avg_views) && (
                      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold">YT</span>
                          </div>
                          <span className="font-semibold">YouTube</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">Abone</p>
                            <p className="text-xl font-bold">{(stats.youtube_subscribers || 0).toLocaleString('tr-TR')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Ort. İzlenme</p>
                            <p className="text-xl font-bold">{(stats.youtube_avg_views || 0).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Twitter */}
                    {stats.twitter_followers && (
                      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold">X</span>
                          </div>
                          <span className="font-semibold">Twitter/X</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Takipçi</p>
                          <p className="text-xl font-bold">{(stats.twitter_followers || 0).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-4">Henüz istatistik eklemediniz</p>
                <p className="text-sm text-gray-500 mb-6">Sosyal medya istatistiklerinizi ekleyerek markaların sizi daha iyi tanımasını sağlayın</p>
                <button
                  onClick={() => setShowEditStats(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  İstatistik Ekle
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Değerlendirmeler</h2>
            
            {/* Rating Summary */}
            {stats && stats.total_reviews > 0 && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30 mb-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-yellow-400">{stats.average_rating.toFixed(1)}</p>
                    <div className="flex gap-1 justify-center my-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(stats.average_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">{stats.total_reviews} değerlendirme</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-6">{rating}</span>
                          <Star className="w-4 h-4 text-yellow-400" />
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz değerlendirme almadınız</p>
                <p className="text-sm text-gray-500 mt-2">İşleri tamamladıkça markalardan değerlendirme alacaksınız</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.review_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-lg">{review.reviewer_name}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowEditProfile(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-3xl w-full my-8 border border-white/20" onClick={(e) => e.stopPropagation()} data-testid="edit-profile-modal">
            <h2 className="text-3xl font-bold mb-6">Profil {profile ? 'Düzenle' : 'Oluştur'}</h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Biyografi</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Kendinizi tanıtın..."
                  data-testid="profile-bio-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Uzmanlık Alanları</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2">
                  {specialtiesList.map((specialty) => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                        profileForm.specialties.includes(specialty)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      data-testid={`specialty-${specialty}`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Başlangıç Fiyatı (₺)</label>
                <input
                  type="number"
                  value={profileForm.starting_price}
                  onChange={(e) => setProfileForm({ ...profileForm, starting_price: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
                  placeholder="5000"
                  data-testid="profile-price-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Profil Fotoğrafı URL (opsiyonel)</label>
                <input
                  type="url"
                  value={profileForm.image_url}
                  onChange={(e) => setProfileForm({ ...profileForm, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
                  placeholder="https://..."
                  data-testid="profile-image-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Sosyal Medya Hesapları</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {platforms.map((platform) => (
                    <div key={platform}>
                      <label className="block text-xs text-gray-400 mb-1 capitalize">{platform}</label>
                      <input
                        type="text"
                        value={profileForm.social_media[platform]}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          social_media: { ...profileForm.social_media, [platform]: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                        placeholder={`@kullaniciadi`}
                        data-testid={`social-${platform}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="save-profile-btn"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply to Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-white/20" onClick={(e) => e.stopPropagation()} data-testid="apply-job-modal">
            <h2 className="text-3xl font-bold mb-6">İşe Başvur</h2>
            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-2">{selectedJob.title}</h3>
              <p className="text-gray-400 mb-2">Marka: {selectedJob.brand_name}</p>
              <p className="text-gray-300">{selectedJob.description}</p>
              <p className="text-green-400 font-bold mt-4">{selectedJob.budget.toLocaleString('tr-TR')} ₺</p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const message = e.target.message.value;
              handleApplyJob(selectedJob.job_id, message);
            }}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Başvuru Mesajınız</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Neden bu iş için uygun olduğunuzu anlatın..."
                  data-testid="application-message-input"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="submit-application-btn"
                >
                  Başvuru Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {selectedMatch && (
        <ChatBox
          match={selectedMatch}
          currentUser={user}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Edit Stats Modal */}
      {showEditStats && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowEditStats(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-3xl w-full my-8 border border-white/20" onClick={(e) => e.stopPropagation()} data-testid="edit-stats-modal">
            <h2 className="text-3xl font-bold mb-6">İstatistikleri Düzenle</h2>
            <form onSubmit={handleSaveStats} className="space-y-6">
              {/* Instagram */}
              <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl p-4 border border-pink-500/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center text-sm font-bold">IG</div>
                  Instagram
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Takipçi Sayısı</label>
                    <input
                      type="number"
                      value={statsForm.instagram_followers}
                      onChange={(e) => setStatsForm({ ...statsForm, instagram_followers: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                      placeholder="150000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Engagement Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={statsForm.instagram_engagement}
                      onChange={(e) => setStatsForm({ ...statsForm, instagram_engagement: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                      placeholder="4.5"
                    />
                  </div>
                </div>
              </div>

              {/* TikTok */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-xl p-4 border border-cyan-500/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-lg flex items-center justify-center text-sm font-bold">TT</div>
                  TikTok
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Takipçi Sayısı</label>
                    <input
                      type="number"
                      value={statsForm.tiktok_followers}
                      onChange={(e) => setStatsForm({ ...statsForm, tiktok_followers: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Engagement Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={statsForm.tiktok_engagement}
                      onChange={(e) => setStatsForm({ ...statsForm, tiktok_engagement: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                      placeholder="8.2"
                    />
                  </div>
                </div>
              </div>

              {/* YouTube */}
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-sm font-bold">YT</div>
                  YouTube
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Abone Sayısı</label>
                    <input
                      type="number"
                      value={statsForm.youtube_subscribers}
                      onChange={(e) => setStatsForm({ ...statsForm, youtube_subscribers: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Ortalama İzlenme</label>
                    <input
                      type="number"
                      value={statsForm.youtube_avg_views}
                      onChange={(e) => setStatsForm({ ...statsForm, youtube_avg_views: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                      placeholder="25000"
                    />
                  </div>
                </div>
              </div>

              {/* Twitter */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center text-sm font-bold">X</div>
                  Twitter/X
                </h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Takipçi Sayısı</label>
                  <input
                    type="number"
                    value={statsForm.twitter_followers}
                    onChange={(e) => setStatsForm({ ...statsForm, twitter_followers: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditStats(false)}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="save-stats-btn"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          match={showReviewModal}
          onClose={() => setShowReviewModal(null)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
};

// Review Modal Component
const ReviewModal = ({ match, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Lütfen bir puan seçin');
      return;
    }
    onSubmit(match.match_id, rating, comment);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-8 max-w-lg w-full border border-white/20" onClick={(e) => e.stopPropagation()} data-testid="review-modal">
        <h2 className="text-2xl font-bold mb-2">Markayı Değerlendir</h2>
        <p className="text-gray-400 mb-6">{match.brand_name} - {match.job_title}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium mb-3">Puanınız</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400 mt-2">
              {rating === 1 && 'Çok Kötü'}
              {rating === 2 && 'Kötü'}
              {rating === 3 && 'Orta'}
              {rating === 4 && 'İyi'}
              {rating === 5 && 'Mükemmel'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">Yorumunuz</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 resize-none text-white"
              placeholder="Marka ile çalışma deneyiminizi paylaşın..."
              data-testid="review-comment-input"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold hover:scale-105 transition-transform"
              data-testid="submit-review-btn"
            >
              Gönder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InfluencerDashboard;
