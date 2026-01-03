import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, MessageSquare, Calendar, HelpCircle, Plus, Edit, Trash2, 
  Eye, EyeOff, Star, Save, X, ChevronDown, ChevronUp, Bell, Settings
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminContentManager = () => {
  const [activeSection, setActiveSection] = useState('popup');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Popup settings
  const [popupSettings, setPopupSettings] = useState({
    enabled: false,
    title: '',
    content: '',
    button_text: 'Anladım',
    button_link: '',
    show_once: true
  });

  // Form for content
  const [form, setForm] = useState({
    content_type: 'blog',
    title: '',
    content: '',
    summary: '',
    image_url: '',
    author: 'FLULANCE',
    is_published: false,
    is_featured: false,
    tags: [],
    // FAQ specific
    question: '',
    answer: '',
    category: 'Genel',
    order: 0,
    // Event specific
    event_date: '',
    event_link: '',
    event_type: 'webinar'
  });

  const sections = [
    { id: 'popup', name: 'Pop-up Bildirimi', icon: Bell },
    { id: 'blog', name: 'Blog Yazıları', icon: FileText },
    { id: 'success_story', name: 'Başarı Hikayeleri', icon: Star },
    { id: 'event', name: 'Etkinlikler', icon: Calendar },
    { id: 'faq', name: 'S.S.S', icon: HelpCircle },
    { id: 'logs', name: 'Aktivite Logları', icon: Settings }
  ];

  useEffect(() => {
    if (activeSection === 'popup') {
      fetchPopupSettings();
    } else if (activeSection === 'logs') {
      fetchActivityLogs();
    } else {
      fetchContent(activeSection);
    }
  }, [activeSection]);

  const fetchPopupSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/popup-settings`, {
        withCredentials: true
      });
      setPopupSettings(response.data);
    } catch (error) {
      console.error('Error fetching popup settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePopupSettings = async () => {
    try {
      await axios.put(`${API_URL}/api/admin/popup-settings`, popupSettings, {
        withCredentials: true
      });
      alert('Pop-up ayarları kaydedildi!');
    } catch (error) {
      console.error('Error saving popup settings:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const fetchContent = async (type) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/content/${type}`, {
        withCredentials: true
      });
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/activity-logs`, {
        withCredentials: true
      });
      setActivityLogs(response.data);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    try {
      if (editingItem) {
        await axios.put(`${API_URL}/api/admin/content/${editingItem.content_id}`, form, {
          withCredentials: true
        });
        alert('İçerik güncellendi!');
      } else {
        await axios.post(`${API_URL}/api/admin/content`, { ...form, content_type: activeSection }, {
          withCredentials: true
        });
        alert('İçerik oluşturuldu!');
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      fetchContent(activeSection);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Bu içeriği silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/content/${contentId}`, {
        withCredentials: true
      });
      alert('İçerik silindi!');
      fetchContent(activeSection);
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Silme başarısız!');
    }
  };

  const handleEditContent = (item) => {
    setEditingItem(item);
    setForm({
      ...item,
      tags: item.tags || []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      content_type: activeSection,
      title: '',
      content: '',
      summary: '',
      image_url: '',
      author: 'FLULANCE',
      is_published: false,
      is_featured: false,
      tags: [],
      question: '',
      answer: '',
      category: 'Genel',
      order: 0,
      event_date: '',
      event_link: '',
      event_type: 'webinar'
    });
  };

  const openNewModal = () => {
    resetForm();
    setEditingItem(null);
    setShowModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeSection === section.id
                ? 'bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.name}
          </button>
        ))}
      </div>

      {/* Popup Settings Section */}
      {activeSection === 'popup' && (
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Bell className="w-6 h-6 text-fuchsia-400" />
            Pop-up Bildirim Ayarları
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl">
                <div>
                  <p className="font-medium">Pop-up Aktif</p>
                  <p className="text-sm text-gray-400">Kullanıcılar giriş yaptığında pop-up gösterilsin</p>
                </div>
                <button
                  onClick={() => setPopupSettings({...popupSettings, enabled: !popupSettings.enabled})}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    popupSettings.enabled ? 'bg-fuchsia-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    popupSettings.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Başlık</label>
                <input
                  type="text"
                  value={popupSettings.title}
                  onChange={(e) => setPopupSettings({...popupSettings, title: e.target.value})}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder="Hoş Geldiniz!"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">İçerik</label>
                <textarea
                  value={popupSettings.content}
                  onChange={(e) => setPopupSettings({...popupSettings, content: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white resize-none"
                  placeholder="Pop-up içeriğinizi yazın..."
                />
              </div>

              {/* Button Text & Link */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Buton Metni</label>
                  <input
                    type="text"
                    value={popupSettings.button_text}
                    onChange={(e) => setPopupSettings({...popupSettings, button_text: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="Anladım"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Buton Linki (opsiyonel)</label>
                  <input
                    type="text"
                    value={popupSettings.button_link}
                    onChange={(e) => setPopupSettings({...popupSettings, button_link: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="/home veya https://..."
                  />
                </div>
              </div>

              {/* Show Once Toggle */}
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl">
                <div>
                  <p className="font-medium">Sadece Bir Kez Göster</p>
                  <p className="text-sm text-gray-400">Her kullanıcıya sadece bir kez gösterilsin</p>
                </div>
                <button
                  onClick={() => setPopupSettings({...popupSettings, show_once: !popupSettings.show_once})}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    popupSettings.show_once ? 'bg-fuchsia-500' : 'bg-gray-700'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    popupSettings.show_once ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={savePopupSettings}
                className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Kaydet
              </button>

              {/* Preview */}
              {popupSettings.enabled && (
                <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">Önizleme:</p>
                  <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 max-w-md mx-auto">
                    <h4 className="text-xl font-bold mb-3">{popupSettings.title || 'Başlık'}</h4>
                    <p className="text-gray-400 mb-4">{popupSettings.content || 'İçerik...'}</p>
                    <button className="w-full py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg font-semibold">
                      {popupSettings.button_text || 'Anladım'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Logs Section */}
      {activeSection === 'logs' && (
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Settings className="w-6 h-6 text-fuchsia-400" />
            Aktivite Logları
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto"></div>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Henüz aktivite logu yok
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {activityLogs.map((log, index) => (
                <div key={log.log_id || index} className="p-4 bg-black/30 rounded-xl flex items-start gap-4">
                  <div className="w-10 h-10 bg-fuchsia-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Settings className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-gray-400">{log.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(log.timestamp)} • {log.user_id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content List Section */}
      {['blog', 'success_story', 'event', 'faq'].includes(activeSection) && (
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              {sections.find(s => s.id === activeSection)?.icon && 
                React.createElement(sections.find(s => s.id === activeSection).icon, { className: "w-6 h-6 text-fuchsia-400" })}
              {sections.find(s => s.id === activeSection)?.name}
            </h3>
            <button
              onClick={openNewModal}
              className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg font-semibold hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yeni Ekle
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto"></div>
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Henüz içerik eklenmemiş
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div key={item.content_id} className="p-4 bg-black/30 rounded-xl flex items-center gap-4">
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{item.title || item.question}</h4>
                      {item.is_featured && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Öne Çıkan</span>
                      )}
                      {item.is_published ? (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Yayında</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs">Taslak</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-1">{item.summary || item.answer || item.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditContent(item)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteContent(item.content_id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {editingItem ? 'İçeriği Düzenle' : 'Yeni İçerik Ekle'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* FAQ Form */}
                {activeSection === 'faq' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Soru *</label>
                      <input
                        type="text"
                        value={form.question}
                        onChange={(e) => setForm({...form, question: e.target.value})}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                        placeholder="Soru nedir?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Cevap *</label>
                      <textarea
                        value={form.answer}
                        onChange={(e) => setForm({...form, answer: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white resize-none"
                        placeholder="Cevabı yazın..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Kategori</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({...form, category: e.target.value})}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                          style={{colorScheme: 'dark'}}
                        >
                          <option value="Genel">Genel</option>
                          <option value="Hesap">Hesap</option>
                          <option value="Ödeme">Ödeme</option>
                          <option value="İlanlar">İlanlar</option>
                          <option value="Eşleşme">Eşleşme</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Sıra</label>
                        <input
                          type="number"
                          value={form.order}
                          onChange={(e) => setForm({...form, order: parseInt(e.target.value) || 0})}
                          className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Blog / Success Story / Event Form */
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Başlık *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({...form, title: e.target.value})}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                        placeholder="İçerik başlığı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Özet</label>
                      <input
                        type="text"
                        value={form.summary}
                        onChange={(e) => setForm({...form, summary: e.target.value})}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                        placeholder="Kısa açıklama"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">İçerik *</label>
                      <textarea
                        value={form.content}
                        onChange={(e) => setForm({...form, content: e.target.value})}
                        rows={6}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white resize-none"
                        placeholder="İçeriğinizi yazın..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Görsel URL</label>
                      <input
                        type="text"
                        value={form.image_url}
                        onChange={(e) => setForm({...form, image_url: e.target.value})}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                        placeholder="https://..."
                      />
                    </div>
                    {activeSection === 'event' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Etkinlik Tarihi</label>
                          <input
                            type="datetime-local"
                            value={form.event_date}
                            onChange={(e) => setForm({...form, event_date: e.target.value})}
                            className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                            style={{colorScheme: 'dark'}}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Etkinlik Linki</label>
                          <input
                            type="text"
                            value={form.event_link}
                            onChange={(e) => setForm({...form, event_link: e.target.value})}
                            className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                            placeholder="https://zoom.us/..."
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Common toggles */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(e) => setForm({...form, is_published: e.target.checked})}
                      className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-fuchsia-500 focus:ring-fuchsia-500"
                    />
                    <span className="text-sm">Yayınla</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => setForm({...form, is_featured: e.target.checked})}
                      className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-fuchsia-500 focus:ring-fuchsia-500"
                    />
                    <span className="text-sm">Öne Çıkar</span>
                  </label>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveContent}
                  className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingItem ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContentManager;
