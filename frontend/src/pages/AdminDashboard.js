import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Briefcase, TrendingUp, DollarSign, LogOut, Trash2, Settings, Bell, Edit, Plus, Star, Award, Check, X, Eye, Clock, Zap, RefreshCw, AlertTriangle, FileText, BarChart3, Shield, MessageCircle, Instagram } from 'lucide-react';
import Navbar from '../components/Navbar';
import AdminContentManager from '../components/AdminContentManager';

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
  const [jobFilter, setJobFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [detailedStats, setDetailedStats] = useState(null);
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
        fetchDetailedStats();
      } else if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'jobs') {
        fetchJobs();
      } else if (activeTab === 'matches') {
        fetchMatches();
      } else if (activeTab === 'announcements') {
        fetchAnnouncements();
      } else if (activeTab === 'badges') {
        fetchUsers();
        fetchBadges();
      }
      // 'content' tab uses its own component with internal state
    }
  }, [user, activeTab, jobFilter]);

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

  const fetchDetailedStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/dashboard-stats`, {
        withCredentials: true
      });
      setDetailedStats(response.data);
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
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
      const params = jobFilter !== 'all' ? `?approval_status=${jobFilter}` : '';
      const response = await axios.get(`${API_URL}/api/admin/jobs${params}`, {
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

  const fetchBadges = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/badges`, {
        withCredentials: true
      });
      setBadges(response.data);
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const handleApproveJob = async (jobId) => {
    try {
      await axios.put(`${API_URL}/api/admin/jobs/${jobId}/approval`, {
        approval_status: 'approved'
      }, {
        withCredentials: true
      });
      alert('İlan onaylandı! ✅');
      fetchJobs();
    } catch (error) {
      console.error('Error approving job:', error);
      alert('İlan onaylanamadı');
    }
  };

  const handleRejectJob = async () => {
    if (!showRejectModal) return;
    
    try {
      await axios.put(`${API_URL}/api/admin/jobs/${showRejectModal}/approval`, {
        approval_status: 'rejected',
        rejection_reason: rejectionReason
      }, {
        withCredentials: true
      });
      alert('İlan reddedildi');
      setShowRejectModal(null);
      setRejectionReason('');
      fetchJobs();
    } catch (error) {
      console.error('Error rejecting job:', error);
      alert('İlan reddedilemedi');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Bu ilanı kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/jobs/${jobId}`, {
        withCredentials: true
      });
      alert('İlan silindi');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('İlan silinemedi');
    }
  };

  const handleAwardBadge = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/admin/badges/${userId}`, badgeForm, {
        withCredentials: true
      });
      alert('Rozet başarıyla verildi!');
      setShowBadgeModal(null);
      setBadgeForm({ badge_type: 'verified', reason: '' });
      fetchUsers();
      fetchBadges();
    } catch (error) {
      console.error('Error awarding badge:', error);
      alert('Rozet verilemedi');
    }
  };

  const handleRemoveBadge = async (userId) => {
    if (!window.confirm('Bu kullanıcının rozetini kaldırmak istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/admin/badges/${userId}`, {
        withCredentials: true
      });
      alert('Rozet kaldırıldı');
      fetchUsers();
      fetchBadges();
    } catch (error) {
      console.error('Error removing badge:', error);
      alert('Rozet kaldırılamadı');
    }
  };

  const getBadgeInfo = (badgeType) => {
    const badges = {
      verified: { name: 'Doğrulanmış', icon: '✓', color: 'blue' },
      top: { name: 'Top Influencer', icon: '⭐', color: 'yellow' },
      rising: { name: 'Yükselen Yıldız', icon: '🚀', color: 'purple' },
      new: { name: 'Yeni Üye', icon: '🆕', color: 'green' }
    };
    return badges[badgeType] || { name: badgeType, icon: '?', color: 'gray' };
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
        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                : 'bg-gray-900/50 hover:bg-white/20'
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
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                : 'bg-gray-900/50 hover:bg-white/20'
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
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                : 'bg-gray-900/50 hover:bg-white/20'
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
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                : 'bg-gray-900/50 hover:bg-white/20'
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
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                : 'bg-gray-900/50 hover:bg-white/20'
            }`}
            data-testid="tab-announcements"
          >
            <Bell className="w-5 h-5" />
            Duyurular
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                : 'bg-gray-900/50 hover:bg-white/20'
            }`}
            data-testid="tab-badges"
          >
            <Award className="w-5 h-5" />
            Rozetler
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'content'
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                : 'bg-gray-900/50 hover:bg-white/20'
            }`}
            data-testid="tab-content"
          >
            <FileText className="w-5 h-5" />
            İçerik Yönetimi
          </button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Platform İstatistikleri</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : stats ? (
              <div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="stats-cards">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
                    <Users className="w-12 h-12 mb-4 text-blue-400" />
                    <p className="text-gray-400 mb-2">Toplam Kullanıcı</p>
                    <p className="text-4xl font-bold">{stats.total_users}</p>
                  </div>
                  <div className="bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-fuchsia-500/30">
                    <Briefcase className="w-12 h-12 mb-4 text-fuchsia-400" />
                    <p className="text-gray-400 mb-2">Marka</p>
                    <p className="text-4xl font-bold">{stats.total_brands}</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                    <Users className="w-12 h-12 mb-4 text-cyan-400" />
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
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
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

                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
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
                            className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500"
                            data-testid="commission-input"
                          />
                          <button
                            type="submit"
                            className="px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg font-semibold hover:scale-105 transition-transform"
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="users-table">
                    <thead className="bg-black/50">
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
                        <tr key={u.user_id} className="hover:bg-black/50">
                          <td className="px-6 py-4">{u.name}</td>
                          <td className="px-6 py-4 text-gray-400">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.user_type === 'admin' ? 'bg-red-500/30' :
                              u.user_type === 'marka' ? 'bg-blue-500/30' : 'bg-fuchsia-500/30'
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">İlan Yönetimi ({jobs.length})</h2>
              
              {/* Filter Tabs */}
              <div className="flex gap-2">
                {[
                  { key: 'pending', label: 'Onay Bekleyen', color: 'yellow' },
                  { key: 'approved', label: 'Onaylanan', color: 'green' },
                  { key: 'rejected', label: 'Reddedilen', color: 'red' },
                  { key: 'all', label: 'Tümü', color: 'gray' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setJobFilter(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      jobFilter === filter.key
                        ? `bg-${filter.color}-500/30 text-${filter.color}-400 border border-${filter.color}-500/50`
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Bu kategoride ilan bulunamadı</p>
              </div>
            ) : (
              <div className="grid gap-4" data-testid="jobs-list">
                {jobs.map((job) => (
                  <div 
                    key={job.job_id} 
                    className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border transition-all ${
                      job.approval_status === 'pending' ? 'border-yellow-500/50' :
                      job.approval_status === 'rejected' ? 'border-red-500/50' :
                      job.is_featured ? 'border-yellow-500/30' : 'border-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            job.approval_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            job.approval_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {job.approval_status === 'pending' ? '⏳ Onay Bekliyor' :
                             job.approval_status === 'approved' ? '✅ Onaylandı' : '❌ Reddedildi'}
                          </span>
                          {job.is_featured && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Öne Çıkan
                            </span>
                          )}
                          {job.is_urgent && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Acil
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            job.status === 'open' ? 'bg-green-500/20 text-green-400' :
                            job.status === 'expired' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {job.status === 'open' ? 'Açık' : 
                             job.status === 'expired' ? 'Süresi Doldu' :
                             job.status === 'filled' ? 'Dolu' : 'Kapalı'}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                        <p className="text-fuchsia-400 mb-2">Marka: {job.brand_name}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-fuchsia-500/30 rounded-full text-sm">{job.category}</span>
                          <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm font-semibold">{job.budget.toLocaleString('tr-TR')} ₺</span>
                          {job.platforms.map((platform) => (
                            <span key={platform} className="px-3 py-1 bg-blue-500/30 rounded-full text-sm capitalize">
                              {platform}
                            </span>
                          ))}
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{job.description}</p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {job.view_count || 0} görüntülenme
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {job.application_count || 0} başvuru
                          </span>
                          <span>
                            {new Date(job.created_at).toLocaleDateString('tr-TR')}
                          </span>
                          {job.expires_at && (
                            <span className={job.status === 'expired' ? 'text-red-400' : ''}>
                              Bitiş: {new Date(job.expires_at).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                        
                        {/* Rejection Reason */}
                        {job.approval_status === 'rejected' && job.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Red Sebebi: {job.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 ml-4">
                        {job.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveJob(job.job_id)}
                              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center gap-2"
                              data-testid={`approve-job-${job.job_id}`}
                            >
                              <Check className="w-4 h-4" /> Onayla
                            </button>
                            <button
                              onClick={() => setShowRejectModal(job.job_id)}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                              data-testid={`reject-job-${job.job_id}`}
                            >
                              <X className="w-4 h-4" /> Reddet
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteJob(job.job_id)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                          data-testid={`delete-job-${job.job_id}`}
                        >
                          <Trash2 className="w-4 h-4" /> Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800">
              <h3 className="text-xl font-bold mb-4">İlanı Reddet</h3>
              <p className="text-gray-400 mb-4">Red sebebini belirtin (marka bilgilendirilecek):</p>
              
              <div className="space-y-2 mb-4">
                {[
                  'Topluluk kurallarına aykırı içerik',
                  'Eksik veya yanıltıcı bilgiler',
                  'Uygunsuz bütçe/ücret talebi',
                  'Spam veya reklam içeriği',
                  'Diğer'
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setRejectionReason(reason)}
                    className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                      rejectionReason === reason
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Özel bir sebep yazın..."
                rows={2}
                className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-red-500 resize-none text-white mb-4"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(null); setRejectionReason(''); }}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleRejectJob}
                  disabled={!rejectionReason}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Reddet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Eşleşmeler ({matches.length})</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="matches-list">
                {matches.map((match) => (
                  <div key={match.match_id} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
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
                className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                data-testid="create-announcement-btn"
              >
                <Plus className="w-5 h-5" />
                Yeni Duyuru
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12 bg-black/50 rounded-2xl border border-gray-700">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz duyuru yok</p>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="announcements-list">
                {announcements.map((announcement) => (
                  <div key={announcement.announcement_id} className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
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
                            <span className="px-3 py-1 bg-fuchsia-500/30 text-fuchsia-300 rounded-full text-xs font-semibold flex items-center gap-1">
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

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Rozet Yönetimi</h2>
            
            {/* Badge Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {['verified', 'top', 'rising', 'new'].map((badgeType) => {
                const info = getBadgeInfo(badgeType);
                const count = users.filter(u => u.badge === badgeType).length;
                return (
                  <div key={badgeType} className={`bg-${info.color}-500/20 backdrop-blur-sm rounded-xl p-4 border border-${info.color}-500/30`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <span className="font-semibold">{info.name}</span>
                    </div>
                    <p className="text-3xl font-bold">{count}</p>
                    <p className="text-sm text-gray-400">kullanıcı</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Badges */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Son Verilen Rozetler</h3>
              {badges.length === 0 ? (
                <p className="text-gray-400">Henüz rozet verilmemiş</p>
              ) : (
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-black/50">
                      <tr>
                        <th className="px-4 py-3 text-left">Kullanıcı</th>
                        <th className="px-4 py-3 text-left">Rozet</th>
                        <th className="px-4 py-3 text-left">Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {badges.slice(0, 10).map((badge) => {
                        const info = getBadgeInfo(badge.badge_type);
                        return (
                          <tr key={badge.badge_id} className="border-t border-gray-700">
                            <td className="px-4 py-3">{badge.user_name}</td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2">
                                {info.icon} {info.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400">
                              {new Date(badge.awarded_at).toLocaleDateString('tr-TR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User List for Badge Assignment */}
            <h3 className="text-xl font-bold mb-4">Kullanıcılara Rozet Ver</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-black/50">
                    <tr>
                      <th className="px-4 py-3 text-left">Kullanıcı</th>
                      <th className="px-4 py-3 text-left">Tip</th>
                      <th className="px-4 py-3 text-left">Mevcut Rozet</th>
                      <th className="px-4 py-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.user_type !== 'admin').map((userItem) => {
                      const badgeInfo = userItem.badge ? getBadgeInfo(userItem.badge) : null;
                      return (
                        <tr key={userItem.user_id} className="border-t border-gray-700 hover:bg-black/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold">{userItem.name}</p>
                              <p className="text-sm text-gray-400">{userItem.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              userItem.user_type === 'marka' ? 'bg-blue-500/30' : 'bg-cyan-500/30'
                            }`}>
                              {userItem.user_type === 'marka' ? 'Marka' : 'Influencer'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {badgeInfo ? (
                              <span className="flex items-center gap-2">
                                {badgeInfo.icon} {badgeInfo.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setShowBadgeModal(userItem)}
                                className="px-3 py-1 bg-fuchsia-500/30 hover:bg-fuchsia-500/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                data-testid={`award-badge-${userItem.user_id}`}
                              >
                                <Award className="w-4 h-4" />
                                Rozet Ver
                              </button>
                              {userItem.badge && (
                                <button
                                  onClick={() => handleRemoveBadge(userItem.user_id)}
                                  className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                                  data-testid={`remove-badge-${userItem.user_id}`}
                                >
                                  <X className="w-4 h-4" />
                                  Kaldır
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <FileText className="w-8 h-8 text-fuchsia-400" />
              İçerik Yönetimi
            </h2>
            <AdminContentManager />
          </div>
        )}

        {/* Dashboard Charts Section - Show in Stats tab */}
        {activeTab === 'stats' && detailedStats && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-fuchsia-400" />
              Detaylı İstatistikler
            </h3>
            
            {/* Category Distribution */}
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 mb-6">
              <h4 className="text-lg font-semibold mb-4">Kategori Dağılımı</h4>
              <div className="space-y-3">
                {detailedStats.categories?.map((cat, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="w-32 text-sm text-gray-400">{cat.name}</span>
                    <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg flex items-center justify-end px-3"
                        style={{width: `${Math.min(100, (cat.count / (detailedStats.jobs?.total || 1)) * 100)}%`}}
                      >
                        <span className="text-xs font-semibold">{cat.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                <h4 className="text-lg font-semibold mb-4">İş İlanları</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Toplam</span>
                    <span className="font-bold">{detailedStats.jobs?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Açık</span>
                    <span className="font-bold text-green-400">{detailedStats.jobs?.open || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Onay Bekleyen</span>
                    <span className="font-bold text-yellow-400">{detailedStats.jobs?.pending || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                <h4 className="text-lg font-semibold mb-4">Eşleşmeler</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Toplam</span>
                    <span className="font-bold">{detailedStats.matches?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Aktif</span>
                    <span className="font-bold text-blue-400">{detailedStats.matches?.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tamamlanan</span>
                    <span className="font-bold text-green-400">{detailedStats.matches?.completed || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                <h4 className="text-lg font-semibold mb-4">Başvurular</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Toplam</span>
                    <span className="font-bold">{detailedStats.applications?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bekleyen</span>
                    <span className="font-bold text-yellow-400">{detailedStats.applications?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Kabul Edilen</span>
                    <span className="font-bold text-green-400">{detailedStats.applications?.accepted || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAnnouncementModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-gray-800" onClick={(e) => e.stopPropagation()} data-testid="announcement-modal">
            <h2 className="text-3xl font-bold mb-6">{editingAnnouncement ? 'Duyuru Düzenle' : 'Yeni Duyuru Oluştur'}</h2>
            <form onSubmit={handleSaveAnnouncement} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Başlık</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
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
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="Duyuru içeriği"
                  data-testid="announcement-content-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tip</label>
                <select
                  value={announcementForm.type}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
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
                  className="w-5 h-5 rounded bg-black/50 border-gray-700"
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
                  className="flex-1 px-6 py-3 bg-gray-900/50 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="save-announcement-btn"
                >
                  {editingAnnouncement ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBadgeModal(null)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800" onClick={(e) => e.stopPropagation()} data-testid="badge-modal">
            <h2 className="text-2xl font-bold mb-2">Rozet Ver</h2>
            <p className="text-gray-400 mb-6">{showBadgeModal.name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rozet Tipi</label>
                <div className="grid grid-cols-2 gap-3">
                  {['verified', 'top', 'rising', 'new'].map((type) => {
                    const info = getBadgeInfo(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBadgeForm({ ...badgeForm, badge_type: type })}
                        className={`p-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                          badgeForm.badge_type === type
                            ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                            : 'bg-gray-900/50 hover:bg-white/20'
                        }`}
                      >
                        <span className="text-xl">{info.icon}</span>
                        {info.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sebep (opsiyonel)</label>
                <input
                  type="text"
                  value={badgeForm.reason}
                  onChange={(e) => setBadgeForm({ ...badgeForm, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder="Rozet verme sebebi..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBadgeModal(null)}
                  className="flex-1 px-6 py-3 bg-gray-900/50 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleAwardBadge(showBadgeModal.user_id)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="confirm-badge-btn"
                >
                  Rozet Ver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;