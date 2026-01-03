import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { 
  Briefcase, TrendingUp, Bell, Star, Heart, Search, Filter, Users, DollarSign, 
  MapPin, Calendar, X, Send, Grid, List, ChevronDown, ChevronUp, Zap, Award,
  Instagram, Youtube, Twitter, Clock, Eye, SlidersHorizontal
} from 'lucide-react';

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
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterBudgetMin, setFilterBudgetMin] = useState('');
  const [filterBudgetMax, setFilterBudgetMax] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterExperience, setFilterExperience] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  
  // View & Sort States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'budget_high', 'budget_low', 'popular'
  
  // Modal States
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applying, setApplying] = useState(false);

  const categories = [
    'Ürün Tanıtımı', 'Story Paylaşımı', 'Video İçerik', 'Reklam Kampanyası',
    'Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Marka Elçiliği', 'Etkinlik Tanıtımı'
  ];

  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook'];
  
  const cities = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 
    'Gaziantep', 'Mersin', 'Kayseri', 'Eskişehir', 'Trabzon', 'Samsun'
  ];
  
  const experienceLevels = [
    { value: 'beginner', label: 'Yeni Başlayan (0-1 yıl)' },
    { value: 'intermediate', label: 'Orta Seviye (1-3 yıl)' },
    { value: 'expert', label: 'Uzman (3+ yıl)' }
  ];
  
  const budgetRanges = [
    { min: 0, max: 1000, label: '₺0 - ₺1.000' },
    { min: 1000, max: 5000, label: '₺1.000 - ₺5.000' },
    { min: 5000, max: 10000, label: '₺5.000 - ₺10.000' },
    { min: 10000, max: 50000, label: '₺10.000 - ₺50.000' },
    { min: 50000, max: null, label: '₺50.000+' }
  ];

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
    if (user?.user_type === 'influencer') {
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
      await axios.post(`${API_URL}/api/applications`, {
        job_id: selectedJob.job_id,
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
  
  const clearFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterPlatform('');
    setFilterBudgetMin('');
    setFilterBudgetMax('');
    setFilterLocation('');
    setFilterExperience('');
  };
  
  const setBudgetRange = (min, max) => {
    setFilterBudgetMin(min.toString());
    setFilterBudgetMax(max ? max.toString() : '');
  };

  // Filter and Sort Jobs
  const filteredAndSortedJobs = React.useMemo(() => {
    let result = [...jobs];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.brand_name.toLowerCase().includes(query)
      );
    }
    
    // Budget filter
    if (filterBudgetMin) {
      result = result.filter(job => job.budget >= parseInt(filterBudgetMin));
    }
    if (filterBudgetMax) {
      result = result.filter(job => job.budget <= parseInt(filterBudgetMax));
    }
    
    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'budget_high':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'budget_low':
        result.sort((a, b) => a.budget - b.budget);
        break;
      case 'popular':
        result.sort((a, b) => (b.application_count || 0) - (a.application_count || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }
    
    // Featured jobs first
    result.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });
    
    return result;
  }, [jobs, searchQuery, filterBudgetMin, filterBudgetMax, sortBy]);

  const getAnnouncementIcon = (type) => {
    if (type === 'news') return <Bell className="w-5 h-5 text-blue-400" />;
    if (type === 'update') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (type === 'promotion') return <Star className="w-5 h-5 text-yellow-400" />;
    return <Bell className="w-5 h-5" />;
  };

  if (!user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Hoş geldin, <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">{user.name}</span>! 👋
          </h1>
          <p className="text-gray-400">Platform'da neler oluyor, hemen keşfet!</p>
        </div>

        {/* Featured Jobs / Öne Çıkan İlanlar */}
        {recommendations.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold">Öne Çıkan İlanlar</h2>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">VİTRİN</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.slice(0, 4).map((job) => (
                <FeaturedJobCard
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

        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters (Sahibinden Style) */}
          <aside className={`w-72 flex-shrink-0 ${showFilters ? '' : 'hidden lg:block'}`}>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 sticky top-24">
              {/* Filter Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-fuchsia-400" />
                  <span className="font-semibold">Filtreler</span>
                </div>
                <button 
                  onClick={clearFilters}
                  className="text-xs text-fuchsia-400 hover:text-fuchsia-300"
                >
                  Temizle
                </button>
              </div>
              
              {/* Category Filter */}
              <FilterSection title="Kategori" defaultOpen>
                <div className="space-y-1">
                  <button
                    onClick={() => setFilterCategory('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !filterCategory ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                    }`}
                  >
                    Tüm Kategoriler
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filterCategory === cat ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </FilterSection>
              
              {/* Platform Filter */}
              <FilterSection title="Platform">
                <div className="space-y-1">
                  <button
                    onClick={() => setFilterPlatform('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !filterPlatform ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                    }`}
                  >
                    Tüm Platformlar
                  </button>
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setFilterPlatform(platform)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize flex items-center gap-2 ${
                        filterPlatform === platform ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                      }`}
                    >
                      <PlatformIcon platform={platform} />
                      {platform}
                    </button>
                  ))}
                </div>
              </FilterSection>
              
              {/* Budget Filter */}
              <FilterSection title="Bütçe Aralığı">
                <div className="space-y-1">
                  {budgetRanges.map((range, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBudgetRange(range.min, range.max)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filterBudgetMin === range.min.toString() ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    placeholder="Min ₺"
                    value={filterBudgetMin}
                    onChange={(e) => setFilterBudgetMin(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-fuchsia-500"
                  />
                  <input
                    type="number"
                    placeholder="Max ₺"
                    value={filterBudgetMax}
                    onChange={(e) => setFilterBudgetMax(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </FilterSection>
              
              {/* Location Filter */}
              <FilterSection title="Konum">
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-fuchsia-500"
                  style={{colorScheme: 'dark'}}
                >
                  <option value="">Tüm Türkiye</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </FilterSection>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-800 mb-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="İlan ara (başlık, açıklama, marka)"
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    data-testid="search-input"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden px-4 py-3 bg-black/50 border border-gray-700 rounded-xl hover:border-fuchsia-500 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center justify-between mb-4 bg-gray-900/30 rounded-xl p-3 border border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">{filteredAndSortedJobs.length} ilan bulundu</span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-fuchsia-500"
                  style={{colorScheme: 'dark'}}
                  data-testid="sort-select"
                >
                  <option value="newest">En Yeni</option>
                  <option value="oldest">En Eski</option>
                  <option value="budget_high">Bütçe (Yüksek → Düşük)</option>
                  <option value="budget_low">Bütçe (Düşük → Yüksek)</option>
                  <option value="popular">Popülerlik</option>
                </select>
                
                {/* View Mode Toggle */}
                <div className="flex border border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid' ? 'bg-fuchsia-500 text-white' : 'bg-black/50 hover:bg-gray-800'
                    }`}
                    data-testid="view-grid-btn"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${
                      viewMode === 'list' ? 'bg-fuchsia-500 text-white' : 'bg-black/50 hover:bg-gray-800'
                    }`}
                    data-testid="view-list-btn"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Jobs Grid/List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : filteredAndSortedJobs.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-2">Kriterlere uygun ilan bulunamadı</p>
                <button
                  onClick={clearFilters}
                  className="text-fuchsia-400 hover:text-fuchsia-300 text-sm"
                >
                  Filtreleri temizle
                </button>
              </div>
            ) : (
              <div 
                className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
                  : 'space-y-3'
                }
                data-testid="jobs-feed"
              >
                {filteredAndSortedJobs.map((job) => (
                  viewMode === 'grid' ? (
                    <JobCardGrid
                      key={job.job_id}
                      job={job}
                      isFavorite={favorites.has(job.job_id)}
                      onToggleFavorite={toggleFavorite}
                      userType={user.user_type}
                      onApply={openApplicationModal}
                    />
                  ) : (
                    <JobCardList
                      key={job.job_id}
                      job={job}
                      isFavorite={favorites.has(job.job_id)}
                      onToggleFavorite={toggleFavorite}
                      userType={user.user_type}
                      onApply={openApplicationModal}
                    />
                  )
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="w-80 flex-shrink-0 hidden xl:block space-y-6">
            {/* Announcements */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-fuchsia-400" />
                  Duyurular
                </h3>
                <button
                  onClick={() => navigate('/announcements')}
                  className="text-xs text-fuchsia-400 hover:text-fuchsia-300"
                >
                  Tümü →
                </button>
              </div>
              <div className="p-4 space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Henüz duyuru yok</p>
                ) : (
                  announcements.slice(0, 3).map((announcement) => (
                    <div
                      key={announcement.announcement_id}
                      className="p-3 bg-black/30 rounded-xl border border-gray-700 hover:border-fuchsia-500/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/announcements')}
                    >
                      <div className="flex items-start gap-2">
                        {getAnnouncementIcon(announcement.type)}
                        <div>
                          <h4 className="font-medium text-sm">{announcement.title}</h4>
                          <p className="text-xs text-gray-400 line-clamp-2">{announcement.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Trending Categories */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Trend Kategoriler
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {trendingCategories.slice(0, 5).map((item, idx) => (
                  <button
                    key={item.category}
                    onClick={() => setFilterCategory(item.category)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-500 text-black' :
                        idx === 1 ? 'bg-gray-400 text-black' :
                        idx === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-700 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm">{item.category}</span>
                    </div>
                    <span className="text-xs text-fuchsia-400">{item.count} ilan</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Stats */}
            <div className="bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border border-fuchsia-500/30 p-4">
              <h3 className="font-semibold mb-4">Platform İstatistikleri</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Aktif İlanlar
                  </span>
                  <span className="font-bold">{jobs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Online Kullanıcılar
                  </span>
                  <span className="font-bold text-green-400">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Bu Hafta Eşleşme
                  </span>
                  <span className="font-bold text-blue-400">43</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-gray-800" onClick={(e) => e.stopPropagation()} data-testid="application-modal">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">İşe Başvur</h2>
                <p className="text-gray-400">{selectedJob.title}</p>
                <p className="text-sm text-fuchsia-400">{selectedJob.brand_name}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-black/50 rounded-xl p-4 mb-6 border border-gray-700">
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
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="Neden bu iş için uygun olduğunuzu anlatın..."
                  data-testid="application-message-input"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
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

// Filter Section Component
const FilterSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-medium text-sm">{title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

// Platform Icon Component
const PlatformIcon = ({ platform }) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className="w-4 h-4 text-pink-500" />;
    case 'youtube':
      return <Youtube className="w-4 h-4 text-red-500" />;
    case 'twitter':
      return <Twitter className="w-4 h-4 text-blue-400" />;
    default:
      return <div className="w-4 h-4 rounded-full bg-gray-600" />;
  }
};

// Featured Job Card Component
const FeaturedJobCard = ({ job, isFavorite, onToggleFavorite, userType, onApply }) => {
  return (
    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30 hover:border-yellow-500/60 transition-all hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-2">
        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
          <Zap className="w-3 h-3" /> ÖNE ÇIKAN
        </span>
        {userType === 'influencer' && (
          <button
            onClick={() => onToggleFavorite(job.job_id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
            }`}
            data-testid={`favorite-btn-${job.job_id}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      <h3 className="font-bold mb-1 line-clamp-1">{job.title}</h3>
      <p className="text-sm text-fuchsia-400 mb-2">{job.brand_name}</p>
      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{job.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-green-400 font-bold text-sm">
          {job.budget.toLocaleString('tr-TR')} ₺
        </span>
        {userType === 'influencer' && (
          <button
            onClick={() => onApply(job)}
            className="px-3 py-1.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg text-xs font-bold hover:scale-105 transition-transform"
          >
            Başvur
          </button>
        )}
      </div>
    </div>
  );
};

// Grid View Job Card
const JobCardGrid = ({ job, isFavorite, onToggleFavorite, userType, onApply }) => {
  return (
    <div 
      className={`bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border transition-all hover:scale-[1.02] ${
        job.is_featured ? 'border-yellow-500/50' : 'border-gray-800 hover:border-fuchsia-500/50'
      }`}
      data-testid={`job-card-${job.job_id}`}
    >
      {job.is_featured && (
        <div className="flex items-center gap-1 mb-2">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-xs text-yellow-400">Öne Çıkan</span>
        </div>
      )}
      {job.is_urgent && (
        <div className="flex items-center gap-1 mb-2">
          <Clock className="w-3 h-3 text-red-400" />
          <span className="text-xs text-red-400">Acil</span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold mb-1 line-clamp-1 hover:text-fuchsia-400 transition-colors cursor-pointer">
            {job.title}
          </h3>
          <p className="text-sm text-fuchsia-400">{job.brand_name}</p>
        </div>
        {userType === 'influencer' && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(job.job_id); }}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
            }`}
            data-testid={`favorite-btn-${job.job_id}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{job.description}</p>
      
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="px-2 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 rounded text-xs">{job.category}</span>
        {job.platforms.slice(0, 2).map((platform) => (
          <span key={platform} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs capitalize">
            {platform}
          </span>
        ))}
        {job.platforms.length > 2 && (
          <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
            +{job.platforms.length - 2}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <span className="text-green-400 font-bold">
          {job.budget.toLocaleString('tr-TR')} ₺
        </span>
        {userType === 'influencer' && (
          <button
            onClick={() => onApply(job)}
            className="px-4 py-1.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg text-sm font-bold hover:scale-105 transition-transform"
            data-testid={`apply-btn-${job.job_id}`}
          >
            Başvur
          </button>
        )}
      </div>
    </div>
  );
};

// List View Job Card
const JobCardList = ({ job, isFavorite, onToggleFavorite, userType, onApply }) => {
  return (
    <div 
      className={`bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border transition-all hover:bg-gray-900/70 ${
        job.is_featured ? 'border-yellow-500/50' : 'border-gray-800 hover:border-fuchsia-500/50'
      }`}
      data-testid={`job-card-${job.job_id}`}
    >
      <div className="flex gap-4">
        {/* Left: Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {job.is_featured && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded flex items-center gap-1">
                <Zap className="w-3 h-3" /> ÖNE ÇIKAN
              </span>
            )}
            {job.is_urgent && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded flex items-center gap-1">
                <Clock className="w-3 h-3" /> ACİL
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-lg mb-1 hover:text-fuchsia-400 transition-colors cursor-pointer">
            {job.title}
          </h3>
          <p className="text-sm text-fuchsia-400 mb-2">{job.brand_name}</p>
          <p className="text-sm text-gray-400 line-clamp-1 mb-3">{job.description}</p>
          
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(job.created_at).toLocaleDateString('tr-TR')}
            </span>
            <span className="px-2 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 rounded">{job.category}</span>
            {job.platforms.map((platform) => (
              <span key={platform} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded capitalize">
                {platform}
              </span>
            ))}
          </div>
        </div>
        
        {/* Right: Price & Actions */}
        <div className="flex flex-col items-end justify-between">
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">
              {job.budget.toLocaleString('tr-TR')} ₺
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {userType === 'influencer' && (
              <>
                <button
                  onClick={() => onToggleFavorite(job.job_id)}
                  className={`p-2 rounded-lg border transition-colors ${
                    isFavorite 
                      ? 'border-red-500/50 text-red-400 bg-red-500/10' 
                      : 'border-gray-700 text-gray-400 hover:border-red-500/50 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => onApply(job)}
                  className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg font-bold hover:scale-105 transition-transform"
                  data-testid={`apply-btn-${job.job_id}`}
                >
                  Başvur
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeFeed;
