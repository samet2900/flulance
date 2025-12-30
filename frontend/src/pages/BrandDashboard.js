import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Briefcase, Users, MessageCircle, TrendingUp, User, Building } from 'lucide-react';
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
    copyright: 'shared'
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
      await axios.post(`${API_URL}/api/jobs`, {
        ...newJob,
        budget: parseFloat(newJob.budget)
      }, {
        withCredentials: true
      });
      
      setShowCreateJob(false);
      setNewJob({
        title: '',
        description: '',
        category: '',
        budget: '',
        platforms: []
      });
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
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
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
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
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
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
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-white/10 hover:bg-white/20'
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
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                data-testid="edit-profile-btn"
              >
                <Plus className="w-5 h-5" />
                {brandProfile ? 'Profili Düzenle' : 'Profil Oluştur'}
              </button>
            </div>

            {brandProfile ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20" data-testid="brand-profile-card">
                <div className="flex items-start gap-6 mb-6">
                  {brandProfile.logo_url && (
                    <img src={brandProfile.logo_url} alt={brandProfile.company_name} className="w-24 h-24 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">{brandProfile.company_name}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-blue-500/30 rounded-full text-sm">{brandProfile.industry}</span>
                      {brandProfile.employee_count && (
                        <span className="px-3 py-1 bg-purple-500/30 rounded-full text-sm">{brandProfile.employee_count} çalışan</span>
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
                        <a href={brandProfile.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
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
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-4">Henüz firma profilinizi oluşturmadınız</p>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
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
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                data-testid="create-job-btn"
              >
                <Plus className="w-5 h-5" />
                Yeni İlan Oluştur
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-4">Henüz iş ilanı oluşturmadınız</p>
                <button
                  onClick={() => setShowCreateJob(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  İlk İlanınızı Oluşturun
                </button>
              </div>
            ) : (
              <div className="grid gap-6" data-testid="jobs-list">
                {jobs.map((job) => (
                  <div key={job.job_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
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
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.platforms.map((platform) => (
                        <span key={platform} className="px-3 py-1 bg-blue-500/30 rounded-full text-sm capitalize">
                          {platform}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => fetchApplications(job.job_id)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                      data-testid={`view-applications-${job.job_id}`}
                    >
                      <Users className="w-4 h-4" />
                      Başvuruları Gör
                    </button>
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz eşleşmeniz yok</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {matches.map((match) => (
                  <div key={match.match_id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20" data-testid={`match-${match.match_id}`}>
                    <h3 className="text-xl font-bold mb-2">{match.job_title}</h3>
                    <p className="text-gray-400 mb-4">Influencer: <span className="text-white font-semibold">{match.influencer_name}</span></p>
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                      data-testid={`open-chat-${match.match_id}`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Sohbet Başlat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateJob(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20" onClick={(e) => e.stopPropagation()} data-testid="create-job-modal">
            <h2 className="text-3xl font-bold mb-6">Yeni İş İlanı Oluştur</h2>
            <form onSubmit={handleCreateJob} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">İlan Başlığı</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
                  placeholder="Örn: Yeni Ürün Lansmanı için Story Serisi"
                  data-testid="job-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Açıklama</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="İşin detaylarını yazın..."
                  data-testid="job-description-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kategori</label>
                <select
                  value={newJob.category}
                  onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
                  data-testid="job-category-select"
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bütçe (₺)</label>
                <input
                  type="number"
                  value={newJob.budget}
                  onChange={(e) => setNewJob({ ...newJob, budget: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
                  placeholder="5000"
                  data-testid="job-budget-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Platformlar</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-3 rounded-xl font-semibold transition-colors capitalize ${
                        newJob.platforms.includes(platform)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      data-testid={`platform-${platform}`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateJob(false)}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="submit-job-btn"
                >
                  İlanı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20" onClick={(e) => e.stopPropagation()} data-testid="applications-modal">
            <h2 className="text-3xl font-bold mb-6">Başvurular</h2>
            
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Henüz başvuru yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.application_id} className="bg-white/5 rounded-xl p-6 border border-white/10" data-testid={`application-${app.application_id}`}>
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
              className="mt-6 w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
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
    </div>
  );
};

export default BrandDashboard;
