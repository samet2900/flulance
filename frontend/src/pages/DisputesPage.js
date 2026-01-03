import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, Plus, Eye, Clock, X, MessageCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DisputesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);

  const [disputeForm, setDisputeForm] = useState({
    match_id: '',
    reason: '',
    description: ''
  });

  const disputeReasons = [
    'İş teslim edilmedi',
    'İş kalitesi yetersiz',
    'Anlaşılan şartlara uyulmadı',
    'İletişim sorunları',
    'Ödeme sorunu',
    'Diğer'
  ];

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDisputes();
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

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/disputes/my-disputes`, { withCredentials: true });
      setDisputes(response.data);
    } catch (error) {
      console.error('Error fetching disputes:', error);
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

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/disputes`, disputeForm, { withCredentials: true });
      
      setShowCreateModal(false);
      setDisputeForm({ match_id: '', reason: '', description: '' });
      fetchDisputes();
      alert('Anlaşmazlık bildirimi oluşturuldu. Admin ekibi en kısa sürede inceleyecek.');
    } catch (error) {
      console.error('Error creating dispute:', error);
      alert(error.response?.data?.detail || 'Anlaşmazlık oluşturulurken hata oluştu');
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'open':
        return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', text: 'Açık' };
      case 'under_review':
        return { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/20', text: 'İnceleniyor' };
      case 'resolved':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', text: 'Çözüldü' };
      case 'closed':
        return { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/20', text: 'Kapatıldı' };
      default:
        return { icon: AlertTriangle, color: 'text-gray-400', bg: 'bg-gray-500/20', text: status };
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
            <h1 className="text-3xl font-bold mb-2">Anlaşmazlık Çözümü</h1>
            <p className="text-gray-400">Sorunlarınızı bildirin, admin ekibi arabuluculuk yapacak</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
            data-testid="create-dispute-btn"
          >
            <Plus className="w-5 h-5" />
            Anlaşmazlık Bildir
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">Anlaşmazlık Süreci</p>
              <p className="text-sm text-gray-400 mt-1">
                Anlaşmazlık bildirdiğinizde admin ekibi her iki tarafın görüşlerini alır ve adil bir çözüm üretir.
                Süreç boyunca ilgili iş dondurulabilir.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <p className="text-gray-400 mb-2">Aktif anlaşmazlığınız yok</p>
            <p className="text-sm text-gray-500">Sorun yaşarsanız yukarıdaki butonu kullanarak bildirebilirsiniz</p>
          </div>
        ) : (
          <div className="grid gap-6" data-testid="disputes-list">
            {disputes.map(dispute => {
              const statusInfo = getStatusInfo(dispute.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div 
                  key={dispute.dispute_id} 
                  className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 hover:border-yellow-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">{dispute.reason}</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        Karşı taraf: <span className="text-white">{dispute.reported_name}</span>
                      </p>
                      <p className="text-gray-300 line-clamp-2">{dispute.description}</p>
                    </div>
                    
                    <div className="text-right text-sm text-gray-500">
                      <p>{new Date(dispute.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>

                  {/* Resolution (if resolved) */}
                  {dispute.status === 'resolved' && dispute.resolution && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                      <p className="text-green-400 font-medium mb-1">Çözüm</p>
                      <p className="text-gray-300 text-sm">{dispute.resolution}</p>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {dispute.admin_notes && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                      <p className="text-blue-400 font-medium mb-1">Admin Notu</p>
                      <p className="text-gray-300 text-sm">{dispute.admin_notes}</p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowDetailModal(dispute)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    data-testid={`view-dispute-${dispute.dispute_id}`}
                  >
                    <Eye className="w-4 h-4" /> Detayları Gör
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dispute Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Anlaşmazlık Bildir</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDispute} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">İlgili İş/Eşleşme *</label>
                <select
                  value={disputeForm.match_id}
                  onChange={e => setDisputeForm({...disputeForm, match_id: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  style={{colorScheme: 'dark'}}
                  data-testid="dispute-match-select"
                >
                  <option value="">Eşleşme Seçin</option>
                  {matches.map(match => (
                    <option key={match.match_id} value={match.match_id} className="bg-gray-800">
                      {match.job_title} - {user.user_type === 'marka' ? match.influencer_name : match.brand_name}
                    </option>
                  ))}
                </select>
                {matches.length === 0 && (
                  <p className="text-sm text-yellow-400 mt-1">Aktif eşleşmeniz bulunmuyor</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sorun Nedeni *</label>
                <select
                  value={disputeForm.reason}
                  onChange={e => setDisputeForm({...disputeForm, reason: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  style={{colorScheme: 'dark'}}
                  data-testid="dispute-reason-select"
                >
                  <option value="">Neden Seçin</option>
                  {disputeReasons.map(reason => (
                    <option key={reason} value={reason} className="bg-gray-800">{reason}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detaylı Açıklama *</label>
                <textarea
                  value={disputeForm.description}
                  onChange={e => setDisputeForm({...disputeForm, description: e.target.value})}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none text-white"
                  placeholder="Sorunu detaylı olarak açıklayın. Tarihler, anlaşma detayları vb. bilgileri ekleyin..."
                  data-testid="dispute-description-input"
                />
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">
                  Anlaşmazlık bildirimi ciddi bir işlemdir. Gereksiz veya asılsız bildirimler hesabınızı olumsuz etkileyebilir.
                </p>
              </div>

              <div className="flex gap-4 pt-2">
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  data-testid="submit-dispute-btn"
                >
                  Bildir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full my-8 border border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Anlaşmazlık Detayı</h2>
              <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status */}
              {(() => {
                const statusInfo = getStatusInfo(showDetailModal.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div className={`${statusInfo.bg} rounded-xl p-4 flex items-center gap-3`}>
                    <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
                    <div>
                      <p className={`text-lg font-bold ${statusInfo.color}`}>{statusInfo.text}</p>
                      <p className="text-sm text-gray-400">Durum</p>
                    </div>
                  </div>
                );
              })()}

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Sorun Nedeni</p>
                  <p className="font-semibold text-lg">{showDetailModal.reason}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Raporlayan</p>
                  <p className="font-semibold">{showDetailModal.reporter_name}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Raporlanan</p>
                  <p className="font-semibold">{showDetailModal.reported_name}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Açıklama</p>
                  <p className="text-gray-300 bg-black/30 rounded-lg p-3 mt-1">{showDetailModal.description}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">Bildirim Tarihi</p>
                  <p className="font-semibold">{new Date(showDetailModal.created_at).toLocaleString('tr-TR')}</p>
                </div>

                {showDetailModal.resolved_at && (
                  <div>
                    <p className="text-gray-400 text-sm">Çözüm Tarihi</p>
                    <p className="font-semibold">{new Date(showDetailModal.resolved_at).toLocaleString('tr-TR')}</p>
                  </div>
                )}
              </div>

              {/* Resolution */}
              {showDetailModal.resolution && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <p className="text-green-400 font-medium mb-2">Çözüm Kararı</p>
                  <p className="text-gray-300">{showDetailModal.resolution}</p>
                </div>
              )}

              {/* Admin Notes */}
              {showDetailModal.admin_notes && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-400 font-medium mb-2">Admin Notları</p>
                  <p className="text-gray-300">{showDetailModal.admin_notes}</p>
                </div>
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

export default DisputesPage;
