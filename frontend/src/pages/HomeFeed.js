import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Briefcase, TrendingUp, Bell, Star, Heart, Search, Filter, Users, DollarSign, MapPin, Calendar, X, Send } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomeFeed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [trendingCategories, setTrendingCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applying, setApplying] = useState(false);

  const categories = [
    'Ürün Tanıtımı', 'Story Paylaşımı', 'Video İçerik', 'Reklam Kampanyası',
    'Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Marka Elçiliği', 'Etkinlik Tanıtımı'
  ];

  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook'];

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, filterCategory, filterPlatform]);

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

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchJobs(),
        fetchAnnouncements(),
        fetchTrendingCategories(),
        fetchRecommendations(),
        fetchFavorites()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
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
    }
  };

  const fetchAnnouncements = async () => {
    try {
      // Sadece pinned duyuruları getir (ana sayfada göstermek için)
      const response = await axios.get(`${API_URL}/api/announcements/pinned`, {
        withCredentials: true
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchTrendingCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/trending/categories`, {
        withCredentials: true
      });
      setTrendingCategories(response.data);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/recommendations`, {
        withCredentials: true
      });
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchFavorites = async () => {
    if (user.user_type === 'influencer') {
      try {
        const response = await axios.get(`${API_URL}/api/favorites`, {
          withCredentials: true
        });
        const favSet = new Set(response.data.map(job => job.job_id));
        setFavorites(favSet);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    }
  };

  const toggleFavorite = async (jobId) => {
    try {
      if (favorites.has(jobId)) {
        await axios.delete(`${API_URL}/api/favorites/${jobId}`, {
          withCredentials: true
        });
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await axios.post(`${API_URL}/api/favorites/${jobId}`, {}, {
          withCredentials: true
        });
        setFavorites(prev => new Set([...prev, jobId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
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

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    
    setApplying(true);
    try {
      await axios.post(`${API_URL}/api/jobs/${selectedJob.job_id}/apply`, {
        message: applicationMessage
      }, {
        withCredentials: true
      });
      
      setSelectedJob(null);
      setApplicationMessage('');
      alert('Başvurunuz başarıyla gönderildi!');
    } catch (error) {
      console.error('Error applying:', error);
      alert(error.response?.data?.detail || 'Başvuru gönderilirken bir hata oluştu');
    } finally {
      setApplying(false);
    }
  };

  const openApplicationModal = (job) => {
    setSelectedJob(job);
    setApplicationMessage('');
  };

  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return job.title.toLowerCase().includes(query) ||
             job.description.toLowerCase().includes(query) ||
             job.brand_name.toLowerCase().includes(query);
    }
    return true;
  });

  const getAnnouncementIcon = (type) => {
    if (type === 'news') return <Bell className="w-5 h-5 text-blue-400" />;
    if (type === 'update') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (type === 'promotion') return <Star className="w-5 h-5 text-yellow-400" />;
    return <Bell className="w-5 h-5" />;
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Hoş geldin, <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">{user.name}</span>! 👋
          </h1>
          <p className="text-gray-400">Platform'da neler oluyor, hemen keşfet!</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-2xl font-bold">Senin İçin Önerilen İlanlar</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 4).map((job) => (
                    <JobCard
                      key={job.job_id}
                      job={job}
                      isFavorite={favorites.has(job.job_id)}
                      onToggleFavorite={toggleFavorite}
                      userType={user.user_type}
                      onApply={openApplicationModal}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Search & Filter */}
            <section id="jobs">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="İlan ara (başlık, açıklama, marka)"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
                      data-testid="search-input"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white"
                    data-testid="filter-category"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="" className="bg-gray-800 text-white">Tüm Kategoriler</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-800 text-white">{cat}</option>
                    ))}
                  </select>
                  <select
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white"
                    data-testid="filter-platform"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="" className="bg-gray-800 text-white">Tüm Platformlar</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform} className="capitalize bg-gray-800 text-white">{platform}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jobs Feed */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Tüm İş İlanları ({filteredJobs.length})</h2>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Kriterlere uygun ilan bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-4" data-testid="jobs-feed">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.job_id}
                      job={job}
                      isFavorite={favorites.has(job.job_id)}
                      onToggleFavorite={toggleFavorite}
                      userType={user.user_type}
                      onApply={openApplicationModal}
                      expanded
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Right Column (1/3) */}
          <div className="space-y-6">
            {/* Announcements */}
            <section id="announcements">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  Önemli Duyurular
                </h3>
                <button
                  onClick={() => navigate('/announcements')}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Tümünü Gör →
                </button>
              </div>
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                    <p className="text-sm text-gray-400">Henüz duyuru yok</p>
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <div
                      key={announcement.announcement_id}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-purple-500/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/announcements')}
                      data-testid={`announcement-${announcement.announcement_id}`}
                    >
                      <div className="flex items-start gap-3">
                        {getAnnouncementIcon(announcement.type)}
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{announcement.title}</h4>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{announcement.content}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Trending Categories */}
            <section>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Trend Kategoriler
              </h3>
              <div className="space-y-2">
                {trendingCategories.map((item) => (
                  <button
                    key={item.category}
                    onClick={() => {
                      setFilterCategory(item.category);
                      document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:border-purple-500/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-sm text-purple-400">{item.count} ilan</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Platform Stats */}
            <section>
              <h3 className="text-xl font-bold mb-4">Platform İstatistikleri</h3>
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Aktif İlanlar
                  </span>
                  <span className="font-bold text-lg">{jobs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Online Kullanıcılar
                  </span>
                  <span className="font-bold text-lg text-green-400">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Bu Hafta Eşleşme
                  </span>
                  <span className="font-bold text-lg text-blue-400">43</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-white/20" onClick={(e) => e.stopPropagation()} data-testid="application-modal">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">İşe Başvur</h2>
                <p className="text-gray-400">{selectedJob.title}</p>
                <p className="text-sm text-purple-400">{selectedJob.brand_name}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Job Details */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Bütçe:</span>
                  <span className="ml-2 font-semibold text-green-400">{selectedJob.budget.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div>
                  <span className="text-gray-400">Kategori:</span>
                  <span className="ml-2">{selectedJob.category}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Platformlar:</span>
                  <span className="ml-2">{selectedJob.platforms.join(', ')}</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 mt-4">{selectedJob.description}</p>
            </div>

            <form onSubmit={handleApply} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Başvuru Mesajınız</label>
                <textarea
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 resize-none text-white"
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
                  disabled={applying}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="submit-application-btn"
                >
                  <Send className="w-5 h-5" />
                  {applying ? 'Gönderiliyor...' : 'Başvuru Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Job Card Component
const JobCard = ({ job, isFavorite, onToggleFavorite, userType, onApply, expanded = false }) => {

  return (
    <div
      className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all ${
        expanded ? '' : 'hover:scale-105'
      }`}
      data-testid={`job-card-${job.job_id}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <div>
              <h3 className="text-xl font-bold mb-1 hover:text-purple-400 transition-colors cursor-pointer">
                {job.title}
              </h3>
              <p className="text-sm text-gray-400">
                <span className="text-purple-400 font-medium">{job.brand_name}</span>
              </p>
            </div>
          </div>
          <p className="text-gray-300 mb-3 line-clamp-2">{job.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 bg-purple-500/30 rounded-full text-sm">{job.category}</span>
            <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {job.budget.toLocaleString('tr-TR')} ₺
            </span>
            {job.platforms.map((platform) => (
              <span key={platform} className="px-3 py-1 bg-blue-500/30 rounded-full text-sm capitalize">
                {platform}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(job.created_at).toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {userType === 'influencer' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(job.job_id);
              }}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
              data-testid={`favorite-btn-${job.job_id}`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        {userType === 'influencer' && (
          <button
            onClick={() => onApply(job)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:scale-105 transition-transform text-sm font-bold"
            data-testid={`apply-btn-${job.job_id}`}
          >
            Başvur
          </button>
        )}
      </div>
    </div>
  );
};

export default HomeFeed;
