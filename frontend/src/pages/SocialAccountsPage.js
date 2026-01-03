import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Instagram, Youtube, Twitter, Linkedin, Facebook, Plus, Trash2, X, Check, Clock, AlertCircle, Users } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SocialAccountsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [accountForm, setAccountForm] = useState({
    platform: '',
    username: '',
    followers: '',
    profile_url: ''
  });

  const platformOptions = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500' },
    { id: 'tiktok', name: 'TikTok', icon: null, color: 'from-cyan-400 to-cyan-600', emoji: '🎵' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'from-blue-400 to-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-800' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-700' }
  ];

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAccounts();
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

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/social-accounts`, { withCredentials: true });
      setAccounts(response.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/social-accounts`, {
        ...accountForm,
        followers: parseInt(accountForm.followers) || 0
      }, { withCredentials: true });
      
      setShowAddModal(false);
      setAccountForm({ platform: '', username: '', followers: '', profile_url: '' });
      fetchAccounts();
      alert('Sosyal medya hesabı eklendi! Admin onayı bekleniyor.');
    } catch (error) {
      console.error('Error adding account:', error);
      alert(error.response?.data?.detail || 'Hesap eklenirken hata oluştu');
    }
  };

  const handleDeleteAccount = async (platform) => {
    if (!window.confirm('Bu hesabı kaldırmak istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/social-accounts/${platform}`, { withCredentials: true });
      fetchAccounts();
      alert('Hesap kaldırıldı');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Silme işlemi başarısız');
    }
  };

  const getPlatformInfo = (platformId) => {
    return platformOptions.find(p => p.id === platformId) || { name: platformId, color: 'from-gray-500 to-gray-600' };
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'verified':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1"><Check className="w-3 h-3" /> Onaylandı</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Onay Bekliyor</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Reddedildi</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">{status}</span>;
    }
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
            <h1 className="text-3xl font-bold mb-2">Sosyal Medya Hesaplarım</h1>
            <p className="text-gray-400">Hesaplarınızı bağlayın ve doğrulatın</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
            data-testid="add-social-btn"
          >
            <Plus className="w-5 h-5" />
            Hesap Ekle
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-400 font-medium">Manuel Doğrulama Sistemi</p>
              <p className="text-sm text-gray-400 mt-1">
                Sosyal medya hesaplarınızı manuel olarak ekleyebilirsiniz. Admin ekibi hesabınızı doğruladıktan sonra 
                profilinizde "doğrulanmış" rozeti görünecektir.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">Henüz sosyal medya hesabı eklemediniz</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              İlk Hesabınızı Ekleyin
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="social-accounts-list">
            {accounts.map(account => {
              const platformInfo = getPlatformInfo(account.platform);
              const Icon = platformInfo.icon;
              
              return (
                <div 
                  key={account.platform} 
                  className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden"
                >
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${platformInfo.color} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {Icon ? (
                          <Icon className="w-8 h-8 text-white" />
                        ) : (
                          <span className="text-3xl">{platformInfo.emoji}</span>
                        )}
                        <span className="font-bold text-lg">{platformInfo.name}</span>
                      </div>
                      {getStatusBadge(account.verified ? 'verified' : 'pending')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Kullanıcı Adı</p>
                      <p className="font-semibold text-lg">@{account.username}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Takipçi</p>
                      <p className="font-bold text-2xl text-fuchsia-400">
                        {account.followers?.toLocaleString('tr-TR') || 0}
                      </p>
                    </div>

                    {account.profile_url && (
                      <a
                        href={account.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-400 hover:text-cyan-300 block mb-4 truncate"
                      >
                        {account.profile_url}
                      </a>
                    )}

                    <button
                      onClick={() => handleDeleteAccount(account.platform)}
                      className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                      data-testid={`delete-social-${account.platform}`}
                    >
                      <Trash2 className="w-4 h-4" /> Kaldır
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Sosyal Medya Hesabı Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform *</label>
                <div className="grid grid-cols-3 gap-2">
                  {platformOptions.map(platform => {
                    const Icon = platform.icon;
                    const isSelected = accountForm.platform === platform.id;
                    const isDisabled = accounts.some(a => a.platform === platform.id);
                    
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => !isDisabled && setAccountForm({...accountForm, platform: platform.id})}
                        disabled={isDisabled}
                        className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
                          isDisabled 
                            ? 'bg-gray-800 opacity-50 cursor-not-allowed' 
                            : isSelected 
                              ? `bg-gradient-to-r ${platform.color}` 
                              : 'bg-black/50 hover:bg-gray-800'
                        }`}
                      >
                        {Icon ? <Icon className="w-5 h-5" /> : <span className="text-xl">{platform.emoji}</span>}
                        <span className="text-xs">{platform.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kullanıcı Adı *</label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={e => setAccountForm({...accountForm, username: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder="@ işareti olmadan"
                  data-testid="social-username-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Takipçi Sayısı *</label>
                <input
                  type="number"
                  value={accountForm.followers}
                  onChange={e => setAccountForm({...accountForm, followers: e.target.value})}
                  required
                  min="0"
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder="150000"
                  data-testid="social-followers-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Profil Linki</label>
                <input
                  type="url"
                  value={accountForm.profile_url}
                  onChange={e => setAccountForm({...accountForm, profile_url: e.target.value})}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder="https://instagram.com/kullaniciadi"
                  data-testid="social-url-input"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-400">
                  💡 Hesabınız admin tarafından doğrulandıktan sonra profilinizde görünecektir.
                </p>
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
                  disabled={!accountForm.platform}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  data-testid="save-social-btn"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAccountsPage;
