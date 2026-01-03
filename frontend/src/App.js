import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import UserTypeSelection from './pages/UserTypeSelection';
import HomeFeed from './pages/HomeFeed';
import AnnouncementsPage from './pages/AnnouncementsPage';
import BrandDashboard from './pages/BrandDashboard';
import InfluencerDashboard from './pages/InfluencerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useLocation } from 'react-router-dom';

function AppRouter() {
  const location = useLocation();
  
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check URL fragment for session_id synchronously
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/select-user-type" element={<UserTypeSelection />} />
      
      {/* Home Feed - All authenticated users */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer', 'admin']}>
            <HomeFeed />
          </ProtectedRoute>
        }
      />
      
      {/* Announcements Page */}
      <Route
        path="/announcements"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer', 'admin']}>
            <AnnouncementsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Settings Page */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer', 'admin']}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Brand Routes */}
      <Route
        path="/brand"
        element={
          <ProtectedRoute allowedRoles={['marka']}>
            <BrandDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Influencer Routes */}
      <Route
        path="/influencer"
        element={
          <ProtectedRoute allowedRoles={['influencer']}>
            <InfluencerDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;