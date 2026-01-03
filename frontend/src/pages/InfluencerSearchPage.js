import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Filter, Users, Star, Instagram, Youtube, Twitter, 
  MapPin, DollarSign, Award, TrendingUp, ChevronDown, Grid, List,
  Heart, MessageCircle, Eye, X
} from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const InfluencerSearchPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterMinFollowers, setFilterMinFollowers] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterBadge, setFilterBadge] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(true);

  const specialties = [
    'Moda & Stil', 'Güzellik & Makyaj', 'Fitness & Sağlık', 'Yemek & Mutfak',
    'Seyahat', 'Teknoloji', 'Gaming', 'Lifestyle', 'Eğitim', 'İş & Kariyer',
    'Eğlence', 'Müzik', 'Spor', 'Otomotiv', 'Ev & Dekorasyon'
  ];

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'youtube', name: 'YouTube', icon: Youtube },
    { id: 'tiktok', name: 'TikTok', icon: TrendingUp },
    { id: 'twitter', name: 'Twitter', icon: Twitter }
  ];

  const badges = [
    { id: 'verified', name: 'Doğrulanmış ✓', color: 'blue' },
    { id: 'top', name: 'Top Influencer ⭐', color: 'yellow' },
    { id: 'rising', name: 'Yükselen Yıldız 🚀', color: 'purple' }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      fetchInfluencers();
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/influencers/search`, {
        withCredentials: true,
        params: {
          q: searchQuery || undefined,
          specialty: filterSpecialty || undefined,
          platform: filterPlatform || undefined,
          min_followers: filterMinFollowers || undefined,
          max_price: filterMaxPrice || undefined,
          badge: filterBadge || undefined,
          sort: sortBy
        }
      });
      setInfluencers(response.data);
    } catch (error) {
      console.error('Error fetching influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const debounce = setTimeout(() => {
        fetchInfluencers();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, filterSpecialty, filterPlatform, filterMinFollowers, filterMaxPrice, filterBadge, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterSpecialty('');
    setFilterPlatform('');
    setFilterMinFollowers('');
    setFilterMaxPrice('');
    setFilterBadge('');
    setSortBy('rating');
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getBadgeStyle = (badge) => {
    switch (badge) {
      case 'verified': return 'bg-blue-500/20 text-blue-400';
      case 'top': return 'bg-yellow-500/20 text-yellow-400';
      case 'rising': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getBadgeText = (badge) => {
    switch (badge) {
      case 'verified': return 'Doğrulanmış ✓';
      case 'top': return 'Top ⭐';
      case 'rising': return 'Yükselen 🚀';
      default: return '';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={user} onLogout={() => navigate('/')} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-fuchsia-400" />
            Influencer Bul
          </h1>
          <p className="text-gray-400">Markanız için en uygun influencer'ları keşfedin</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtreler
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-fuchsia-400 hover:text-fuchsia-300"
                >
                  Temizle
                </button>
              </div>

              <div className="space-y-5">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ara</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="İsim veya uzmanlık..."
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white text-sm"
                      data-testid="influencer-search-input"
                    />
                  </div>
                </div>

                {/* Specialty */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Uzmanlık Alanı</label>
                  <select
                    value={filterSpecialty}
                    onChange={(e) => setFilterSpecialty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white text-sm"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="">Tümü</option>
                    {specialties.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setFilterPlatform(filterPlatform === p.id ? '' : p.id)}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                          filterPlatform === p.id
                            ? 'bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/50'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <p.icon className="w-4 h-4" />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Followers */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Min. Takipçi</label>
                  <select
                    value={filterMinFollowers}
                    onChange={(e) => setFilterMinFollowers(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white text-sm"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="">Fark etmez</option>
                    <option value="1000">1K+</option>
                    <option value="10000">10K+</option>
                    <option value="50000">50K+</option>
                    <option value="100000">100K+</option>
                    <option value="500000">500K+</option>
                    <option value="1000000">1M+</option>
                  </select>
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Maks. Fiyat</label>
                  <select
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white text-sm"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="">Fark etmez</option>
                    <option value="500">500₺ ve altı</option>
                    <option value="1000">1.000₺ ve altı</option>
                    <option value="2500">2.500₺ ve altı</option>
                    <option value="5000">5.000₺ ve altı</option>
                    <option value="10000">10.000₺ ve altı</option>
                  </select>
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rozet</label>
                  <select
                    value={filterBadge}
                    onChange={(e) => setFilterBadge(e.target.value)}
                    className="w-full px-4 py-2.5 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white text-sm"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="">Tümü</option>
                    {badges.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtreler
                </button>
                <p className="text-gray-400">
                  <span className="text-white font-semibold">{influencers.length}</span> influencer bulundu
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                  style={{colorScheme: 'dark'}}
                >
                  <option value="rating">En Yüksek Puan</option>
                  <option value="followers">En Çok Takipçi</option>
                  <option value="price_low">Fiyat (Düşük)</option>
                  <option value="price_high">Fiyat (Yüksek)</option>
                  <option value="newest">En Yeni</option>
                </select>

                {/* View Mode */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-fuchsia-500/30 text-fuchsia-300' : 'text-gray-400'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-fuchsia-500/30 text-fuchsia-300' : 'text-gray-400'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : influencers.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">Influencer Bulunamadı</h3>
                <p className="text-gray-400">Filtreleri değiştirmeyi deneyin.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-4' 
                : 'space-y-4'
              }>
                {influencers.map((inf) => (
                  <div
                    key={inf.user_id}
                    className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-gray-700 transition-all cursor-pointer ${
                      viewMode === 'list' ? 'flex items-center p-4 gap-4' : 'p-5'
                    }`}
                    onClick={() => setSelectedInfluencer(inf)}
                    data-testid={`influencer-card-${inf.user_id}`}
                  >
                    {/* Avatar */}
                    <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'flex items-start gap-4 mb-4'}`}>
                      <div className="relative">
                        {inf.picture ? (
                          <img 
                            src={inf.picture} 
                            alt={inf.name} 
                            className={`rounded-xl object-cover ${viewMode === 'list' ? 'w-16 h-16' : 'w-14 h-14'}`}
                          />
                        ) : (
                          <div className={`bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-xl flex items-center justify-center ${viewMode === 'list' ? 'w-16 h-16' : 'w-14 h-14'}`}>
                            <span className="text-xl font-bold">{inf.name?.charAt(0)}</span>
                          </div>
                        )}
                        {inf.badge && (
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs ${getBadgeStyle(inf.badge)}`}>
                            {inf.badge === 'verified' ? '✓' : inf.badge === 'top' ? '⭐' : '🚀'}
                          </div>
                        )}
                      </div>
                      
                      {viewMode === 'grid' && (
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{inf.name}</h3>
                          {inf.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeStyle(inf.badge)}`}>
                              {getBadgeText(inf.badge)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className={viewMode === 'list' ? 'flex-1' : ''}>
                      {viewMode === 'list' && (
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{inf.name}</h3>
                          {inf.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeStyle(inf.badge)}`}>
                              {getBadgeText(inf.badge)}
                            </span>
                          )}
                        </div>
                      )}

                      {inf.specialties && inf.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {inf.specialties.slice(0, 3).map(s => (
                            <span key={s} className="text-xs px-2 py-1 bg-gray-800 rounded-lg text-gray-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        {inf.total_followers > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {formatNumber(inf.total_followers)}
                          </span>
                        )}
                        {inf.avg_rating > 0 && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            {inf.avg_rating.toFixed(1)}
                          </span>
                        )}
                        {inf.starting_price > 0 && (
                          <span className="flex items-center gap-1 text-green-400">
                            <DollarSign className="w-4 h-4" />
                            {inf.starting_price.toLocaleString('tr-TR')}₺
                          </span>
                        )}
                      </div>

                      {/* Platforms */}
                      <div className="flex gap-2">
                        {inf.instagram_followers > 0 && (
                          <div className="flex items-center gap-1 text-xs text-pink-400">
                            <Instagram className="w-3 h-3" />
                            {formatNumber(inf.instagram_followers)}
                          </div>
                        )}
                        {inf.youtube_subscribers > 0 && (
                          <div className="flex items-center gap-1 text-xs text-red-400">
                            <Youtube className="w-3 h-3" />
                            {formatNumber(inf.youtube_subscribers)}
                          </div>
                        )}
                        {inf.tiktok_followers > 0 && (
                          <div className="flex items-center gap-1 text-xs text-cyan-400">
                            <TrendingUp className="w-3 h-3" />
                            {formatNumber(inf.tiktok_followers)}
                          </div>
                        )}
                      </div>
                    </div>

                    {viewMode === 'list' && (
                      <button className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg font-semibold text-sm hover:scale-105 transition-transform">
                        Profili Gör
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Influencer Detail Modal */}
      {selectedInfluencer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedInfluencer(null)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  {selectedInfluencer.picture ? (
                    <img src={selectedInfluencer.picture} alt={selectedInfluencer.name} className="w-20 h-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl font-bold">{selectedInfluencer.name?.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      {selectedInfluencer.name}
                      {selectedInfluencer.badge && (
                        <span className={`text-sm px-2 py-1 rounded-full ${getBadgeStyle(selectedInfluencer.badge)}`}>
                          {getBadgeText(selectedInfluencer.badge)}
                        </span>
                      )}
                    </h2>
                    {selectedInfluencer.bio && (
                      <p className="text-gray-400 mt-1">{selectedInfluencer.bio}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInfluencer(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-fuchsia-400" />
                  <p className="text-2xl font-bold">{formatNumber(selectedInfluencer.total_followers)}</p>
                  <p className="text-sm text-gray-400">Toplam Takipçi</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                  <p className="text-2xl font-bold">{selectedInfluencer.avg_rating?.toFixed(1) || '-'}</p>
                  <p className="text-sm text-gray-400">Puan</p>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
                  <p className="text-2xl font-bold">{selectedInfluencer.starting_price?.toLocaleString('tr-TR') || '-'}₺</p>
                  <p className="text-sm text-gray-400">Başlangıç Fiyatı</p>
                </div>
              </div>

              {/* Specialties */}
              {selectedInfluencer.specialties && selectedInfluencer.specialties.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Uzmanlık Alanları</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedInfluencer.specialties.map(s => (
                      <span key={s} className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 rounded-lg text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Stats */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Platform İstatistikleri</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedInfluencer.instagram_followers > 0 && (
                    <div className="flex items-center gap-3 bg-black/50 rounded-xl p-3">
                      <Instagram className="w-8 h-8 text-pink-500" />
                      <div>
                        <p className="font-semibold">{formatNumber(selectedInfluencer.instagram_followers)}</p>
                        <p className="text-xs text-gray-400">Instagram</p>
                      </div>
                    </div>
                  )}
                  {selectedInfluencer.youtube_subscribers > 0 && (
                    <div className="flex items-center gap-3 bg-black/50 rounded-xl p-3">
                      <Youtube className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="font-semibold">{formatNumber(selectedInfluencer.youtube_subscribers)}</p>
                        <p className="text-xs text-gray-400">YouTube</p>
                      </div>
                    </div>
                  )}
                  {selectedInfluencer.tiktok_followers > 0 && (
                    <div className="flex items-center gap-3 bg-black/50 rounded-xl p-3">
                      <TrendingUp className="w-8 h-8 text-cyan-500" />
                      <div>
                        <p className="font-semibold">{formatNumber(selectedInfluencer.tiktok_followers)}</p>
                        <p className="text-xs text-gray-400">TikTok</p>
                      </div>
                    </div>
                  )}
                  {selectedInfluencer.twitter_followers > 0 && (
                    <div className="flex items-center gap-3 bg-black/50 rounded-xl p-3">
                      <Twitter className="w-8 h-8 text-sky-500" />
                      <div>
                        <p className="font-semibold">{formatNumber(selectedInfluencer.twitter_followers)}</p>
                        <p className="text-xs text-gray-400">Twitter</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  // TODO: Implement contact/invite feature
                  alert('İletişim özelliği yakında eklenecek!');
                }}
                className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-[1.02] transition-transform"
              >
                <MessageCircle className="w-5 h-5 inline mr-2" />
                İletişime Geç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerSearchPage;
