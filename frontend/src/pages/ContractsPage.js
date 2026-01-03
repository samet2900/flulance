import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Plus, Eye, Clock, Check, X, Pen, Download, Shield, Calendar, DollarSign, User } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ContractsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [signing, setSigning] = useState(false);

  const [contractForm, setContractForm] = useState({
    match_id: '',
    title: '',
    description: '',
    total_amount: '',
    payment_terms: 'completion',
    start_date: '',
    end_date: '',
    terms_and_conditions: ''
  });

  const paymentTermOptions = [
    { value: 'upfront', label: 'Peşin Ödeme' },
    { value: 'milestone', label: 'Aşamalı Ödeme' },
    { value: 'completion', label: 'Tamamlandığında' }
  ];

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchContracts();
      fetchMatches();
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

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/contracts/my-contracts`, { withCredentials: true });
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/matches/my-matches`, { withCredentials: true });
      setMatches(response.data.filter(m => m.status === 'active'));
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchContractDetail = async (contractId) => {
    try {
      const response = await axios.get(`${API_URL}/api/contracts/${contractId}`, { withCredentials: true });
      setShowDetailModal(response.data);
    } catch (error) {
      console.error('Error fetching contract detail:', error);
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/contracts`, {
        ...contractForm,
        total_amount: parseFloat(contractForm.total_amount)
      }, { withCredentials: true });
      
      setShowCreateModal(false);
      setContractForm({
        match_id: '', title: '', description: '', total_amount: '',
        payment_terms: 'completion', start_date: '', end_date: '', terms_and_conditions: ''
      });
      fetchContracts();
      alert('Sözleşme oluşturuldu! Diğer tarafın imzalaması bekleniyor.');
    } catch (error) {
      console.error('Error creating contract:', error);
      alert(error.response?.data?.detail || 'Sözleşme oluşturulurken hata oluştu');
    }
  };

  const handleSignContract = async (contractId) => {
    if (!window.confirm('Bu sözleşmeyi imzalamak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
    
    setSigning(true);
    try {
      await axios.post(`${API_URL}/api/contracts/${contractId}/sign`, {}, { withCredentials: true });
      alert('Sözleşme başarıyla imzalandı!');
      fetchContractDetail(contractId);
      fetchContracts();
    } catch (error) {
      console.error('Error signing contract:', error);
      alert(error.response?.data?.detail || 'Sözleşme imzalanırken hata oluştu');
    } finally {
      setSigning(false);
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'draft':
        return { color: 'text-gray-400', bg: 'bg-gray-500/20', text: 'Taslak' };
      case 'pending':
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', text: 'İmza Bekliyor' };
      case 'active':
        return { color: 'text-green-400', bg: 'bg-green-500/20', text: 'Aktif' };
      case 'completed':
        return { color: 'text-blue-400', bg: 'bg-blue-500/20', text: 'Tamamlandı' };
      case 'cancelled':
        return { color: 'text-red-400', bg: 'bg-red-500/20', text: 'İptal' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-500/20', text: status };
    }
  };

  const canSign = (contract) => {
    if (!contract || !user) return false;
    const isBrand = user.user_id === contract.brand_user_id;
    const isInfluencer = user.user_id === contract.influencer_user_id;
    
    if (isBrand && !contract.brand_signed) return true;
    if (isInfluencer && !contract.influencer_signed) return true;
    return false;
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
            <h1 className="text-3xl font-bold mb-2">Dijital Sözleşmeler</h1>
            <p className="text-gray-400">Anlaşmalarınızı platform üzerinde resmileştirin</p>
          </div>
          {user.user_type === 'marka' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
              data-testid="create-contract-btn"
            >
              <Plus className="w-5 h-5" />
              Yeni Sözleşme
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium">Güvenli Dijital İmza</p>
              <p className="text-sm text-gray-400 mt-1">
                Platform üzerinden imzalanan sözleşmeler kayıt altına alınır. Her iki taraf imzaladığında sözleşme aktif hale gelir.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-2">Henüz sözleşmeniz yok</p>
            <p className="text-sm text-gray-500">
              {user.user_type === 'marka' 
                ? 'Eşleşmeleriniz için sözleşme oluşturabilirsiniz' 
                : 'Markalar sözleşme oluşturduğunda burada görünecek'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6" data-testid="contracts-list">
            {contracts.map(contract => {
              const statusInfo = getStatusInfo(contract.status);
              
              return (
                <div 
                  key={contract.contract_id} 
                  className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 hover:border-fuchsia-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-6 h-6 text-fuchsia-400" />
                        <h3 className="text-xl font-bold">{contract.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 mb-4 line-clamp-2">{contract.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1 text-green-400">
                          <DollarSign className="w-4 h-4" />
                          {contract.total_amount?.toLocaleString('tr-TR')} ₺
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {contract.start_date} - {contract.end_date}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {/* Signature Status */}
                      <div className="flex gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${contract.brand_signed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          Marka {contract.brand_signed ? '✓' : '○'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${contract.influencer_signed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          Influencer {contract.influencer_signed ? '✓' : '○'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => fetchContractDetail(contract.contract_id)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                      data-testid={`view-contract-${contract.contract_id}`}
                    >
                      <Eye className="w-4 h-4" /> Detaylar
                    </button>
                    
                    {canSign(contract) && contract.status !== 'cancelled' && (
                      <button
                        onClick={() => handleSignContract(contract.contract_id)}
                        disabled={signing}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                        data-testid={`sign-contract-${contract.contract_id}`}
                      >
                        <Pen className="w-4 h-4" /> İmzala
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full my-8 border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Yeni Sözleşme Oluştur</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateContract} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-2">İlgili Eşleşme *</label>
                <select
                  value={contractForm.match_id}
                  onChange={e => setContractForm({...contractForm, match_id: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  style={{colorScheme: 'dark'}}
                  data-testid="contract-match-select"
                >
                  <option value="">Eşleşme Seçin</option>
                  {matches.map(match => (
                    <option key={match.match_id} value={match.match_id} className="bg-gray-800">
                      {match.job_title} - {match.influencer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sözleşme Başlığı *</label>
                <input
                  type="text"
                  value={contractForm.title}
                  onChange={e => setContractForm({...contractForm, title: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder="Örn: Instagram Kampanyası Sözleşmesi"
                  data-testid="contract-title-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Açıklama *</label>
                <textarea
                  value={contractForm.description}
                  onChange={e => setContractForm({...contractForm, description: e.target.value})}
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="İş kapsamı ve beklentiler..."
                  data-testid="contract-description-input"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Toplam Tutar (₺) *</label>
                  <input
                    type="number"
                    value={contractForm.total_amount}
                    onChange={e => setContractForm({...contractForm, total_amount: e.target.value})}
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ödeme Şekli *</label>
                  <select
                    value={contractForm.payment_terms}
                    onChange={e => setContractForm({...contractForm, payment_terms: e.target.value})}
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  >
                    {paymentTermOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-800">{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    value={contractForm.start_date}
                    onChange={e => setContractForm({...contractForm, start_date: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    value={contractForm.end_date}
                    onChange={e => setContractForm({...contractForm, end_date: e.target.value})}
                    required
                    className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                    style={{colorScheme: 'dark'}}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Şartlar ve Koşullar</label>
                <textarea
                  value={contractForm.terms_and_conditions}
                  onChange={e => setContractForm({...contractForm, terms_and_conditions: e.target.value})}
                  rows={5}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="Ek şartlar, koşullar, kısıtlamalar..."
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
                  disabled={matches.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  data-testid="submit-contract-btn"
                >
                  Sözleşme Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full my-8 border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="w-7 h-7 text-fuchsia-400" />
                Sözleşme Detayı
              </h2>
              <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Status & Signatures */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`${getStatusInfo(showDetailModal.status).bg} rounded-xl p-4`}>
                  <p className="text-gray-400 text-sm">Durum</p>
                  <p className={`text-xl font-bold ${getStatusInfo(showDetailModal.status).color}`}>
                    {getStatusInfo(showDetailModal.status).text}
                  </p>
                </div>
                
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-2">İmza Durumu</p>
                  <div className="flex gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${showDetailModal.brand_signed ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                      {showDetailModal.brand_signed ? <Check className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-gray-400" />}
                      <span className={showDetailModal.brand_signed ? 'text-green-400' : 'text-gray-400'}>Marka</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${showDetailModal.influencer_signed ? 'bg-green-500/20' : 'bg-gray-700'}`}>
                      {showDetailModal.influencer_signed ? <Check className="w-4 h-4 text-green-400" /> : <Clock className="w-4 h-4 text-gray-400" />}
                      <span className={showDetailModal.influencer_signed ? 'text-green-400' : 'text-gray-400'}>Influencer</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Sözleşme Başlığı</p>
                  <p className="text-xl font-bold">{showDetailModal.title}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Açıklama</p>
                  <p className="text-gray-300 bg-black/30 rounded-lg p-3 mt-1">{showDetailModal.description}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Toplam Tutar</p>
                    <p className="text-2xl font-bold text-green-400">{showDetailModal.total_amount?.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ödeme Şekli</p>
                    <p className="font-semibold">
                      {paymentTermOptions.find(o => o.value === showDetailModal.payment_terms)?.label || showDetailModal.payment_terms}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Süre</p>
                    <p className="font-semibold">{showDetailModal.start_date} - {showDetailModal.end_date}</p>
                  </div>
                </div>

                {showDetailModal.terms_and_conditions && (
                  <div>
                    <p className="text-gray-400 text-sm">Şartlar ve Koşullar</p>
                    <p className="text-gray-300 bg-black/30 rounded-lg p-3 mt-1 whitespace-pre-wrap">{showDetailModal.terms_and_conditions}</p>
                  </div>
                )}
              </div>

              {/* Sign Button */}
              {canSign(showDetailModal) && showDetailModal.status !== 'cancelled' && (
                <button
                  onClick={() => handleSignContract(showDetailModal.contract_id)}
                  disabled={signing}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  data-testid="sign-contract-detail-btn"
                >
                  {signing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Pen className="w-5 h-5" />
                      Sözleşmeyi İmzala
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowDetailModal(null)}
                className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
