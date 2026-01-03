import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, Plus, DollarSign, Calendar, Users, Send, Eye, X, 
  Clock, CheckCircle, XCircle, MessageSquare, Filter
} from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BriefsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [briefs, setBriefs] = useState([]);
  const [myBriefs, setMyBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  
  const [briefForm, setBriefForm] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    platforms: [],
    deadline: '',
    requirements: ''
  });

  const [proposalForm, setProposalForm] = useState({
    proposed_price: '',
    message: '',
    delivery_time: ''
  });

  const categories = [
    'Ürün Tanıtımı', 'Marka Elçiliği', 'Video İçerik', 'Sosyal Medya Yönetimi',
    'Blog Yazarlığı', 'Etkinlik Katılımı', 'Podcast', 'Diğer'
  ];

  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter'];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
      fetchBriefs();
      if (response.data.user_type === 'marka') {
        fetchMyBriefs();
      }
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchBriefs = async () => {
    setLoading(true);
    try {
      const params = filterCategory ? { category: filterCategory } : {};
      const response = await axios.get(`${API_URL}/api/briefs`, { 
        withCredentials: true,
        params 
      });
      setBriefs(response.data);
    } catch (error) {
      console.error('Error fetching briefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBriefs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/briefs/my-briefs`, { withCredentials: true });
      setMyBriefs(response.data);
    } catch (error) {
      console.error('Error fetching my briefs:', error);
    }
  };

  const handleCreateBrief = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/briefs`, {
        ...briefForm,
        budget_min: parseFloat(briefForm.budget_min),
        budget_max: parseFloat(briefForm.budget_max)
      }, { withCredentials: true });
      
      setShowCreateModal(false);
      setBriefForm({
        title: '', description: '', category: '', budget_min: '', 
        budget_max: '', platforms: [], deadline: '', requirements: ''
      });
      fetchBriefs();
      fetchMyBriefs();
      alert('Brief oluşturuldu!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/briefs/${showProposalModal}/proposals`, {
        brief_id: showProposalModal,
        proposed_price: parseFloat(proposalForm.proposed_price),
        message: proposalForm.message,
        delivery_time: proposalForm.delivery_time
      }, { withCredentials: true });
      
      setShowProposalModal(null);
      setProposalForm({ proposed_price: '', message: '', delivery_time: '' });
      alert('Teklifiniz gönderildi!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const handleAcceptProposal = async (briefId, proposalId) => {
    if (!window.confirm('Bu teklifi kabul etmek istediğinize emin misiniz?')) return;
    
    try {
      await axios.put(`${API_URL}/api/briefs/${briefId}/proposals/${proposalId}/accept`, {}, { withCredentials: true });
      setShowDetailModal(null);
      fetchBriefs();
      fetchMyBriefs();
      alert('Teklif kabul edildi ve eşleşme oluşturuldu!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Bir hata oluştu');
    }
  };

  const viewBriefDetail = async (briefId) => {
    try {
      const response = await axios.get(`${API_URL}/api/briefs/${briefId}`, { withCredentials: true });
      setShowDetailModal(response.data);
    } catch (error) {
      console.error('Error fetching brief detail:', error);
    }
  };

  const togglePlatform = (platform) => {
    setBriefForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform) 
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={user} onLogout={() => navigate('/')} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-fuchsia-400" />
              Brief'ler (Tersine İlan)
            </h1>
            <p className="text-gray-400 mt-1">
              {user.user_type === 'marka' 
                ? 'Brief oluşturun, influencer\'lardan teklif alın' 
                : 'Brief\'lere teklif gönderin'}
            </p>
          </div>
          
          {user.user_type === 'marka' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
              data-testid="create-brief-btn"
            >
              <Plus className="w-5 h-5" />
              Yeni Brief Oluştur
            </button>
          )}
        </div>

        {/* My Briefs - For Brands */}
        {user.user_type === 'marka' && myBriefs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Brief'lerim</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBriefs.map(brief => (
                <div 
                  key={brief.brief_id}
                  className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800 cursor-pointer hover:border-fuchsia-500/50 transition-colors"
                  onClick={() => viewBriefDetail(brief.brief_id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold">{brief.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      brief.status === 'open' ? 'bg-green-500/20 text-green-400' :
                      brief.status === 'closed' ? 'bg-gray-500/20 text-gray-400' : 
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {brief.status === 'open' ? 'Açık' : brief.status === 'closed' ? 'Kapalı' : 'Tamamlandı'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{brief.category}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fuchsia-400">{brief.budget_min.toLocaleString()} - {brief.budget_max.toLocaleString()}₺</span>
                    <span className="text-cyan-400">{brief.proposal_count} teklif</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setTimeout(fetchBriefs, 100);
            }}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            style={{colorScheme: 'dark'}}
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Open Briefs */}
        <h2 className="text-xl font-bold mb-4">
          {user.user_type === 'marka' ? 'Tüm Açık Brief\'ler' : 'Açık Brief\'ler'}
        </h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : briefs.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Henüz açık brief bulunmuyor</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefs.map(brief => (
              <div 
                key={brief.brief_id}
                className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-colors"
                data-testid={`brief-${brief.brief_id}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold">{brief.title}</h3>
                  <span className="px-2 py-1 bg-fuchsia-500/20 text-fuchsia-400 rounded-full text-xs">
                    {brief.category}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{brief.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {brief.platforms.map(p => (
                    <span key={p} className="px-2 py-1 bg-gray-800 rounded-lg text-xs capitalize">{p}</span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="flex items-center gap-1 text-green-400">
                    <DollarSign className="w-4 h-4" />
                    {brief.budget_min.toLocaleString()} - {brief.budget_max.toLocaleString()}₺
                  </span>
                  <span className="text-gray-400">{brief.brand_name}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => viewBriefDetail(brief.brief_id)}
                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detay
                  </button>
                  {user.user_type === 'influencer' && (
                    <button
                      onClick={() => setShowProposalModal(brief.brief_id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-lg font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2"
                      data-testid={`propose-${brief.brief_id}`}
                    >
                      <Send className="w-4 h-4" />
                      Teklif Ver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Brief Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Yeni Brief Oluştur</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateBrief} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Başlık *</label>
                  <input
                    type="text"
                    value={briefForm.title}
                    onChange={(e) => setBriefForm({...briefForm, title: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="Örn: Instagram Story Serisi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Açıklama *</label>
                  <textarea
                    value={briefForm.description}
                    onChange={(e) => setBriefForm({...briefForm, description: e.target.value})}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white resize-none"
                    placeholder="Ne tür içerik istediğinizi detaylı açıklayın..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Kategori *</label>
                    <select
                      value={briefForm.category}
                      onChange={(e) => setBriefForm({...briefForm, category: e.target.value})}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      style={{colorScheme: 'dark'}}
                    >
                      <option value="">Seçin</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Son Tarih</label>
                    <input
                      type="date"
                      value={briefForm.deadline}
                      onChange={(e) => setBriefForm({...briefForm, deadline: e.target.value})}
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      style={{colorScheme: 'dark'}}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Min. Bütçe (₺) *</label>
                    <input
                      type="number"
                      value={briefForm.budget_min}
                      onChange={(e) => setBriefForm({...briefForm, budget_min: e.target.value})}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Max. Bütçe (₺) *</label>
                    <input
                      type="number"
                      value={briefForm.budget_max}
                      onChange={(e) => setBriefForm({...briefForm, budget_max: e.target.value})}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                      placeholder="5000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Platformlar *</label>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                          briefForm.platforms.includes(p)
                            ? 'bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/50'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Gereksinimler</label>
                  <textarea
                    value={briefForm.requirements}
                    onChange={(e) => setBriefForm({...briefForm, requirements: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white resize-none"
                    placeholder="Min. takipçi sayısı, içerik tarzı vb..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-[1.02] transition-transform"
                >
                  Brief Oluştur
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Brief Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(null)}>
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{showDetailModal.brief.title}</h2>
                  <p className="text-gray-400">{showDetailModal.brief.brand_name}</p>
                </div>
                <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-800 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <p className="text-gray-300">{showDetailModal.brief.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Bütçe</p>
                    <p className="text-lg font-bold text-green-400">
                      {showDetailModal.brief.budget_min.toLocaleString()} - {showDetailModal.brief.budget_max.toLocaleString()}₺
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Kategori</p>
                    <p className="text-lg font-bold">{showDetailModal.brief.category}</p>
                  </div>
                </div>
                
                {showDetailModal.brief.requirements && (
                  <div className="bg-black/30 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Gereksinimler</p>
                    <p>{showDetailModal.brief.requirements}</p>
                  </div>
                )}
              </div>
              
              {/* Proposals - Only for brand owner */}
              {showDetailModal.proposals && showDetailModal.proposals.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Teklifler ({showDetailModal.proposals.length})</h3>
                  <div className="space-y-3">
                    {showDetailModal.proposals.map(proposal => (
                      <div key={proposal.proposal_id} className="bg-black/30 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{proposal.influencer_name}</p>
                          <p className="text-sm text-gray-400">{proposal.message.substring(0, 100)}...</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-green-400">{proposal.proposed_price.toLocaleString()}₺</span>
                            <span className="text-cyan-400">{proposal.delivery_time}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {proposal.status === 'pending' && showDetailModal.brief.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleAcceptProposal(showDetailModal.brief.brief_id, proposal.proposal_id)}
                                className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {proposal.status === 'accepted' && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Kabul Edildi</span>
                          )}
                          {proposal.status === 'rejected' && (
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">Reddedildi</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proposal Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProposalModal(null)}>
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Teklif Gönder</h2>
                <button onClick={() => setShowProposalModal(null)} className="p-2 hover:bg-gray-800 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitProposal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Teklif Fiyatı (₺) *</label>
                  <input
                    type="number"
                    value={proposalForm.proposed_price}
                    onChange={(e) => setProposalForm({...proposalForm, proposed_price: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="2500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Teslim Süresi *</label>
                  <select
                    value={proposalForm.delivery_time}
                    onChange={(e) => setProposalForm({...proposalForm, delivery_time: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  >
                    <option value="">Seçin</option>
                    <option value="1-3 gün">1-3 gün</option>
                    <option value="3-5 gün">3-5 gün</option>
                    <option value="1 hafta">1 hafta</option>
                    <option value="2 hafta">2 hafta</option>
                    <option value="1 ay">1 ay</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Mesajınız *</label>
                  <textarea
                    value={proposalForm.message}
                    onChange={(e) => setProposalForm({...proposalForm, message: e.target.value})}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white resize-none"
                    placeholder="Neden bu iş için uygun olduğunuzu açıklayın..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Teklif Gönder
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefsPage;
