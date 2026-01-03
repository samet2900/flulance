import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Bell, TrendingUp, Star, Calendar } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AnnouncementsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

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

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/announcements`, {
        withCredentials: true
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
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

  const getAnnouncementIcon = (type) => {
    if (type === 'news') return <Bell className="w-8 h-8 text-blue-400" />;
    if (type === 'update') return <TrendingUp className="w-8 h-8 text-green-400" />;
    if (type === 'promotion') return <Star className="w-8 h-8 text-yellow-400" />;
    return <Bell className="w-8 h-8" />;
  };

  const getTypeLabel = (type) => {
    if (type === 'news') return 'Haber';
    if (type === 'update') return 'Güncelleme';
    if (type === 'promotion') return 'Promosyon';
    return type;
  };

  const getTypeBg = (type) => {
    if (type === 'news') return 'bg-blue-500/20 border-blue-500/50';
    if (type === 'update') return 'bg-green-500/20 border-green-500/50';
    if (type === 'promotion') return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-gray-900/50 border-gray-800';
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Bell className="w-10 h-10 text-fuchsia-400" />
            Duyurular
          </h1>
          <p className="text-gray-400">Platform haberler
i ve güncellemeleri</p>
        </div>

        {/* Announcements Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500 mx-auto"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-black/50 rounded-2xl border border-gray-700">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">Henüz duyuru yok</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="announcements-grid">
            {announcements.map((announcement) => (
              <div
                key={announcement.announcement_id}
                className={`backdrop-blur-sm rounded-2xl p-6 border-2 hover:scale-105 transition-transform ${getTypeBg(announcement.type)}`}
                data-testid={`announcement-${announcement.announcement_id}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  {getAnnouncementIcon(announcement.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        announcement.type === 'news' ? 'bg-blue-500/30 text-blue-300' :
                        announcement.type === 'update' ? 'bg-green-500/30 text-green-300' :
                        'bg-yellow-500/30 text-yellow-300'
                      }`}>
                        {getTypeLabel(announcement.type)}
                      </span>
                      {announcement.is_pinned && (
                        <span className="px-3 py-1 bg-fuchsia-500/30 text-fuchsia-300 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Önemli
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{announcement.title}</h3>
                  </div>
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">{announcement.content}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {new Date(announcement.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
