import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);

  const { tempSession, userData } = location.state || {};

  if (!tempSession) {
    navigate('/auth');
    return null;
  }

  const handleContinue = async () => {
    if (!selectedType) return;
    
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/complete-google-signup?user_type=${selectedType}`,
        {},
        {
          headers: { 'temp-session': tempSession },
          withCredentials: true
        }
      );

      const user = response.data;

      // Always redirect to home feed
      navigate('/home', { state: { user }, replace: true });
    } catch (error) {
      console.error('Error completing signup:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Hoş geldin, {userData?.name}!</h1>
          <p className="text-gray-400 text-lg">Kimsin sen?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => setSelectedType('marka')}
            className={`p-8 rounded-2xl border-2 transition-all ${
              selectedType === 'marka'
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-white/20 bg-white/5 hover:border-white/40'
            }`}
            data-testid="select-marka"
          >
            <Briefcase className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Marka</h2>
            <p className="text-gray-400">İş ilanı oluştur, influencer'larla çalış</p>
          </button>

          <button
            onClick={() => setSelectedType('influencer')}
            className={`p-8 rounded-2xl border-2 transition-all ${
              selectedType === 'influencer'
                ? 'border-pink-500 bg-pink-500/20'
                : 'border-white/20 bg-white/5 hover:border-white/40'
            }`}
            data-testid="select-influencer"
          >
            <Sparkles className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Influencer</h2>
            <p className="text-gray-400">Profilini oluştur, işlere başvur</p>
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedType || loading}
            className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            data-testid="continue-btn"
          >
            {loading ? 'Yükleniyor...' : 'Devam Et'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;