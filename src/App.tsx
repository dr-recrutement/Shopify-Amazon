import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/hooks';
import { isSuperAdminEmail } from './lib/auth';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import MarketplacePage from './pages/MarketplacePage';
import PricingPage from './pages/PricingPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import SupportPage from './pages/SupportPage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import AcademyPage from './pages/AcademyPage';
import BlogPage from './pages/BlogPage';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';
import LegalTermsPage from './pages/LegalTermsPage';
import LegalPrivacyPage from './pages/LegalPrivacyPage';
import LegalNoticePage from './pages/LegalNoticePage';

import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/Home';
import Orders from './pages/dashboard/Orders';
import Products from './pages/dashboard/Products';
import Customers from './pages/dashboard/Customers';
import Growth from './pages/dashboard/Growth';
import Discounts from './pages/dashboard/Discounts';
import Content from './pages/dashboard/Content';
import Markets from './pages/dashboard/Markets';
import Analytics from './pages/dashboard/Analytics';
import Agentic from './pages/dashboard/Agentic';
import OnlineStore from './pages/dashboard/OnlineStore';
import Marketing from './pages/dashboard/Marketing';
import Accounting from './pages/dashboard/Accounting';
import Team from './pages/dashboard/Team';
import Chat from './pages/dashboard/Chat';
import Reports from './pages/dashboard/Reports';
import Automations from './pages/dashboard/Automations';
import Settings from './pages/dashboard/Settings';

import AdminLayout from './pages/admin/AdminLayout';
import AdminHome from './pages/admin/AdminHome';
import AdminStores from './pages/admin/AdminStores';
import AdminThemes from './pages/admin/AdminThemes';
import AdminSuperAdmins from './pages/admin/AdminSuperAdmins';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBilling from './pages/admin/AdminBilling';
import AdminContent from './pages/admin/AdminContent';
import AdminModeration from './pages/admin/AdminModeration';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminAudit from './pages/admin/AdminAudit';
import AdminSettings from './pages/admin/AdminSettings';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Chargement...</div></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && session.user?.email && !isSuperAdminEmail(session.user.email)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-tracking" element={<OrderTrackingPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* Public content pages */}
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/academy" element={<AcademyPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/legal/terms" element={<LegalTermsPage />} />
        <Route path="/legal/privacy" element={<LegalPrivacyPage />} />
        <Route path="/legal/legal" element={<LegalNoticePage />} />

        {/* Vendor dashboard */}
        <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="customers" element={<Customers />} />
          <Route path="growth" element={<Growth />} />
          <Route path="discounts" element={<Discounts />} />
          <Route path="content" element={<Content />} />
          <Route path="markets" element={<Markets />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="agentic" element={<Agentic />} />
          <Route path="online-store" element={<OnlineStore />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="team" element={<Team />} />
          <Route path="chat" element={<Chat />} />
          <Route path="reports" element={<Reports />} />
          <Route path="automations" element={<Automations />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Super Admin Master Console */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminHome />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="themes" element={<AdminThemes />} />
          <Route path="super-admins" element={<AdminSuperAdmins />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
