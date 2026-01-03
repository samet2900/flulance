import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Image, Video, Link as LinkIcon, Plus, Edit, Trash2, X, Eye, ExternalLink, Calendar, Building } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PortfolioPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [portfolioUser, setPortfolioUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isOwnPortfolio, setIsOwnPortfolio] = useState(false);

  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    category: '',
    image_url: '',
    video_url: '',
    link: '',
    brand_name: '',
    completion_date: '',
    metrics: { views: '', likes: '', engagement: '' }
  });

  const categories = [
    'Ürün Tanıtımı', 'Story Paylaşımı', 'Video İçerik', 'Reklam Kampanyası',
    'Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Marka Elçiliği', 'Etkinlik Tanıtımı'
  ];

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      const targetUserId = userId || user.user_id;
      setIsOwnPortfolio(!userId || userId === user.user_id);
      fetchPortfolio(targetUserId);
    }
  }, [user, userId]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchPortfolio = async (targetUserId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/portfolio/${targetUserId}`, { withCredentials: true });
      setPortfolioItems(response.data.portfolio || []);
      setPortfolioUser(response.data.user);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemForm,
        metrics: {
          views: itemForm.metrics.views ? parseInt(itemForm.metrics.views) : null,
          likes: itemForm.metrics.likes ? parseInt(itemForm.metrics.likes) : null,
          engagement: itemForm.metrics.engagement ? parseFloat(itemForm.metrics.engagement) : null
        }
      };

      if (editingItem) {
        await axios.put(`${API_URL}/api/portfolio/${editingItem.item_id}`, payload, { withCredentials: true });
        alert('Portföy öğesi güncellendi!');
      } else {
        await axios.post(`${API_URL}/api/portfolio`, payload, { withCredentials: true });
        alert('Portföy öğesi eklendi!');
      }
      
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      fetchPortfolio(user.user_id);
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      alert(error.response?.data?.detail || 'İşlem sırasında hata oluştu');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/portfolio/${itemId}`, { withCredentials: true });
      fetchPortfolio(user.user_id);
      alert('Öğe silindi');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Silme işlemi başarısız');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      image_url: item.image_url || '',
      video_url: item.video_url || '',
      link: item.link || '',
      brand_name: item.brand_name || '',
      completion_date: item.completion_date || '',
      metrics: {
        views: item.metrics?.views || '',
        likes: item.metrics?.likes || '',
        engagement: item.metrics?.engagement || ''
      }
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setItemForm({
      title: '', description: '', category: '', image_url: '', video_url: '',
      link: '', brand_name: '', completion_date: '', metrics: { views: '', likes: '', engagement: '' }
    });
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      navigate('/');
    } catch (error) {
      navigate('/');
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isOwnPortfolio ? 'Portföyüm' : `${portfolioUser?.name || 'Kullanıcı'} Portföyü`}
            </h1>
            <p className="text-gray-400">
              {isOwnPortfolio ? 'Geçmiş işlerinizi sergileyin' : 'Geçmiş işler ve projeler'}
            </p>
          </div>
          {isOwnPortfolio && user.user_type === 'influencer' && (
            <button
              onClick={() => { resetForm(); setEditingItem(null); setShowAddModal(true); }}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
              data-testid="add-portfolio-btn"
            >
              <Plus className="w-5 h-5" />
              Yeni Çalışma Ekle
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : portfolioItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">
              {isOwnPortfolio ? 'Henüz portföy öğesi eklemediniz' : 'Bu kullanıcının henüz portföyü yok'}
            </p>
            {isOwnPortfolio && user.user_type === 'influencer' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                İlk Çalışmanı Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="portfolio-grid">
            {portfolioItems.map(item => (
              <div key={item.item_id} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden group hover:border-fuchsia-500/50 transition-all">
                {/* Media Preview */}
                <div className="aspect-video relative bg-gray-800">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : item.video_url ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-16 h-16 text-gray-600" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                  
                  {/* Overlay Actions */}
                  {isOwnPortfolio && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        data-testid={`edit-portfolio-${item.item_id}`}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.item_id)}
                        className="p-3 bg-red-500/50 rounded-lg hover:bg-red-500/70 transition-colors"
                        data-testid={`delete-portfolio-${item.item_id}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-fuchsia-500/30 rounded text-xs">{item.category}</span>
                    {item.brand_name && (
                      <span className="px-2 py-1 bg-blue-500/30 rounded text-xs flex items-center gap-1">
                        <Building className="w-3 h-3" /> {item.brand_name}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                  )}

                  {/* Metrics */}
                  {item.metrics && (item.metrics.views || item.metrics.likes || item.metrics.engagement) && (
                    <div className="flex gap-4 text-sm text-gray-500 mb-3">
                      {item.metrics.views && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {item.metrics.views.toLocaleString('tr-TR')}
                        </span>
                      )}
                      {item.metrics.likes && (
                        <span>❤️ {item.metrics.likes.toLocaleString('tr-TR')}</span>
                      )}
                      {item.metrics.engagement && (
                        <span>📊 {item.metrics.engagement}%</span>
                      )}
                    </div>
                  )}

                  {item.completion_date && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(item.completion_date).toLocaleDateString('tr-TR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full my-8 border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">{editingItem ? 'Çalışmayı Düzenle' : 'Yeni Çalışma Ekle'}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-2">Başlık *</label>
                <input
                  type="text"
                  value={itemForm.title}
                  onChange={e => setItemForm({...itemForm, title: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder="Örn: XYZ Markası Instagram Kampanyası"
                  data-testid="portfolio-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Açıklama</label>
                <textarea
                  value={itemForm.description}
                  onChange={e => setItemForm({...itemForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="Proje detayları..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kategori *</label>
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm({...itemForm, category: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="">Seçin</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Marka Adı</label>
                  <input
                    type="text"
                    value={itemForm.brand_name}
                    onChange={e => setItemForm({...itemForm, brand_name: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="İşbirliği yapılan marka"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Görsel URL</label>
                  <input
                    type="url"
                    value={itemForm.image_url}
                    onChange={e => setItemForm({...itemForm, image_url: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Video URL</label>
                  <input
                    type="url"
                    value={itemForm.video_url}
                    onChange={e => setItemForm({...itemForm, video_url: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Link (içerik linki)</label>
                  <input
                    type="url"
                    value={itemForm.link}
                    onChange={e => setItemForm({...itemForm, link: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="https://instagram.com/p/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tamamlanma Tarihi</label>
                  <input
                    type="date"
                    value={itemForm.completion_date}
                    onChange={e => setItemForm({...itemForm, completion_date: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div>
                <label className="block text-sm font-medium mb-3">Performans Metrikleri</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Görüntülenme</label>
                    <input
                      type="number"
                      value={itemForm.metrics.views}
                      onChange={e => setItemForm({...itemForm, metrics: {...itemForm.metrics, views: e.target.value}})}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 text-white text-sm"
                      placeholder="150000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Beğeni</label>
                    <input
                      type="number"
                      value={itemForm.metrics.likes}
                      onChange={e => setItemForm({...itemForm, metrics: {...itemForm.metrics, likes: e.target.value}})}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 text-white text-sm"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Engagement (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={itemForm.metrics.engagement}
                      onChange={e => setItemForm({...itemForm, metrics: {...itemForm.metrics, engagement: e.target.value}})}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 text-white text-sm"
                      placeholder="4.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="save-portfolio-btn"
                >
                  {editingItem ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
