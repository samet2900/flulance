import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = location.hash;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];

      if (!sessionId) {
        navigate('/auth');
        return;
      }

      try {
        const response = await axios.post(
          `${API_URL}/api/auth/google-session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          }
        );

        const data = response.data;

        if (data.new_user) {
          // New user needs to select type
          navigate('/select-user-type', { state: { tempSession: data.temp_session, userData: data } });
        } else {
          // Existing user - redirect to home feed
          navigate('/home', { state: { user: data }, replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/auth');
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Giriş yapılıyor...</p>
      </div>
    </div>
  );
};

export default AuthCallback;