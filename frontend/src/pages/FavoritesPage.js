import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, Briefcase, DollarSign, Calendar, ExternalLink, Trash2, Search, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const FavoritesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = [
    'Ürün Tanıtımı',
    'Marka Elçiliği',
    'Video İçerik',
    'Sosyal Medya Yönetimi',
    'Blog Yazarlığı',
    'Etkinlik Katılımı',
    'Podcast',
    'Diğer'
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
      fetchFavorites();
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/favorites`, {
        withCredentials: true
      });
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (jobId) => {
    try {
      await axios.delete(`${API_URL}/api/favorites/${jobId}`, {
        withCredentials: true
      });
      setFavorites(favorites.filter(f => f.job_id !== jobId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const filteredFavorites = favorites.filter(fav => {
    const matchesSearch = fav.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fav.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || fav.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              Favorilerim
            </h1>
            <p className="text-gray-400 mt-1">Kaydettiğiniz iş ilanları ({favorites.length})</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Favori ilanlarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
              data-testid="favorites-search"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white appearance-none min-w-[200px]"
              style={{colorScheme: 'dark'}}
              data-testid="favorites-category-filter"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Favorites List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">
              {favorites.length === 0 ? 'Henüz favori ilanınız yok' : 'Sonuç bulunamadı'}
            </h3>
            <p className="text-gray-400 mb-6">
              {favorites.length === 0 
                ? 'İlanları favorilerinize ekleyerek daha sonra kolayca ulaşabilirsiniz.'
                : 'Arama kriterlerinize uygun favori ilan bulunamadı.'
              }
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
              data-testid="browse-jobs-btn"
            >
              İlanları Keşfet
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredFavorites.map((fav) => (
              <div
                key={fav.job_id}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
                data-testid={`favorite-${fav.job_id}`}
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{fav.title}</h3>
                      {fav.is_featured && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                          ⭐ Öne Çıkan
                        </span>
                      )}
                      {fav.is_urgent && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                          🔥 Acil
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-3 line-clamp-2">{fav.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {fav.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {fav.budget?.toLocaleString('tr-TR')} ₺
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(fav.favorited_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => navigate(`/home?job=${fav.job_id}`)}
                      className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                      data-testid={`view-job-${fav.job_id}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      İlana Git
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(fav.job_id)}
                      className="flex-1 md:flex-none px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      data-testid={`remove-favorite-${fav.job_id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Kaldır
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
