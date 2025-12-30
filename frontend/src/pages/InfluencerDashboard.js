import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Briefcase, Send, MessageCircle, Plus, Edit } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');

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
      } else if (activeTab === 'jobs') {
        fetchJobs();
      } else if (activeTab === 'applications') {
        fetchApplications();
      } else if (activeTab === 'matches') {
        fetchMatches();
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
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">FLULANCE</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Merhaba, <span className="text-white font-semibold">{user.name}</span></span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

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
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                      data-testid={`open-chat-${match.match_id}`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Sohbet Başlat
                    </button>
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
    </div>
  );
};

export default InfluencerDashboard;
