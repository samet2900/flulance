import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Plus, Send, Eye, Clock, DollarSign, Users, X, Check, MessageCircle } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('all');

  const [newBrief, setNewBrief] = useState({
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
    'Ürün Tanıtımı', 'Story Paylaşımı', 'Video İçerik', 'Reklam Kampanyası',
    'Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Marka Elçiliği', 'Etkinlik Tanıtımı'
  ];

  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook'];

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.user_type === 'marka') {
        fetchMyBriefs();
      } else {
        fetchBriefs();
      }
    }
  }, [user, activeTab]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      navigate('/auth');
    }
  };

  const fetchBriefs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/briefs`, { withCredentials: true });
      setBriefs(response.data);
    } catch (error) {
      console.error('Error fetching briefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBriefs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/briefs/my-briefs`, { withCredentials: true });
      setMyBriefs(response.data);
    } catch (error) {
      console.error('Error fetching my briefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBriefDetail = async (briefId) => {
    try {
      const response = await axios.get(`${API_URL}/api/briefs/${briefId}`, { withCredentials: true });
      setShowDetailModal(response.data);
    } catch (error) {
      console.error('Error fetching brief detail:', error);
    }
  };

  const handleCreateBrief = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/briefs`, {
        ...newBrief,
        budget_min: parseFloat(newBrief.budget_min),
        budget_max: parseFloat(newBrief.budget_max)
      }, { withCredentials: true });
      
      setShowCreateModal(false);
      setNewBrief({
        title: '', description: '', category: '', budget_min: '', budget_max: '',
        platforms: [], deadline: '', requirements: ''
      });
      fetchMyBriefs();
      alert('Brief başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Error creating brief:', error);
      alert(error.response?.data?.detail || 'Brief oluşturulurken hata oluştu');
    }
  };

  const handleSubmitProposal = async (briefId) => {
    try {
      await axios.post(`${API_URL}/api/briefs/${briefId}/proposals`, {
        ...proposalForm,
        proposed_price: parseFloat(proposalForm.proposed_price),
        brief_id: briefId
      }, { withCredentials: true });
      
      setShowProposalModal(null);
      setProposalForm({ proposed_price: '', message: '', delivery_time: '' });
      alert('Teklifiniz gönderildi!');
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert(error.response?.data?.detail || 'Teklif gönderilirken hata oluştu');
    }
  };

  const handleAcceptProposal = async (briefId, proposalId) => {
    if (!window.confirm('Bu teklifi kabul etmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.put(`${API_URL}/api/briefs/${briefId}/proposals/${proposalId}/accept`, {}, { withCredentials: true });
      alert('Teklif kabul edildi! Eşleşme oluşturuldu.');
      setShowDetailModal(null);
      fetchMyBriefs();
    } catch (error) {
      console.error('Error accepting proposal:', error);
      alert(error.response?.data?.detail || 'Teklif kabul edilirken hata oluştu');
    }
  };

  const togglePlatform = (platform) => {
    setNewBrief(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
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
            <h1 className="text-3xl font-bold mb-2">Teklif İsteme (Briefs)</h1>
            <p className="text-gray-400">
              {user.user_type === 'marka' 
                ? 'Brief paylaşın, influencer\'lardan teklif alın'
                : 'Açık brief\'lere göz atın ve teklif verin'}
            </p>
          </div>
          {user.user_type === 'marka' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
              data-testid="create-brief-btn"
            >
              <Plus className="w-5 h-5" />
              Yeni Brief
            </button>
          )}
        </div>

        {/* Tabs for brands */}
        {user.user_type === 'marka' && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                activeTab === 'my' ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500' : 'bg-gray-900/50 hover:bg-white/20'
              }`}
            >
              Brief'lerim
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid gap-6" data-testid="briefs-list">
            {(user.user_type === 'marka' ? myBriefs : briefs).length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">
                  {user.user_type === 'marka' ? 'Henüz brief oluşturmadınız' : 'Şu anda açık brief yok'}
                </p>
              </div>
            ) : (
              (user.user_type === 'marka' ? myBriefs : briefs).map((brief) => (
                <div 
                  key={brief.brief_id} 
                  className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-fuchsia-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{brief.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          brief.status === 'open' ? 'bg-green-500/20 text-green-400' :
                          brief.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {brief.status === 'open' ? 'Açık' : brief.status === 'closed' ? 'Kapalı' : 'Tamamlandı'}
                        </span>
                      </div>
                      {user.user_type !== 'marka' && (
                        <p className="text-fuchsia-400 text-sm mb-2">Marka: {brief.brand_name}</p>
                      )}
                      <p className="text-gray-300 mb-4 line-clamp-2">{brief.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-fuchsia-500/30 rounded-full text-sm">{brief.category}</span>
                        <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm font-semibold">
                          {brief.budget_min?.toLocaleString('tr-TR')} - {brief.budget_max?.toLocaleString('tr-TR')} ₺
                        </span>
                        {brief.platforms?.map(p => (
                          <span key={p} className="px-3 py-1 bg-blue-500/30 rounded-full text-sm capitalize">{p}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {brief.proposal_count || 0} teklif
                        </span>
                        {brief.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> Son: {new Date(brief.deadline).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {user.user_type === 'marka' ? (
                      <button
                        onClick={() => fetchBriefDetail(brief.brief_id)}
                        className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                        data-testid={`view-proposals-${brief.brief_id}`}
                      >
                        <Eye className="w-4 h-4" /> Teklifleri Gör
                      </button>
                    ) : (
                      brief.status === 'open' && (
                        <button
                          onClick={() => setShowProposalModal(brief)}
                          className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                          data-testid={`submit-proposal-${brief.brief_id}`}
                        >
                          <Send className="w-4 h-4" /> Teklif Ver
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Brief Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full my-8 border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Yeni Brief Oluştur</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateBrief} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-2">Başlık *</label>
                <input
                  type="text"
                  value={newBrief.title}
                  onChange={e => setNewBrief({...newBrief, title: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder="Örn: Yaz kampanyası için influencer arıyoruz"
                  data-testid="brief-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Açıklama *</label>
                <textarea
                  value={newBrief.description}
                  onChange={e => setNewBrief({...newBrief, description: e.target.value})}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="Projenin detaylarını açıklayın..."
                  data-testid="brief-description-input"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Kategori *</label>
                  <select
                    value={newBrief.category}
                    onChange={e => setNewBrief({...newBrief, category: e.target.value})}
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
                  <label className="block text-sm font-medium mb-2">Son Başvuru Tarihi</label>
                  <input
                    type="date"
                    value={newBrief.deadline}
                    onChange={e => setNewBrief({...newBrief, deadline: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Bütçe (₺) *</label>
                  <input
                    type="number"
                    value={newBrief.budget_min}
                    onChange={e => setNewBrief({...newBrief, budget_min: e.target.value})}
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Maksimum Bütçe (₺) *</label>
                  <input
                    type="number"
                    value={newBrief.budget_max}
                    onChange={e => setNewBrief({...newBrief, budget_max: e.target.value})}
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Platformlar *</label>
                <div className="grid grid-cols-3 gap-3">
                  {platforms.map(platform => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors capitalize ${
                        newBrief.platforms.includes(platform)
                          ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500'
                          : 'bg-black/50 hover:bg-gray-800'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gereksinimler</label>
                <textarea
                  value={newBrief.requirements}
                  onChange={e => setNewBrief({...newBrief, requirements: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="Minimum takipçi, konum, dil vb. gereksinimler..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="submit-brief-btn"
                >
                  Brief Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proposal Modal (for Influencers) */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Teklif Ver</h2>
              <button onClick={() => setShowProposalModal(null)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-black/50 rounded-xl p-4 mb-6">
                <h3 className="font-bold mb-1">{showProposalModal.title}</h3>
                <p className="text-sm text-gray-400">Marka: {showProposalModal.brand_name}</p>
                <p className="text-green-400 font-semibold mt-2">
                  Bütçe: {showProposalModal.budget_min?.toLocaleString('tr-TR')} - {showProposalModal.budget_max?.toLocaleString('tr-TR')} ₺
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Teklifiniz (₺) *</label>
                  <input
                    type="number"
                    value={proposalForm.proposed_price}
                    onChange={e => setProposalForm({...proposalForm, proposed_price: e.target.value})}
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="3000"
                    data-testid="proposal-price-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Teslim Süresi *</label>
                  <input
                    type="text"
                    value={proposalForm.delivery_time}
                    onChange={e => setProposalForm({...proposalForm, delivery_time: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="Örn: 5 gün, 1 hafta"
                    data-testid="proposal-delivery-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Mesajınız *</label>
                  <textarea
                    value={proposalForm.message}
                    onChange={e => setProposalForm({...proposalForm, message: e.target.value})}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                    placeholder="Neden bu iş için uygun olduğunuzu açıklayın..."
                    data-testid="proposal-message-input"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowProposalModal(null)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleSubmitProposal(showProposalModal.brief_id)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
                  data-testid="send-proposal-btn"
                >
                  Teklif Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brief Detail Modal (for Brands - view proposals) */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full my-8 border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Brief Detayı & Teklifler</h2>
              <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Brief Info */}
              <div className="bg-black/50 rounded-xl p-4 mb-6">
                <h3 className="text-xl font-bold mb-2">{showDetailModal.brief?.title}</h3>
                <p className="text-gray-300 mb-4">{showDetailModal.brief?.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-fuchsia-500/30 rounded-full text-sm">{showDetailModal.brief?.category}</span>
                  <span className="px-3 py-1 bg-green-500/30 rounded-full text-sm font-semibold">
                    {showDetailModal.brief?.budget_min?.toLocaleString('tr-TR')} - {showDetailModal.brief?.budget_max?.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              </div>

              {/* Proposals */}
              <h4 className="text-lg font-semibold mb-4">Gelen Teklifler ({showDetailModal.proposals?.length || 0})</h4>
              
              {(!showDetailModal.proposals || showDetailModal.proposals.length === 0) ? (
                <div className="text-center py-8 bg-gray-800/50 rounded-xl">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">Henüz teklif gelmedi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {showDetailModal.proposals.map(proposal => (
                    <div key={proposal.proposal_id} className={`bg-gray-800/50 rounded-xl p-4 border ${
                      proposal.status === 'accepted' ? 'border-green-500' : 'border-gray-700'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-lg">{proposal.influencer_name}</p>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            proposal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            proposal.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {proposal.status === 'pending' ? 'Beklemede' : proposal.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-xl">{proposal.proposed_price?.toLocaleString('tr-TR')} ₺</p>
                          <p className="text-sm text-gray-400">{proposal.delivery_time}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4">{proposal.message}</p>
                      
                      {proposal.status === 'pending' && showDetailModal.brief?.status === 'open' && (
                        <button
                          onClick={() => handleAcceptProposal(showDetailModal.brief.brief_id, proposal.proposal_id)}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center gap-2"
                          data-testid={`accept-proposal-${proposal.proposal_id}`}
                        >
                          <Check className="w-4 h-4" /> Kabul Et
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BriefsPage;
