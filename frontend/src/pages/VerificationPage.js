import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, CheckCircle, Clock, XCircle, Upload, AlertCircle, FileText, User } from 'lucide-react';
import Navbar from '../components/Navbar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VerificationPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [verificationForm, setVerificationForm] = useState({
    verification_type: 'tc_kimlik',
    document_number: '',
    full_name: ''
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchVerificationStatus();
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

  const fetchVerificationStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/identity-verification/status`, { withCredentials: true });
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setVerificationStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axios.post(`${API_URL}/api/identity-verification`, verificationForm, { withCredentials: true });
      alert('Doğrulama talebiniz alındı! Admin onayı bekleniyor.');
      fetchVerificationStatus();
      setVerificationForm({ verification_type: 'tc_kimlik', document_number: '', full_name: '' });
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert(error.response?.data?.detail || 'Doğrulama talebi gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', text: 'Onaylandı' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', text: 'Onay Bekliyor' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', text: 'Reddedildi' };
      default:
        return { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-500/20', text: status };
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

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Kimlik Doğrulama</h1>
          <p className="text-gray-400">Hesabınızı doğrulayarak güvenilirliğinizi artırın</p>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 rounded-2xl p-6 mb-8 border border-fuchsia-500/30">
          <h3 className="font-bold text-lg mb-4">Doğrulanmış Hesap Avantajları</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium">Güven Rozeti</p>
                <p className="text-sm text-gray-400">Profilinizde "Doğrulanmış" rozeti görünür</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium">Öncelikli Görünürlük</p>
                <p className="text-sm text-gray-400">Aramalarda üst sıralarda çıkın</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium">Marka Güveni</p>
                <p className="text-sm text-gray-400">Markalar doğrulanmış hesapları tercih eder</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium">Ödeme Güvencesi</p>
                <p className="text-sm text-gray-400">Gelecekte ödemeler için gerekli</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : verificationStatus ? (
          /* Existing Verification Status */
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-8">
            <h3 className="text-xl font-bold mb-6">Doğrulama Durumunuz</h3>
            
            {(() => {
              const statusInfo = getStatusInfo(verificationStatus.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div className={`${statusInfo.bg} rounded-xl p-6 mb-6`}>
                  <div className="flex items-center gap-4">
                    <StatusIcon className={`w-12 h-12 ${statusInfo.color}`} />
                    <div>
                      <p className={`text-2xl font-bold ${statusInfo.color}`}>{statusInfo.text}</p>
                      <p className="text-gray-400">
                        {verificationStatus.verification_type === 'tc_kimlik' ? 'TC Kimlik' : 'Vergi Numarası'} ile doğrulama
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-700">
                <span className="text-gray-400">Ad Soyad</span>
                <span className="font-medium">{verificationStatus.full_name}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-700">
                <span className="text-gray-400">Doğrulama Tipi</span>
                <span className="font-medium">
                  {verificationStatus.verification_type === 'tc_kimlik' ? 'TC Kimlik No' : 'Vergi Numarası'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-700">
                <span className="text-gray-400">Başvuru Tarihi</span>
                <span className="font-medium">
                  {new Date(verificationStatus.submitted_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
              {verificationStatus.reviewed_at && (
                <div className="flex justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">İnceleme Tarihi</span>
                  <span className="font-medium">
                    {new Date(verificationStatus.reviewed_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
            </div>

            {verificationStatus.status === 'rejected' && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Başvurunuz reddedildi. Lütfen bilgilerinizi kontrol edip tekrar başvurun.
                </p>
              </div>
            )}

            {verificationStatus.status === 'rejected' && (
              <button
                onClick={() => setVerificationStatus(null)}
                className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                Yeniden Başvur
              </button>
            )}
          </div>
        ) : (
          /* Verification Form */
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-8">
            <h3 className="text-xl font-bold mb-6">Doğrulama Başvurusu</h3>
            
            <form onSubmit={handleSubmitVerification} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Doğrulama Tipi *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setVerificationForm({...verificationForm, verification_type: 'tc_kimlik'})}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      verificationForm.verification_type === 'tc_kimlik'
                        ? 'border-fuchsia-500 bg-fuchsia-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <User className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-semibold">TC Kimlik</p>
                      <p className="text-xs text-gray-400">Bireysel hesaplar için</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationForm({...verificationForm, verification_type: 'vergi_no'})}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      verificationForm.verification_type === 'vergi_no'
                        ? 'border-fuchsia-500 bg-fuchsia-500/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-semibold">Vergi No</p>
                      <p className="text-xs text-gray-400">Kurumsal hesaplar için</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {verificationForm.verification_type === 'tc_kimlik' ? 'Ad Soyad *' : 'Firma / Şahıs Adı *'}
                </label>
                <input
                  type="text"
                  value={verificationForm.full_name}
                  onChange={e => setVerificationForm({...verificationForm, full_name: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder={verificationForm.verification_type === 'tc_kimlik' ? 'Ahmet Yılmaz' : 'ABC Ltd. Şti.'}
                  data-testid="verification-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {verificationForm.verification_type === 'tc_kimlik' ? 'TC Kimlik No *' : 'Vergi Numarası *'}
                </label>
                <input
                  type="text"
                  value={verificationForm.document_number}
                  onChange={e => setVerificationForm({...verificationForm, document_number: e.target.value})}
                  required
                  maxLength={verificationForm.verification_type === 'tc_kimlik' ? 11 : 10}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white"
                  placeholder={verificationForm.verification_type === 'tc_kimlik' ? '12345678901' : '1234567890'}
                  data-testid="verification-number-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {verificationForm.verification_type === 'tc_kimlik' 
                    ? '11 haneli TC Kimlik numaranız' 
                    : '10 haneli vergi numaranız'}
                </p>
              </div>

              {/* Privacy Notice */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium text-sm">Güvenlik Bildirimi</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Bilgileriniz şifrelenerek saklanır ve sadece doğrulama amacıyla kullanılır. 
                      Üçüncü taraflarla paylaşılmaz.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                data-testid="submit-verification-btn"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Doğrulama Başvurusu Yap
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
