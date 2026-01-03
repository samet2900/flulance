import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Briefcase, Users, MessageCircle, TrendingUp, User, Building, Zap, Clock, Star, Crown, X, Edit, Trash2, RefreshCw } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BrandDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [brandProfile, setBrandProfile] = useState(null);

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    platforms: [],
    deadline_days: '',
    start_date: '',
    revision_rounds: '1',
    experience_level: '',
    min_followers: '',
    content_requirements: { videos: '', images: '', stories: '' },
    target_audience: { age_range: '', location: '' },
    copyright: 'shared',
    is_featured: false,
    is_urgent: false
  });

  const [editJobForm, setEditJobForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    platforms: [],
    is_featured: false,
    is_urgent: false,
    status: 'open'
  });

  const [profileForm, setProfileForm] = useState({
    company_name: '',
    industry: '',
    founded_year: '',
    employee_count: '',
    website: '',
    logo_url: '',
    bio: '',
    phone: '',
    address: '',
    social_media: { instagram: '', linkedin: '', facebook: '', twitter: '' }
  });

  const categories = [
    'Ürün Tanıtımı',
    'Story Paylaşımı',
    'Video İçerik',
    'Reklam Kampanyası',
    'Sosyal Medya Yönetimi',
    'İçerik Üretimi',
    'Marka Elçiliği',
    'Etkinlik Tanıtımı'
  ];

  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook'];

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'jobs') {
        fetchJobs();
      } else if (activeTab === 'matches') {
        fetchMatches();
      } else if (activeTab === 'profile') {
        fetchBrandProfile();
      }
    }
  }, [user, activeTab]);

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

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/jobs/my-jobs`, {
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
      const response = await axios.get(`${API_URL}/api/matches/my-matches`, {
        withCredentials: true
      });
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/brand-profile/me`, {
        withCredentials: true
      });
      if (response.data) {
        setBrandProfile(response.data);
        setProfileForm({
          company_name: response.data.company_name || '',
          industry: response.data.industry || '',
          founded_year: response.data.founded_year || '',
          employee_count: response.data.employee_count || '',
          website: response.data.website || '',
          logo_url: response.data.logo_url || '',
          bio: response.data.bio || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          social_media: response.data.social_media || { instagram: '', linkedin: '', facebook: '', twitter: '' }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...profileForm,
        founded_year: profileForm.founded_year ? parseInt(profileForm.founded_year) : null
      };
      
      await axios.post(`${API_URL}/api/brand-profile`, payload, {
        withCredentials: true
      });
      
      setShowEditProfile(false);
      fetchBrandProfile();
      alert('Profil başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Profil kaydedilirken bir hata oluştu');
    }
  };

  const fetchApplications = async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/api/jobs/${jobId}/applications`, {
        withCredentials: true
      });
      setApplications(response.data);
      setSelectedJob(jobId);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const jobPayload = {
        title: newJob.title,
        description: newJob.description,
        category: newJob.category,
        budget: parseFloat(newJob.budget),
        platforms: newJob.platforms,
        deadline_days: newJob.deadline_days ? parseInt(newJob.deadline_days) : null,
        start_date: newJob.start_date || null,
        revision_rounds: newJob.revision_rounds ? parseInt(newJob.revision_rounds) : 1,
        experience_level: newJob.experience_level || null,
        min_followers: newJob.min_followers ? parseInt(newJob.min_followers) : null,
        content_requirements: {
          videos: newJob.content_requirements.videos ? parseInt(newJob.content_requirements.videos) : 0,
          images: newJob.content_requirements.images ? parseInt(newJob.content_requirements.images) : 0,
          stories: newJob.content_requirements.stories ? parseInt(newJob.content_requirements.stories) : 0
        },
        target_audience: {
          age_range: newJob.target_audience.age_range || null,
          location: newJob.target_audience.location || null
        },
        copyright: newJob.copyright || 'shared',
        is_featured: newJob.is_featured,
        is_urgent: newJob.is_urgent
      };
      
      await axios.post(`${API_URL}/api/jobs`, jobPayload, {
        withCredentials: true
      });
      
      setShowCreateJob(false);
      setNewJob({
        title: '',
        description: '',
        category: '',
        budget: '',
        platforms: [],
        deadline_days: '',
        start_date: '',
        revision_rounds: '1',
        experience_level: '',
        min_followers: '',
        content_requirements: { videos: '', images: '', stories: '' },
        target_audience: { age_range: '', location: '' },
        copyright: 'shared',
        is_featured: false,
        is_urgent: false
      });
      fetchJobs();
      alert('İş ilanı başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('İş ilanı oluşturulurken bir hata oluştu');
    }
  };

  const handleAcceptApplication = async (applicationId) => {
    try {
      await axios.post(`${API_URL}/api/applications/${applicationId}/accept`, {}, {
        withCredentials: true
      });
      
      alert('Başvuru kabul edildi! Eşleşmeler sekmesinden sohbet edebilirsiniz.');
      fetchApplications(selectedJob);
      fetchJobs();
    } catch (error) {
      console.error('Error accepting application:', error);
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

  const togglePlatform = (platform) => {
    setNewJob(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const toggleEditPlatform = (platform) => {
    setEditJobForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const openEditJobModal = (job) => {
    setEditingJob(job);
    setEditJobForm({
      title: job.title,
      description: job.description,
      category: job.category,
      budget: job.budget.toString(),
      platforms: job.platforms || [],
      is_featured: job.is_featured || false,
      is_urgent: job.is_urgent || false,
      status: job.status || 'open'
    });
    setShowEditJob(true);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    
    try {
      const updatePayload = {
        title: editJobForm.title,
        description: editJobForm.description,
        category: editJobForm.category,
        budget: parseFloat(editJobForm.budget),
        platforms: editJobForm.platforms,
        is_featured: editJobForm.is_featured,
        is_urgent: editJobForm.is_urgent,
        status: editJobForm.status
      };
      
      await axios.put(`${API_URL}/api/jobs/${editingJob.job_id}`, updatePayload, {
        withCredentials: true
      });
      
      setShowEditJob(false);
      setEditingJob(null);
      fetchJobs();
      alert('İlan başarıyla güncellendi!');
    } catch (error) {
      console.error('Error updating job:', error);
      alert(error.response?.data?.detail || 'İlan güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/jobs/${jobId}`, {
        withCredentials: true
      });
      fetchJobs();
      alert('İlan başarıyla silindi!');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(error.response?.data?.detail || 'İlan silinirken bir hata oluştu');
    }
  };

  const handleRenewJob = async (jobId) => {
    try {
      await axios.post(`${API_URL}/api/jobs/${jobId}/renew`, {}, {
        withCredentials: true
      });
      fetchJobs();
      alert('İlan 15 gün daha yenilendi! Admin onayı bekleniyor.');
    } catch (error) {
      console.error('Error renewing job:', error);
      alert(error.response?.data?.detail || 'İlan yenilenirken bir hata oluştu');
    }
  };

  const handleCompleteMatch = async (matchId) => {
    if (!window.confirm('Bu işi tamamlandı olarak işaretlemek istediğinize emin misiniz?')) return;
    
    try {
      await axios.put(`${API_URL}/api/matches/${matchId}/complete`, {}, {
        withCredentials: true
      });
      fetchMatches();
      alert('İş başarıyla tamamlandı olarak işaretlendi!');
    } catch (error) {
      console.error('Error completing match:', error);
      alert(error.response?.data?.detail || 'İş tamamlanırken bir hata oluştu');
    }
  };

  // Calculate remaining days for a job
  const getRemainingDays = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                : 'bg-gray-900/50 hover:bg-white/20'
            }`}
            data-testid="tab-profile"
          >
            <Building className="w-5 h-5" />
            Firma Profilim
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
            İş İlanlarım
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
            <MessageCircle className="w-5 h-5" />
            Eşleşmeler & Sohbet
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Firma Profilim</h2>
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                data-testid="edit-profile-btn"
              >
                <Plus className="w-5 h-5" />
                {brandProfile ? 'Profili Düzenle' : 'Profil Oluştur'}
              </button>
            </div>

            {brandProfile ? (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800" data-testid="brand-profile-card">
                <div className="flex items-start gap-6 mb-6">
                  {brandProfile.logo_url && (
                    <img src={brandProfile.logo_url} alt={brandProfile.company_name} className="w-24 h-24 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{brandProfile.company_name}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-blue-500/30 rounded-full text-sm">{brandProfile.industry}</span>
                      {brandProfile.employee_count && (
                        <span className="px-3 py-1 bg-fuchsia-500/30 rounded-full text-sm">{brandProfile.employee_count} çalışan</span>
                      )}
                      {brandProfile.founded_year && (
                        <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm">Kuruluş: {brandProfile.founded_year}</span>
                      )}
                    </div>
                    {brandProfile.bio && <p className="text-gray-300 mb-4">{brandProfile.bio}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold mb-3">İletişim Bilgileri</h4>
                    {brandProfile.phone && (
                      <p className="text-gray-300"><span className="text-gray-400">Telefon:</span> {brandProfile.phone}</p>
                    )}
                    {brandProfile.website && (
                      <p className="text-gray-300">
                        <span className="text-gray-400">Website:</span>{' '}
                        <a href={brandProfile.website} target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:text-fuchsia-300">
                          {brandProfile.website}
                        </a>
                      </p>
                    )}
                    {brandProfile.address && (
                      <p className="text-gray-300"><span className="text-gray-400">Adres:</span> {brandProfile.address}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold mb-3">Sosyal Medya</h4>
                    {brandProfile.social_media && Object.entries(brandProfile.social_media).map(([platform, handle]) => (
                      handle && (
                        <p key={platform} className="text-gray-300 capitalize">
                          <span className="text-gray-400">{platform}:</span> {handle}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-black/50 rounded-2xl border border-gray-700">
                <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-4">Henüz firma profilinizi oluşturmadınız</p>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  Profil Oluştur
                </button>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">İş İlanlarım</h2>
              <button
                onClick={() => setShowCreateJob(true)}
                className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                data-testid="create-job-btn"
              >
                <Plus className="w-5 h-5" />
                Yeni İlan Oluştur
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 bg-black/50 rounded-2xl border border-gray-700">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-4">Henüz iş ilanı oluşturmadınız</p>
                <button
                  onClick={() => setShowCreateJob(true)}
                  className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  İlk İlanınızı Oluşturun
                </button>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="jobs-list">
                {jobs.map((job) => (
                  <div 
                    key={job.job_id} 
                    className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border transition-all ${
                      job.approval_status === 'pending' ? 'border-yellow-500/50' :
                      job.approval_status === 'rejected' ? 'border-red-500/50' :
                      job.status === 'expired' ? 'border-orange-500/50' :
                      job.is_featured ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-gray-800'
                    }`}
                  >
                    {/* Status & Premium Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* Approval Status */}
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        job.approval_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        job.approval_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {job.approval_status === 'pending' ? '⏳ Onay Bekliyor' :
                         job.approval_status === 'approved' ? '✅ Yayında' : '❌ Reddedildi'}
                      </span>
                      
                      {/* Expired Badge */}
                      {job.status === 'expired' && (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-semibold">
                          ⏰ Süresi Doldu
                        </span>
                      )}
                      
                      {/* Premium Badges */}
                      {job.is_featured && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3" /> ÖNE ÇIKAN
                        </span>
                      )}
                      {job.is_urgent && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ACİL
                        </span>
                      )}
                    </div>
                    
                    {/* Rejection Reason */}
                    {job.approval_status === 'rejected' && job.rejection_reason && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400">
                          Red Sebebi: {job.rejection_reason}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="px-3 py-1 bg-fuchsia-500/30 rounded-full text-sm">{job.category}</span>
                          <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm font-semibold">{job.budget.toLocaleString('tr-TR')} ₺</span>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            job.status === 'open' ? 'bg-green-500/30' : 
                            job.status === 'expired' ? 'bg-orange-500/30' : 'bg-gray-500/30'
                          }`}>
                            {job.status === 'open' ? 'Açık' : 
                             job.status === 'expired' ? 'Süresi Doldu' :
                             job.status === 'filled' ? 'Dolu' : 'Kapalı'}
                          </span>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span>{job.view_count || 0} görüntülenme</span>
                          <span>{job.application_count || 0} başvuru</span>
                          {job.expires_at && job.approval_status === 'approved' && (
                            <span className={`flex items-center gap-1 ${
                              getRemainingDays(job.expires_at) <= 3 ? 'text-red-400' : 
                              getRemainingDays(job.expires_at) <= 7 ? 'text-orange-400' : 'text-gray-500'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {getRemainingDays(job.expires_at) > 0 
                                ? `${getRemainingDays(job.expires_at)} gün kaldı`
                                : 'Süresi doldu'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.platforms.map((platform) => (
                        <span key={platform} className="px-3 py-1 bg-blue-500/30 rounded-full text-sm capitalize">
                          {platform}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => fetchApplications(job.job_id)}
                        className="px-4 py-2 bg-gray-900/50 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                        data-testid={`view-applications-${job.job_id}`}
                      >
                        <Users className="w-4 h-4" />
                        Başvuruları Gör
                      </button>
                      <button
                        onClick={() => openEditJobModal(job)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center gap-2"
                        data-testid={`edit-job-${job.job_id}`}
                      >
                        <Edit className="w-4 h-4" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.job_id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                        data-testid={`delete-job-${job.job_id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Sil
                      </button>
                      {/* Renew Button for Expired Jobs */}
                      {job.status === 'expired' && (
                        <button
                          onClick={() => handleRenewJob(job.job_id)}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center gap-2"
                          data-testid={`renew-job-${job.job_id}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Yenile (15 Gün)
                        </button>
                      )}
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
            <h2 className="text-3xl font-bold mb-6">Eşleşmeler & Sohbet</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 bg-black/50 rounded-2xl border border-gray-700">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz eşleşmeniz yok</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {matches.map((match) => (
                  <div key={match.match_id} className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border ${match.status === 'completed' ? 'border-green-500/50' : 'border-gray-800'}`} data-testid={`match-${match.match_id}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold">{match.job_title}</h3>
                      {match.status === 'completed' ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-1">
                          ✅ Tamamlandı
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                          🔄 Devam Ediyor
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-4">Influencer: <span className="text-white font-semibold">{match.influencer_name}</span></p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedMatch(match)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                        data-testid={`open-chat-${match.match_id}`}
                      >
                        <MessageCircle className="w-5 h-5" />
                        Sohbet
                      </button>
                      {match.status === 'active' && (
                        <button
                          onClick={() => handleCompleteMatch(match.match_id)}
                          className="px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                          data-testid={`complete-match-${match.match_id}`}
                        >
                          ✓ İş Bitti
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowEditProfile(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full my-8 border border-gray-800" onClick={(e) => e.stopPropagation()} data-testid="edit-profile-modal">
            <h2 className="text-3xl font-bold mb-6">{brandProfile ? 'Firma Profili Düzenle' : 'Firma Profili Oluştur'}</h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Firma Adı *</label>
                  <input
                    type="text"
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="Örn: ABC Teknoloji"
                    data-testid="company-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sektör *</label>
                  <input
                    type="text"
                    value={profileForm.industry}
                    onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="Örn: Teknoloji, Moda, Gıda"
                    data-testid="industry-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kuruluş Yılı</label>
                  <input
                    type="number"
                    value={profileForm.founded_year}
                    onChange={(e) => setProfileForm({ ...profileForm, founded_year: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Çalışan Sayısı</label>
                  <select
                    value={profileForm.employee_count}
                    onChange={(e) => setProfileForm({ ...profileForm, employee_count: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="" className="bg-gray-800">Seçiniz</option>
                    <option value="1-10" className="bg-gray-800">1-10</option>
                    <option value="11-50" className="bg-gray-800">11-50</option>
                    <option value="51-200" className="bg-gray-800">51-200</option>
                    <option value="200+" className="bg-gray-800">200+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={profileForm.logo_url}
                    onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="+90 555 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Adres</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="İstanbul, Türkiye"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Firma Hakkında</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="Firmanızı tanıtın..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Sosyal Medya Hesapları</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={profileForm.social_media.instagram}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        social_media: { ...profileForm.social_media, instagram: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 text-sm text-white"
                      placeholder="@firmaadi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={profileForm.social_media.linkedin}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        social_media: { ...profileForm.social_media, linkedin: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 text-sm text-white"
                      placeholder="/company/firmaadi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Facebook</label>
                    <input
                      type="text"
                      value={profileForm.social_media.facebook}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        social_media: { ...profileForm.social_media, facebook: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 text-sm text-white"
                      placeholder="@firmaadi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Twitter</label>
                    <input
                      type="text"
                      value={profileForm.social_media.twitter}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        social_media: { ...profileForm.social_media, twitter: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-fuchsia-500 text-sm text-white"
                      placeholder="@firmaadi"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 px-6 py-3 bg-gray-900/50 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="save-profile-btn"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Job Modal - Genişletilmiş */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full border border-gray-800 flex flex-col max-h-[90vh]" data-testid="create-job-modal">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-2xl font-bold">Yeni İş İlanı Oluştur</h2>
              <button
                type="button"
                onClick={() => setShowCreateJob(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleCreateJob} className="space-y-6">
              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-fuchsia-400">Temel Bilgiler</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">İlan Başlığı *</label>
                  <input
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="Örn: Yeni Ürün Lansmanı için Story Serisi"
                    data-testid="job-title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Açıklama *</label>
                  <textarea
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                    placeholder="İşin detaylarını yazın..."
                    data-testid="job-description-input"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Kategori *</label>
                    <select
                      value={newJob.category}
                      onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      style={{colorScheme: 'dark'}}
                      data-testid="job-category-select"
                    >
                      <option value="" className="bg-gray-800">Kategori Seçin</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-gray-800">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bütçe (₺) *</label>
                    <input
                      type="number"
                      value={newJob.budget}
                      onChange={(e) => setNewJob({ ...newJob, budget: e.target.value })}
                      required
                      min="0"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="5000"
                      data-testid="job-budget-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Platformlar *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {platforms.map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`px-4 py-3 rounded-xl font-semibold transition-colors capitalize ${
                          newJob.platforms.includes(platform)
                            ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                            : 'bg-black/50 hover:bg-gray-900/50'
                        }`}
                        data-testid={`platform-${platform}`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zaman Çizelgesi */}
              <div className="space-y-4 border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-fuchsia-400">Zaman Çizelgesi</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={newJob.start_date}
                      onChange={(e) => setNewJob({ ...newJob, start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      style={{colorScheme: 'dark'}}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Teslim Süresi (Gün)</label>
                    <input
                      type="number"
                      value={newJob.deadline_days}
                      onChange={(e) => setNewJob({ ...newJob, deadline_days: e.target.value })}
                      min="1"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="7"
                    />
                  </div>
                </div>
              </div>

              {/* İçerik Gereksinimleri */}
              <div className="space-y-4 border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-fuchsia-400">İçerik Gereksinimleri</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Video Sayısı</label>
                    <input
                      type="number"
                      value={newJob.content_requirements.videos}
                      onChange={(e) => setNewJob({
                        ...newJob,
                        content_requirements: { ...newJob.content_requirements, videos: e.target.value }
                      })}
                      min="0"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Görsel Sayısı</label>
                    <input
                      type="number"
                      value={newJob.content_requirements.images}
                      onChange={(e) => setNewJob({
                        ...newJob,
                        content_requirements: { ...newJob.content_requirements, images: e.target.value }
                      })}
                      min="0"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Story Sayısı</label>
                    <input
                      type="number"
                      value={newJob.content_requirements.stories}
                      onChange={(e) => setNewJob({
                        ...newJob,
                        content_requirements: { ...newJob.content_requirements, stories: e.target.value }
                      })}
                      min="0"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Revizyon Hakkı</label>
                  <input
                    type="number"
                    value={newJob.revision_rounds}
                    onChange={(e) => setNewJob({ ...newJob, revision_rounds: e.target.value })}
                    min="0"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Influencer Gereksinimleri */}
              <div className="space-y-4 border-t border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-fuchsia-400">Influencer Gereksinimleri</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Deneyim Seviyesi</label>
                    <select
                      value={newJob.experience_level}
                      onChange={(e) => setNewJob({ ...newJob, experience_level: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      style={{colorScheme: 'dark'}}
                    >
                      <option value="" className="bg-gray-800">Seçiniz</option>
                      <option value="beginner" className="bg-gray-800">Başlangıç</option>
                      <option value="intermediate" className="bg-gray-800">Orta</option>
                      <option value="expert" className="bg-gray-800">İleri</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Takipçi Sayısı</label>
                    <input
                      type="number"
                      value={newJob.min_followers}
                      onChange={(e) => setNewJob({ ...newJob, min_followers: e.target.value })}
                      min="0"
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="10000"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hedef Yaş Grubu</label>
                    <input
                      type="text"
                      value={newJob.target_audience.age_range}
                      onChange={(e) => setNewJob({
                        ...newJob,
                        target_audience: { ...newJob.target_audience, age_range: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="18-25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Hedef Lokasyon</label>
                    <input
                      type="text"
                      value={newJob.target_audience.location}
                      onChange={(e) => setNewJob({
                        ...newJob,
                        target_audience: { ...newJob.target_audience, location: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="Türkiye"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telif Hakları</label>
                  <select
                    value={newJob.copyright}
                    onChange={(e) => setNewJob({ ...newJob, copyright: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="shared" className="bg-gray-800">Paylaşımlı</option>
                    <option value="brand" className="bg-gray-800">Marka</option>
                    <option value="influencer" className="bg-gray-800">Influencer</option>
                  </select>
                </div>
              </div>

              {/* Premium Features - Öne Çıkar & Acil */}
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-semibold text-yellow-400">Premium Özellikler</h3>
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">Daha Fazla Görünürlük</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Öne Çıkar */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      newJob.is_featured 
                        ? 'border-yellow-500 bg-yellow-500/20' 
                        : 'border-gray-700 hover:border-yellow-500/50'
                    }`}
                    data-testid="featured-toggle"
                  >
                    <input
                      type="checkbox"
                      checked={newJob.is_featured}
                      onChange={(e) => setNewJob({ ...newJob, is_featured: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      newJob.is_featured ? 'bg-yellow-500' : 'bg-gray-700'
                    }`}>
                      {newJob.is_featured && <Zap className="w-4 h-4 text-black" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Öne Çıkan İlan</span>
                        <Star className="w-4 h-4 text-yellow-400" />
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        İlanınız ana sayfada "Vitrin" bölümünde gösterilir ve listelerde en üstte yer alır.
                      </p>
                    </div>
                  </label>

                  {/* Acil */}
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      newJob.is_urgent 
                        ? 'border-red-500 bg-red-500/20' 
                        : 'border-gray-700 hover:border-red-500/50'
                    }`}
                    data-testid="urgent-toggle"
                  >
                    <input
                      type="checkbox"
                      checked={newJob.is_urgent}
                      onChange={(e) => setNewJob({ ...newJob, is_urgent: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      newJob.is_urgent ? 'bg-red-500' : 'bg-gray-700'
                    }`}>
                      {newJob.is_urgent && <Clock className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Acil İlan</span>
                        <Clock className="w-4 h-4 text-red-400" />
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        "ACİL" rozeti ile dikkat çekici olur. Hızlı başvuru almak istiyorsanız seçin.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateJob(false)}
                  className="flex-1 px-6 py-3 bg-gray-900/50 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="submit-job-btn"
                >
                  İlanı Oluştur
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800" onClick={(e) => e.stopPropagation()} data-testid="applications-modal">
            <h2 className="text-3xl font-bold mb-6">Başvurular</h2>
            
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz başvuru yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.application_id} className="bg-black/50 rounded-xl p-6 border border-gray-700" data-testid={`application-${app.application_id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{app.influencer_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          app.status === 'pending' ? 'bg-yellow-500/30' :
                          app.status === 'accepted' ? 'bg-green-500/30' : 'bg-red-500/30'
                        }`}>
                          {app.status === 'pending' ? 'Beklemede' :
                           app.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                        </span>
                      </div>
                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptApplication(app.application_id)}
                          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold hover:scale-105 transition-transform"
                          data-testid={`accept-application-${app.application_id}`}
                        >
                          Kabul Et
                        </button>
                      )}
                    </div>
                    <p className="text-gray-300">{app.message}</p>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setSelectedJob(null)}
              className="mt-6 w-full px-6 py-3 bg-gray-900/50 hover:bg-white/20 rounded-xl font-semibold transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {selectedMatch && (
        <ChatBox
          match={selectedMatch}
          currentUser={user}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Edit Job Modal */}
      {showEditJob && editingJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full my-8 border border-gray-800" data-testid="edit-job-modal">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">İlanı Düzenle</h2>
              <button
                type="button"
                onClick={() => { setShowEditJob(false); setEditingJob(null); }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateJob} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">İlan Başlığı *</label>
                <input
                  type="text"
                  value={editJobForm.title}
                  onChange={(e) => setEditJobForm({ ...editJobForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  data-testid="edit-job-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Açıklama *</label>
                <textarea
                  value={editJobForm.description}
                  onChange={(e) => setEditJobForm({ ...editJobForm, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  data-testid="edit-job-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kategori *</label>
                  <select
                    value={editJobForm.category}
                    onChange={(e) => setEditJobForm({ ...editJobForm, category: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bütçe (₺) *</label>
                  <input
                    type="number"
                    value={editJobForm.budget}
                    onChange={(e) => setEditJobForm({ ...editJobForm, budget: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    data-testid="edit-job-budget"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Platformlar *</label>
                <div className="flex flex-wrap gap-2">
                  {['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook'].map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => toggleEditPlatform(platform)}
                      className={`px-4 py-2 rounded-xl border transition-colors capitalize ${
                        editJobForm.platforms.includes(platform)
                          ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-400'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">İlan Durumu</label>
                <select
                  value={editJobForm.status}
                  onChange={(e) => setEditJobForm({ ...editJobForm, status: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  style={{colorScheme: 'dark'}}
                >
                  <option value="open">Açık</option>
                  <option value="closed">Kapalı</option>
                  <option value="filled">Dolu</option>
                </select>
              </div>

              {/* Premium Options */}
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/30">
                <h3 className="font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5" /> Premium Özellikler
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    editJobForm.is_featured ? 'border-yellow-500 bg-yellow-500/20' : 'border-gray-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editJobForm.is_featured}
                      onChange={(e) => setEditJobForm({ ...editJobForm, is_featured: e.target.checked })}
                      className="sr-only"
                    />
                    <Zap className={`w-5 h-5 ${editJobForm.is_featured ? 'text-yellow-400' : 'text-gray-500'}`} />
                    <span>Öne Çıkan</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    editJobForm.is_urgent ? 'border-red-500 bg-red-500/20' : 'border-gray-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={editJobForm.is_urgent}
                      onChange={(e) => setEditJobForm({ ...editJobForm, is_urgent: e.target.checked })}
                      className="sr-only"
                    />
                    <Clock className={`w-5 h-5 ${editJobForm.is_urgent ? 'text-red-400' : 'text-gray-500'}`} />
                    <span>Acil</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditJob(false); setEditingJob(null); }}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="update-job-btn"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandDashboard;
