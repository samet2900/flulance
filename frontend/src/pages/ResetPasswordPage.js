import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, ArrowLeft, CheckCircle, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/auth/verify-reset-token/${token}`);
      setTokenValid(response.data.valid);
    } catch (error) {
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        new_password: password
      });
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.detail || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Link doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-gray-800 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Geçersiz Link</h1>
          <p className="text-gray-400 mb-6">
            Bu şifre sıfırlama linki geçersiz veya süresi dolmuş.
            Lütfen yeni bir şifre sıfırlama talebi oluşturun.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold text-white hover:scale-105 transition-transform"
          >
            Yeni Link Talep Et
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-gray-800 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Şifre Değiştirildi!</h1>
          <p className="text-gray-400 mb-6">
            Şifreniz başarıyla değiştirildi. Artık yeni şifrenizle giriş yapabilirsiniz.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold text-white hover:scale-105 transition-transform"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-gray-800 shadow-2xl">
        {/* Back Button */}
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Giriş sayfasına dön
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Yeni Şifre Belirle</h1>
          <p className="text-gray-400">
            Hesabınız için yeni bir şifre oluşturun.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white placeholder-gray-500 pr-12"
                placeholder="••••••••"
                data-testid="new-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Şifre Tekrar
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:border-fuchsia-500 text-white placeholder-gray-500"
              placeholder="••••••••"
              data-testid="confirm-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl font-semibold text-white hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            data-testid="reset-submit-btn"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Şifreyi Değiştir
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
