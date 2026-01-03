import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Briefcase, TrendingUp, DollarSign, LogOut, Trash2, Settings, Bell, Edit, Plus, Star, Award, Check, X } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [commission, setCommission] = useState(null);
  const [newCommission, setNewCommission] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(null);
  const [badgeForm, setBadgeForm] = useState({ badge_type: 'verified', reason: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'news',
    is_pinned: false
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'stats') {
        fetchStats();
        fetchCommission();
      } else if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'jobs') {
        fetchJobs();
      } else if (activeTab === 'matches') {
        fetchMatches();
      } else if (activeTab === 'announcements') {
        fetchAnnouncements();
      }
    }
  }, [user, activeTab]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      if (response.data.user_type !== 'admin') {
        navigate('/');
        return;
      }
      setUser(response.data);
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        withCredentials: true
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/jobs`, {
        withCredentials: true
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/matches`, {
        withCredentials: true
      });
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommission = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/commission`, {
        withCredentials: true
      });
      setCommission(response.data);
      setNewCommission(response.data.percentage);
    } catch (error) {
      console.error('Error fetching commission:', error);
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/admin/commission?percentage=${newCommission}`, {}, {
        withCredentials: true
      });
      fetchCommission();
      alert('Komisyon oranı güncellendi!');
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Güncelleme başarısız');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        withCredentials: true
      });
      fetchUsers();
      alert('Kullanıcı silindi');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Silme başarısız');
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/announcements`, {
        withCredentials: true
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAnnouncement) {
        // Update existing
        await axios.put(
          `${API_URL}/api/admin/announcements/${editingAnnouncement.announcement_id}`,
          announcementForm,
          { withCredentials: true }
        );
        alert('Duyuru güncellendi');
      } else {
        // Create new
        await axios.post(
          `${API_URL}/api/admin/announcements`,
          announcementForm,
          { withCredentials: true }
        );
        alert('Duyuru oluşturuldu');
      }
      
      setShowAnnouncementModal(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', content: '', type: 'news', is_pinned: false });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Kaydetme başarısız');
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      is_pinned: announcement.is_pinned
    });
    setShowAnnouncementModal(true);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/announcements/${announcementId}`, {
        withCredentials: true
      });
      alert('Duyuru silindi');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Silme başarısız');
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

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-stats"
          >
            <TrendingUp className="w-5 h-5" />
            İstatistikler
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-users"
          >
            <Users className="w-5 h-5" />
            Kullanıcılar
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
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matches'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-matches"
          >
            <DollarSign className="w-5 h-5" />
            Eşleşmeler
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            data-testid="tab-announcements"
          >
            <Bell className="w-5 h-5" />
            Duyurular
          </button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Platform İstatistikleri</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : stats ? (
              <div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="stats-cards">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
                    <Users className="w-12 h-12 mb-4 text-blue-400" />
                    <p className="text-gray-400 mb-2">Toplam Kullanıcı</p>
                    <p className="text-4xl font-bold">{stats.total_users}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                    <Briefcase className="w-12 h-12 mb-4 text-purple-400" />
                    <p className="text-gray-400 mb-2">Marka</p>
                    <p className="text-4xl font-bold">{stats.total_brands}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/30">
                    <Users className="w-12 h-12 mb-4 text-pink-400" />
                    <p className="text-gray-400 mb-2">Influencer</p>
                    <p className="text-4xl font-bold">{stats.total_influencers}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
                    <Briefcase className="w-12 h-12 mb-4 text-green-400" />
                    <p className="text-gray-400 mb-2">Açık İlanlar</p>
                    <p className="text-4xl font-bold">{stats.open_jobs}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold mb-4">Genel Bilgiler</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam İş İlanı</span>
                        <span className="font-semibold">{stats.total_jobs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Başvuru</span>
                        <span className="font-semibold">{stats.total_applications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Toplam Eşleşme</span>
                        <span className="font-semibold">{stats.total_matches}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Komisyon Ayarları
                    </h3>
                    {commission && (
                      <div>
                        <p className="text-gray-400 mb-4">Mevcut Komisyon: <span className="text-green-400 font-bold text-2xl">{commission.percentage}%</span></p>
                        <form onSubmit={handleUpdateCommission} className="flex gap-2">
                          <input
                            type="number"
                            value={newCommission}
                            onChange={(e) => setNewCommission(e.target.value)}
                            min="0"
                            max="100"
                            step="0.1"
                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                            data-testid="commission-input"
                          />
                          <button
                            type="submit"
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:scale-105 transition-transform"
                            data-testid="update-commission-btn"
                          >
                            Güncelle
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Kullanıcılar ({users.length})</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="users-table">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">İsim</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Tip</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Kayıt Tarihi</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((u) => (
                        <tr key={u.user_id} className="hover:bg-white/5">
                          <td className="px-6 py-4">{u.name}</td>
                          <td className="px-6 py-4 text-gray-400">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.user_type === 'admin' ? 'bg-red-500/30' :
                              u.user_type === 'marka' ? 'bg-blue-500/30' : 'bg-purple-500/30'
                            }`}>
                              {u.user_type === 'marka' ? 'Marka' : u.user_type === 'influencer' ? 'Influencer' : 'Admin'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {new Date(u.created_at).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.user_type !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.user_id)}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                                data-testid={`delete-user-${u.user_id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                                Sil
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Tüm İş İlanları ({jobs.length})</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="jobs-list">
                {jobs.map((job) => (
                  <div key={job.job_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                        <p className="text-gray-400 mb-2">Marka: {job.brand_name}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-purple-500/30 rounded-full text-sm">{job.category}</span>
                          <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm font-semibold">{job.budget.toLocaleString('tr-TR')} ₺</span>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            job.status === 'open' ? 'bg-green-500/30' : 'bg-gray-500/30'
                          }`}>
                            {job.status === 'open' ? 'Açık' : job.status === 'filled' ? 'Dolu' : 'Kapalı'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.platforms.map((platform) => (
                        <span key={platform} className="px-3 py-1 bg-blue-500/30 rounded-full text-sm capitalize">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Eşleşmeler ({matches.length})</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="matches-list">
                {matches.map((match) => (
                  <div key={match.match_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold mb-2">{match.job_title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Marka</p>
                        <p className="font-semibold">{match.brand_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Influencer</p>
                        <p className="font-semibold">{match.influencer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        match.status === 'active' ? 'bg-green-500/30' :
                        match.status === 'completed' ? 'bg-blue-500/30' : 'bg-gray-500/30'
                      }`}>
                        {match.status === 'active' ? 'Aktif' :
                         match.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(match.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Duyurular ({announcements.length})</h2>
              <button
                onClick={() => {
                  setEditingAnnouncement(null);
                  setAnnouncementForm({ title: '', content: '', type: 'news', is_pinned: false });
                  setShowAnnouncementModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                data-testid="create-announcement-btn"
              >
                <Plus className="w-5 h-5" />
                Yeni Duyuru
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz duyuru yok</p>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="announcements-list">
                {announcements.map((announcement) => (
                  <div key={announcement.announcement_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            announcement.type === 'news' ? 'bg-blue-500/30 text-blue-300' :
                            announcement.type === 'update' ? 'bg-green-500/30 text-green-300' :
                            'bg-yellow-500/30 text-yellow-300'
                          }`}>
                            {announcement.type === 'news' ? 'Haber' :
                             announcement.type === 'update' ? 'Güncelleme' : 'Promosyon'}
                          </span>
                          {announcement.is_pinned && (
                            <span className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-xs font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Pinli
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{announcement.title}</h3>
                        <p className="text-gray-300 mb-3">{announcement.content}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAnnouncement(announcement)}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors flex items-center gap-2"
                          data-testid={`edit-announcement-${announcement.announcement_id}`}
                        >
                          <Edit className="w-4 h-4" />
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors flex items-center gap-2"
                          data-testid={`delete-announcement-${announcement.announcement_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAnnouncementModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-white/20" onClick={(e) => e.stopPropagation()} data-testid="announcement-modal">
            <h2 className="text-3xl font-bold mb-6">{editingAnnouncement ? 'Duyuru Düzenle' : 'Yeni Duyuru Oluştur'}</h2>
            <form onSubmit={handleSaveAnnouncement} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Başlık</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white"
                  placeholder="Duyuru başlığı"
                  data-testid="announcement-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">İçerik</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 resize-none text-white"
                  placeholder="Duyuru içeriği"
                  data-testid="announcement-content-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tip</label>
                <select
                  value={announcementForm.type}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white"
                  style={{colorScheme: 'dark'}}
                  data-testid="announcement-type-select"
                >
                  <option value="news" className="bg-gray-800">Haber</option>
                  <option value="update" className="bg-gray-800">Güncelleme</option>
                  <option value="promotion" className="bg-gray-800">Promosyon</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={announcementForm.is_pinned}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_pinned: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/5 border-white/10"
                  data-testid="announcement-pinned-checkbox"
                />
                <label htmlFor="is_pinned" className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Ana sayfada göster (Pinli)
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="save-announcement-btn"
                >
                  {editingAnnouncement ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;