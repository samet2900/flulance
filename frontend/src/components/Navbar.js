import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, User, Home, Briefcase, MessageCircle, LogOut, Settings, Star, Menu, X, Heart } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user && user.user_id) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If no user, don't render the navbar
  if (!user || !user.user_id) {
    return null;
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/unread-count`, {
        withCredentials: true
      });
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        withCredentials: true
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      await fetchNotifications();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
        withCredentials: true
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API_URL}/api/notifications/mark-all-read`, {}, {
        withCredentials: true
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getDashboardLink = () => {
    if (user.user_type === 'marka') return '/brand';
    if (user.user_type === 'influencer') return '/influencer';
    if (user.user_type === 'admin') return '/admin';
    return '/home';
  };

  const getBadgeColor = (badge) => {
    if (badge === 'verified') return 'bg-blue-500';
    if (badge === 'top') return 'bg-gradient-to-r from-yellow-400 to-orange-400';
    if (badge === 'new') return 'bg-green-500';
    return '';
  };

  return (
    <nav className="bg-black/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="mobile-menu-btn"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
              data-testid="nav-logo"
            >
              <img 
                src="https://customer-assets.emergentagent.com/job_freelance-hub-216/artifacts/er3uz3pj_WhatsApp%20Image%202026-01-03%20at%2015.54.27.jpeg" 
                alt="FLULANCE Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text">FLULANCE</span>
            </button>
            
            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => navigate('/home')}
                className="px-4 py-2 text-white hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                data-testid="nav-home"
              >
                <Home className="w-4 h-4" />
                Ana Sayfa
              </button>
              {user.user_type !== 'admin' && (
                <>
                  <button
                    onClick={() => {
                      navigate('/home');
                      setTimeout(() => {
                        document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }}
                    className="px-4 py-2 text-white hover:text-fuchsia-400 transition-colors flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    İş İlanları
                  </button>
                  <button
                    onClick={() => navigate('/announcements')}
                    className="px-4 py-2 text-white hover:text-cyan-400 transition-colors flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Duyurular
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Side - User Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleNotificationClick}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                data-testid="notifications-btn"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-fuchsia-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden" data-testid="notifications-dropdown">
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold">Bildirimler</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-fuchsia-400 hover:text-fuchsia-300"
                      >
                        Tümünü okundu işaretle
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Henüz bildirim yok</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.notification_id}
                          className={`p-4 border-b border-gray-800 hover:bg-white/5 cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-fuchsia-500/10' : ''
                          }`}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.notification_id);
                            if (notif.link) navigate(notif.link);
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-sm mb-1">{notif.title}</p>
                              <p className="text-xs text-gray-400">{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notif.created_at).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <div className="w-2 h-2 bg-fuchsia-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
                data-testid="profile-menu-btn"
              >
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    {user.name}
                    {user.badge && (
                      <span className={`text-xs px-2 py-0.5 ${getBadgeColor(user.badge)} rounded-full`}>
                        {user.badge === 'verified' && '✓'}
                        {user.badge === 'top' && '⭐'}
                        {user.badge === 'new' && '🆕'}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{user.user_type}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden" data-testid="profile-dropdown">
                  <div className="p-4 border-b border-gray-700">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate(getDashboardLink());
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-fuchsia-500/20 transition-colors flex items-center gap-3"
                      data-testid="nav-dashboard"
                    >
                      <Briefcase className="w-4 h-4" />
                      Panelim
                    </button>
                    {user.user_type === 'influencer' && (
                      <button
                        onClick={() => {
                          navigate('/favorites');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-fuchsia-500/20 transition-colors flex items-center gap-3"
                      >
                        <Heart className="w-4 h-4" />
                        Favorilerim
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-fuchsia-500/20 transition-colors flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4" />
                      Ayarlar
                    </button>
                  </div>
                  <div className="border-t border-gray-700">
                    <button
                      onClick={() => {
                        onLogout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-500/20 transition-colors flex items-center gap-3 text-red-400"
                      data-testid="nav-logout"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-2">
            <button
              onClick={() => {
                navigate('/home');
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-fuchsia-500/20 rounded-lg transition-colors flex items-center gap-3"
            >
              <Home className="w-5 h-5" />
              Ana Sayfa
            </button>
            
            {user.user_type !== 'admin' && (
              <>
                <button
                  onClick={() => {
                    navigate('/home');
                    setShowMobileMenu(false);
                    setTimeout(() => {
                      document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-fuchsia-500/20 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Briefcase className="w-5 h-5" />
                  İş İlanları
                </button>
                
                <button
                  onClick={() => {
                    navigate('/announcements');
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-fuchsia-500/20 rounded-lg transition-colors flex items-center gap-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  Duyurular
                </button>
                
                <button
                  onClick={() => {
                    navigate('/favorites');
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-fuchsia-500/20 rounded-lg transition-colors flex items-center gap-3"
                >
                  <Heart className="w-5 h-5" />
                  Favorilerim
                </button>
              </>
            )}
            
            <button
              onClick={() => {
                navigate(getDashboardLink());
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-fuchsia-500/20 rounded-lg transition-colors flex items-center gap-3"
            >
              <User className="w-5 h-5" />
              Panelim
            </button>
            
            <button
              onClick={() => {
                navigate('/settings');
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-fuchsia-500/20 rounded-lg transition-colors flex items-center gap-3"
            >
              <Settings className="w-5 h-5" />
              Ayarlar
            </button>
            
            <div className="border-t border-gray-700 pt-2 mt-2">
              <button
                onClick={() => {
                  onLogout();
                  setShowMobileMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-3 text-red-400"
              >
                <LogOut className="w-5 h-5" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
