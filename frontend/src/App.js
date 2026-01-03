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
import AdminSecretLogin from './pages/AdminSecretLogin';
import FavoritesPage from './pages/FavoritesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import InfluencerSearchPage from './pages/InfluencerSearchPage';
import SettingsPage from './pages/SettingsPage';
import BriefsPage from './pages/BriefsPage';
import PortfolioPage from './pages/PortfolioPage';
import SocialAccountsPage from './pages/SocialAccountsPage';
import CategoryAlertsPage from './pages/CategoryAlertsPage';
import VerificationPage from './pages/VerificationPage';
import DisputesPage from './pages/DisputesPage';
import ContractsPage from './pages/ContractsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
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
      
      {/* Favorites Page */}
      <Route
        path="/favorites"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer']}>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      
      {/* Influencer Search - For brands */}
      <Route
        path="/influencers"
        element={
          <ProtectedRoute allowedRoles={['marka']}>
            <InfluencerSearchPage />
          </ProtectedRoute>
        }
      />
      
      {/* Briefs - Reverse Job Posts */}
      <Route
        path="/briefs"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer']}>
            <BriefsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Portfolio */}
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute allowedRoles={['influencer', 'marka']}>
            <PortfolioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio/:userId"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer', 'admin']}>
            <PortfolioPage />
          </ProtectedRoute>
        }
      />
      
      {/* Social Accounts */}
      <Route
        path="/social-accounts"
        element={
          <ProtectedRoute allowedRoles={['influencer']}>
            <SocialAccountsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Category Alerts */}
      <Route
        path="/category-alerts"
        element={
          <ProtectedRoute allowedRoles={['influencer']}>
            <CategoryAlertsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Identity Verification */}
      <Route
        path="/verification"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer']}>
            <VerificationPage />
          </ProtectedRoute>
        }
      />
      
      {/* Disputes */}
      <Route
        path="/disputes"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer']}>
            <DisputesPage />
          </ProtectedRoute>
        }
      />
      
      {/* Contracts */}
      <Route
        path="/contracts"
        element={
          <ProtectedRoute allowedRoles={['marka', 'influencer']}>
            <ContractsPage />
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
      
      {/* Admin Secret Login */}
      <Route path="/osyo" element={<AdminSecretLogin />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;