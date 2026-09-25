import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Landing from '@/pages/Landing';
import Storefront from '@/pages/Storefront';
import ProductDetail from '@/pages/ProductDetail';
import CategoryPage from '@/pages/CategoryPage';
import SearchPage from '@/pages/SearchPage';
import CartPage from '@/pages/CartPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AdminLayout from '@/components/admin/AdminLayout';
import Dashboard from '@/pages/Dashboard';
import ThemeEditor from '@/pages/ThemeEditor';
import Analytics from '@/pages/Analytics';
import ThemeGallery from '@/pages/ThemeGallery';
import Products from '@/pages/Products';
import Orders from '@/pages/Orders';
import Customers from '@/pages/Customers';
import Collections from '@/pages/Collections';
import Discounts from '@/pages/Discounts';
import Growth from '@/pages/Growth';
import Content from '@/pages/Content';
import Marketing from '@/pages/Marketing';
import AssistantIA from '@/pages/AssistantIA';
import Automations from '@/pages/Automations';
import Accounting from '@/pages/Accounting';
import Markets from '@/pages/Markets';
import Chat from '@/pages/Chat';
import Apps from '@/pages/Apps';
import Payments from '@/pages/Payments';
import Superadmin from '@/pages/Superadmin';
import Profile from '@/pages/Profile';
import StorePreview from '@/pages/StorePreview';
import ActivityLogs from '@/pages/ActivityLogs';
import SeoIa from '@/pages/SeoIa';
import Onboarding from '@/pages/Onboarding';
import ArticleDetail from '@/pages/ArticleDetail';
// Team.jsx (still on base44, StaffManagement.jsx covers this now) - import
// removed, /team redirects to /settings instead of crashing.
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Billing from '@/pages/Billing';
import Inventory from '@/pages/Inventory';
import ShippingSettings from '@/pages/ShippingSettings';
import Reviews from '@/pages/Reviews';
import Domains from '@/pages/Domains';
import StaffManagement from '@/pages/StaffManagement';
import StoreSettings from '@/pages/StoreSettings';
import Support from '@/pages/Support';
import Blog from '@/pages/Blog';
import ProductAnalytics from '@/pages/ProductAnalytics';
import MediaLibrary from '@/pages/MediaLibrary';
import AbandonedCheckouts from '@/pages/AbandonedCheckouts';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors that block the whole app (e.g. this app
  // requires auth before its public settings can even be fetched). We do NOT
  // bail out for 'auth_required' here: that would hijack every route -
  // including the public /login, /register and storefront pages - into an
  // external redirect before the router ever runs. Per-route protection is
  // already handled below by ProtectedRoute, which sends unauthenticated
  // visitors to /login via a normal, in-app <Navigate>.
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/store/:slug" element={<Storefront />} />
      <Route path="/store/:slug/cart" element={<CartPage />} />
      <Route path="/store/:slug/products/:productId" element={<ProductDetail />} />
      <Route path="/store/:slug/collections/:categoryId" element={<CategoryPage />} />
      <Route path="/store/:slug/search" element={<SearchPage />} />
      <Route path="/store/:slug/blog/:handle" element={<ArticleDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated admin routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/theme-editor" element={<ThemeEditor />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/theme-gallery" element={<ThemeGallery />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/discounts" element={<Discounts />} />
          <Route path="/growth" element={<Growth />} />
          <Route path="/content" element={<Content />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/assistant-ia" element={<AssistantIA />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/superadmin" element={<Superadmin />} />
          <Route path="/store-preview" element={<StorePreview />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/seo-ia" element={<SeoIa />} />
          <Route path="/team" element={<Navigate to="/settings" replace />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/shipping-settings" element={<ShippingSettings />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/staff-management" element={<StaffManagement />} />
          <Route path="/store-settings" element={<StoreSettings />} />
          <Route path="/support" element={<Support />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/product-analytics" element={<ProductAnalytics />} />
          <Route path="/media-library" element={<MediaLibrary />} />
          <Route path="/abandoned-checkouts" element={<AbandonedCheckouts />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App