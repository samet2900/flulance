import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  User, Lock, Mail, Bell, Eye, Palette, Globe, Shield, Trash2, 
  Camera, Save, LogOut, Monitor, Moon, Sun, ChevronRight, AlertTriangle,
  Check, X, Loader2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SettingsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme: currentTheme, changeTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const fileInputRef = useRef(null);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'tr');

  // Form states
  const [profileForm, setProfileForm] = useState({ name: '', bio: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [emailForm, setEmailForm] = useState({ new_email: '', password: '' });
  const [notifSettings, setNotifSettings] = useState({});
  const [privacySettings, setPrivacySettings] = useState({});
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      fetchSettings();
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/settings`, {
        withCredentials: true
      });
      setUser(response.data.user);
      setSettings(response.data.settings);
      setSessions(response.data.sessions || []);
      
      // Initialize forms
      setProfileForm({
        name: response.data.user.name || '',
        bio: response.data.user.bio || ''
      });
      setNotifSettings(response.data.settings.notifications || {});
      setPrivacySettings(response.data.settings.privacy || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/settings/profile`, profileForm, { withCredentials: true });
      alert('Profil güncellendi!');
      fetchSettings();
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setSaving(true);
    try {
      await axios.post(`${API_URL}/api/settings/profile-photo`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Profil fotoğrafı güncellendi!');
      fetchSettings();
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('Şifreler eşleşmiyor!');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      alert('Şifre en az 6 karakter olmalı!');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/settings/password`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      }, { withCredentials: true });
      alert('Şifre değiştirildi!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/settings/email`, emailForm, { withCredentials: true });
      alert('E-posta değiştirildi!');
      setEmailForm({ new_email: '', password: '' });
      fetchSettings();
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifUpdate = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/settings/notifications`, notifSettings, { withCredentials: true });
      alert('Bildirim ayarları güncellendi!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/settings/privacy`, privacySettings, { withCredentials: true });
      alert('Gizlilik ayarları güncellendi!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('theme', newTheme);
      await axios.put(`${API_URL}/api/settings/theme`, formData, { withCredentials: true });
      
      // Update local settings
      setSettings({ ...settings, theme: newTheme });
      
      // Apply theme globally using context
      changeTheme(newTheme);
      
      alert('Tema güncellendi!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('language', newLanguage);
      await axios.put(`${API_URL}/api/settings/language`, formData, { withCredentials: true });
      
      // Update local settings
      setSettings({ ...settings, language: newLanguage });
      
      // Change i18n language
      i18n.changeLanguage(newLanguage);
      setCurrentLanguage(newLanguage);
      
      // Save to localStorage
      localStorage.setItem('language', newLanguage);
      
      alert(t('appearance.languageUpdated'));
    } catch (error) {
      alert(error.response?.data?.detail || t('settings.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('password', deletePassword);
      await axios.post(`${API_URL}/api/settings/deactivate`, formData, { withCredentials: true });
      alert('Hesabınız donduruldu.');
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
      setShowDeactivateModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('password', deletePassword);
      await axios.delete(`${API_URL}/api/settings/delete-account`, { 
        data: formData,
        withCredentials: true 
      });
      alert('Hesabınız silindi.');
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.detail || 'Hata oluştu');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Profil Ayarları', icon: User },
    { id: 'security', label: 'Hesap Güvenliği', icon: Lock },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'privacy', label: 'Gizlilik', icon: Eye },
    { id: 'appearance', label: 'Görünüm', icon: Palette },
    { id: 'account', label: 'Hesap İşlemleri', icon: Shield },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        currentTheme === 'light' ? 'bg-gray-50' : 'bg-black'
      }`}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      currentTheme === 'light' 
        ? 'bg-gray-50 text-gray-900' 
        : 'bg-black text-white'
    }`}>
      <Navbar user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Ayarlar</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className={`backdrop-blur-sm rounded-2xl border overflow-hidden transition-colors duration-300 ${
              currentTheme === 'light'
                ? 'bg-white/80 border-gray-200'
                : 'bg-gray-900/50 border-gray-800'
            }`}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                      activeSection === item.id
                        ? 'bg-fuchsia-500/20 text-fuchsia-400 border-l-2 border-fuchsia-500'
                        : currentTheme === 'light'
                          ? 'hover:bg-gray-100 text-gray-700'
                          : 'hover:bg-gray-800/50 text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className={`backdrop-blur-sm rounded-2xl border p-6 transition-colors duration-300 ${
              currentTheme === 'light'
                ? 'bg-white/80 border-gray-200'
                : 'bg-gray-900/50 border-gray-800'
            }`}>
              
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Profil Ayarları</h2>
                  
                  {/* Profile Photo */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      {user.picture ? (
                        <img 
                          src={user.picture.startsWith('http') ? user.picture : `${API_URL}${user.picture}`} 
                          alt={user.name} 
                          className="w-24 h-24 rounded-full object-cover border-2 border-fuchsia-500"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-3xl font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 bg-fuchsia-500 rounded-full hover:bg-fuchsia-600 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{user.name}</p>
                      <p className="text-gray-400">{user.email}</p>
                      <p className="text-sm text-fuchsia-400 capitalize">{user.user_type}</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">İsim</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bio / Açıklama</label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white resize-none"
                        placeholder="Kendinizden bahsedin..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Kaydet
                    </button>
                  </form>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Hesap Güvenliği</h2>
                  
                  {/* Change Password */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Şifre Değiştir</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Mevcut Şifre</label>
                        <input
                          type="password"
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Yeni Şifre</label>
                        <input
                          type="password"
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Yeni Şifre (Tekrar)</label>
                        <input
                          type="password"
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        Şifreyi Değiştir
                      </button>
                    </form>
                  </div>

                  {/* Change Email */}
                  <div className="mb-8 pt-8 border-t border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">E-posta Değiştir</h3>
                    <p className="text-sm text-gray-400 mb-4">Mevcut e-posta: <span className="text-white">{user.email}</span></p>
                    <form onSubmit={handleEmailChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Yeni E-posta</label>
                        <input
                          type="email"
                          value={emailForm.new_email}
                          onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Şifre (Doğrulama)</label>
                        <input
                          type="password"
                          value={emailForm.password}
                          onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        E-postayı Değiştir
                      </button>
                    </form>
                  </div>

                  {/* Session History */}
                  <div className="pt-8 border-t border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Oturum Geçmişi</h3>
                    <p className="text-sm text-gray-400 mb-4">Hesabınıza giriş yapılan cihazlar</p>
                    {sessions.length === 0 ? (
                      <p className="text-gray-500">Oturum geçmişi bulunamadı</p>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map((session, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-3">
                              <Monitor className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium">{session.device || 'Bilinmeyen Cihaz'}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(session.created_at).toLocaleString('tr-TR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Bildirim Tercihleri</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">E-posta Bildirimleri</h3>
                      <div className="space-y-4">
                        <ToggleSetting
                          label="Yeni iş ilanları"
                          description="Profilinize uygun yeni ilanlar hakkında bildirim alın"
                          checked={notifSettings.email_new_job}
                          onChange={(v) => setNotifSettings({ ...notifSettings, email_new_job: v })}
                        />
                        <ToggleSetting
                          label="Başvuru durumu"
                          description="Başvurularınızın kabul/ret durumları hakkında bildirim alın"
                          checked={notifSettings.email_application_status}
                          onChange={(v) => setNotifSettings({ ...notifSettings, email_application_status: v })}
                        />
                        <ToggleSetting
                          label="Mesajlar"
                          description="Yeni mesajlar geldiğinde e-posta alın"
                          checked={notifSettings.email_messages}
                          onChange={(v) => setNotifSettings({ ...notifSettings, email_messages: v })}
                        />
                        <ToggleSetting
                          label="Pazarlama e-postaları"
                          description="Kampanya ve duyurular hakkında e-posta alın"
                          checked={notifSettings.email_marketing}
                          onChange={(v) => setNotifSettings({ ...notifSettings, email_marketing: v })}
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-700">
                      <h3 className="text-lg font-semibold mb-4">Uygulama Bildirimleri</h3>
                      <div className="space-y-4">
                        <ToggleSetting
                          label="Yeni iş ilanları"
                          checked={notifSettings.push_new_job}
                          onChange={(v) => setNotifSettings({ ...notifSettings, push_new_job: v })}
                        />
                        <ToggleSetting
                          label="Başvuru durumu"
                          checked={notifSettings.push_application_status}
                          onChange={(v) => setNotifSettings({ ...notifSettings, push_application_status: v })}
                        />
                        <ToggleSetting
                          label="Mesajlar"
                          checked={notifSettings.push_messages}
                          onChange={(v) => setNotifSettings({ ...notifSettings, push_messages: v })}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleNotifUpdate}
                      disabled={saving}
                      className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Kaydet
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Gizlilik Ayarları</h2>
                  
                  <div className="space-y-4">
                    <ToggleSetting
                      label="Profilimi herkese göster"
                      description="Kapalıyken profiliniz sadece eşleştiğiniz kişilere görünür"
                      checked={privacySettings.profile_visible}
                      onChange={(v) => setPrivacySettings({ ...privacySettings, profile_visible: v })}
                    />
                    <ToggleSetting
                      label="İstatistiklerimi markalara göster"
                      description="Takipçi sayısı, engagement rate gibi verilerinizi markaların görmesine izin verin"
                      checked={privacySettings.show_stats_to_brands}
                      onChange={(v) => setPrivacySettings({ ...privacySettings, show_stats_to_brands: v })}
                    />
                    <ToggleSetting
                      label="Aramada görün"
                      description="Profilinizin arama sonuçlarında görünmesine izin verin"
                      checked={privacySettings.show_in_search}
                      onChange={(v) => setPrivacySettings({ ...privacySettings, show_in_search: v })}
                    />
                  </div>

                  <button
                    onClick={handlePrivacyUpdate}
                    disabled={saving}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Kaydet
                  </button>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Görünüm</h2>
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Tema</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleThemeChange('dark')}
                        disabled={saving}
                        data-testid="theme-dark-btn"
                        className={`p-4 rounded-xl border-2 ${
                          currentTheme === 'dark' 
                            ? 'border-fuchsia-500 bg-fuchsia-500/20' 
                            : 'border-gray-700 hover:border-gray-600'
                        } flex items-center gap-3 disabled:opacity-50 transition-all`}
                      >
                        <Moon className="w-6 h-6" />
                        <div className="text-left">
                          <p className="font-medium">Koyu Mod</p>
                          <p className="text-xs text-gray-400">Karanlık tema</p>
                        </div>
                        {currentTheme === 'dark' && <Check className="w-5 h-5 text-fuchsia-400 ml-auto" />}
                      </button>
                      <button
                        onClick={() => handleThemeChange('light')}
                        disabled={saving}
                        data-testid="theme-light-btn"
                        className={`p-4 rounded-xl border-2 ${
                          currentTheme === 'light' 
                            ? 'border-fuchsia-500 bg-fuchsia-500/20' 
                            : 'border-gray-700 hover:border-gray-600'
                        } flex items-center gap-3 disabled:opacity-50 transition-all`}
                      >
                        <Sun className="w-6 h-6" />
                        <div className="text-left">
                          <p className="font-medium">Açık Mod</p>
                          <p className="text-xs text-gray-400">Aydınlık tema</p>
                        </div>
                        {currentTheme === 'light' && <Check className="w-5 h-5 text-fuchsia-400 ml-auto" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Dil</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleLanguageChange('tr')}
                        disabled={saving}
                        data-testid="lang-tr-btn"
                        className={`p-4 rounded-xl border-2 ${
                          settings?.language === 'tr' 
                            ? 'border-fuchsia-500 bg-fuchsia-500/20' 
                            : 'border-gray-700 hover:border-gray-600'
                        } flex items-center gap-3 disabled:opacity-50 transition-all`}
                      >
                        <span className="text-2xl">🇹🇷</span>
                        <div className="text-left">
                          <p className="font-medium">Türkçe</p>
                        </div>
                        {settings?.language === 'tr' && <Check className="w-5 h-5 text-fuchsia-400 ml-auto" />}
                      </button>
                      <button
                        onClick={() => handleLanguageChange('en')}
                        disabled={saving}
                        data-testid="lang-en-btn"
                        className={`p-4 rounded-xl border-2 ${
                          settings?.language === 'en' 
                            ? 'border-fuchsia-500 bg-fuchsia-500/20' 
                            : 'border-gray-700 hover:border-gray-600'
                        } flex items-center gap-3 disabled:opacity-50 transition-all`}
                      >
                        <span className="text-2xl">🇬🇧</span>
                        <div className="text-left">
                          <p className="font-medium">English</p>
                        </div>
                        {settings?.language === 'en' && <Check className="w-5 h-5 text-fuchsia-400 ml-auto" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Section */}
              {activeSection === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Hesap İşlemleri</h2>
                  
                  <div className="space-y-6">
                    {/* Deactivate Account */}
                    <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Hesabı Dondur</h3>
                          <p className="text-sm text-gray-400 mb-4">
                            Hesabınızı geçici olarak dondurabilirsiniz. Profil ve ilanlarınız gizlenir.
                            İstediğiniz zaman tekrar aktif edebilirsiniz.
                          </p>
                          <button
                            onClick={() => setShowDeactivateModal(true)}
                            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg font-medium transition-colors"
                          >
                            Hesabı Dondur
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <div className="flex items-start gap-4">
                        <Trash2 className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-red-400 mb-2">Hesabı Sil</h3>
                          <p className="text-sm text-gray-400 mb-4">
                            Hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz!
                            Tüm verileriniz, profiliniz, mesajlarınız ve ilanlarınız silinir.
                          </p>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg font-medium transition-colors text-red-400"
                          >
                            Hesabı Kalıcı Olarak Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeactivateModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Hesabı Dondur</h2>
            <p className="text-gray-400 mb-6">
              Hesabınızı dondurmak için şifrenizi girin. İstediğiniz zaman giriş yaparak hesabınızı aktif edebilirsiniz.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Şifreniz"
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-yellow-500 text-white mb-6"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeactivate}
                disabled={saving || !deletePassword}
                className="flex-1 px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'İşleniyor...' : 'Dondur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-red-500/30" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-red-400">Hesabı Sil</h2>
            <p className="text-gray-400 mb-6">
              <strong className="text-red-400">DİKKAT:</strong> Bu işlem geri alınamaz! Tüm verileriniz kalıcı olarak silinecektir.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Şifrenizi onaylayın"
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-red-500 text-white mb-6"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={saving || !deletePassword}
                className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl font-medium transition-colors text-red-400 disabled:opacity-50"
              >
                {saving ? 'Siliniyor...' : 'Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Toggle Setting Component
const ToggleSetting = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-gray-700">
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-fuchsia-500' : 'bg-gray-700'
        } relative`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'left-7' : 'left-1'
        }`} />
      </button>
    </div>
  );
};

export default SettingsPage;
