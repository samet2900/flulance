import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Plus, Trash2, X, Mail, Smartphone, DollarSign } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CategoryAlertsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [alertForm, setAlertForm] = useState({
    category: '',
    platforms: [],
    budget_min: '',
    budget_max: '',
    email_notification: true,
    push_notification: false
  });

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
      fetchAlerts();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/category-alerts`, { withCredentials: true });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlert = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/category-alerts`, {
        ...alertForm,
        budget_min: alertForm.budget_min ? parseFloat(alertForm.budget_min) : null,
        budget_max: alertForm.budget_max ? parseFloat(alertForm.budget_max) : null
      }, { withCredentials: true });
      
      setShowAddModal(false);
      resetForm();
      fetchAlerts();
      alert('Kategori alarmı oluşturuldu!');
    } catch (error) {
      console.error('Error creating alert:', error);
      alert(error.response?.data?.detail || 'Alarm oluşturulurken hata oluştu');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Bu alarmı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/category-alerts/${alertId}`, { withCredentials: true });
      fetchAlerts();
      alert('Alarm silindi');
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Silme işlemi başarısız');
    }
  };

  const togglePlatform = (platform) => {
    setAlertForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const resetForm = () => {
    setAlertForm({
      category: '', platforms: [], budget_min: '', budget_max: '',
      email_notification: true, push_notification: false
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Kategori Alarmları</h1>
            <p className="text-gray-400">İlgilendiğiniz kategorilerde yeni ilanlar için bildirim alın</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
            data-testid="add-alert-btn"
          >
            <Plus className="w-5 h-5" />
            Yeni Alarm
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">Henüz kategori alarmınız yok</p>
            <p className="text-sm text-gray-500 mb-6">
              İlgilendiğiniz kategorilerde yeni ilanlar yayınlandığında haberdar olun
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              İlk Alarmınızı Oluşturun
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="alerts-list">
            {alerts.map(alert => (
              <div 
                key={alert.alert_id} 
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 hover:border-fuchsia-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{alert.category}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(alert.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Platforms */}
                {alert.platforms && alert.platforms.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Platformlar</p>
                    <div className="flex flex-wrap gap-2">
                      {alert.platforms.map(p => (
                        <span key={p} className="px-2 py-1 bg-blue-500/30 rounded text-xs capitalize">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget Filter */}
                {(alert.budget_min || alert.budget_max) && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Bütçe Aralığı</p>
                    <p className="text-green-400 font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {alert.budget_min?.toLocaleString('tr-TR') || '0'} - {alert.budget_max?.toLocaleString('tr-TR') || '∞'} ₺
                    </p>
                  </div>
                )}

                {/* Notification Settings */}
                <div className="flex gap-3 mb-4">
                  {alert.email_notification && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center gap-1">
                      <Mail className="w-3 h-3" /> E-posta
                    </span>
                  )}
                  {alert.push_notification && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Push
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteAlert(alert.alert_id)}
                  className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                  data-testid={`delete-alert-${alert.alert_id}`}
                >
                  <Trash2 className="w-4 h-4" /> Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Alert Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Yeni Kategori Alarmı</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddAlert} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kategori *</label>
                <select
                  value={alertForm.category}
                  onChange={e => setAlertForm({...alertForm, category: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  style={{colorScheme: 'dark'}}
                  data-testid="alert-category-select"
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Platformlar (opsiyonel)</label>
                <div className="grid grid-cols-3 gap-2">
                  {platforms.map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors capitalize text-sm ${
                        alertForm.platforms.includes(platform)
                          ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                          : 'bg-black/50 hover:bg-gray-800'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min. Bütçe (₺)</label>
                  <input
                    type="number"
                    value={alertForm.budget_min}
                    onChange={e => setAlertForm({...alertForm, budget_min: e.target.value})}
                    min="0"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max. Bütçe (₺)</label>
                  <input
                    type="number"
                    value={alertForm.budget_max}
                    onChange={e => setAlertForm({...alertForm, budget_max: e.target.value})}
                    min="0"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Bildirim Tercihleri</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertForm.email_notification}
                      onChange={e => setAlertForm({...alertForm, email_notification: e.target.checked})}
                      className="w-5 h-5 rounded bg-black/50 border-gray-700 text-fuchsia-500 focus:ring-fuchsia-500"
                    />
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>E-posta bildirimi</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertForm.push_notification}
                      onChange={e => setAlertForm({...alertForm, push_notification: e.target.checked})}
                      className="w-5 h-5 rounded bg-black/50 border-gray-700 text-fuchsia-500 focus:ring-fuchsia-500"
                    />
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span>Push bildirimi</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="save-alert-btn"
                >
                  Alarm Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryAlertsPage;
