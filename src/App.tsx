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
import GenericPage from './pages/GenericPage';
import AboutPage from './pages/AboutPage';
import StorefrontPage from './pages/StorefrontPage';

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
import AdminGeneric from './pages/admin/AdminGeneric';

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
        {/* Public storefront — temporary platform domain (/s/:slug) or the
            current merchant's own storefront preview (/store). */}
        <Route path="/s/:slug" element={<StorefrontPage />} />
        <Route path="/store" element={<StorefrontPage />} />
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
        <Route path="/features" element={<GenericPage title="Fonctionnalités" subtitle="Tout ce dont vous avez besoin pour vendre dans le monde entier." />} />
        <Route path="/academy" element={<GenericPage title="Académie vendeur" subtitle="Parcours structurés pour réussir en e-commerce." />} />
        <Route path="/blog" element={<GenericPage title="Blog" subtitle="Tendances e-commerce, success stories, conseils marketing." />} />
        <Route path="/help" element={<SupportPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<GenericPage title="Contact" subtitle="Une question ? Écrivez-nous." />} />
        <Route path="/legal/terms" element={<GenericPage title="Conditions d'utilisation" subtitle="CGU Sellia." />} />
        <Route path="/legal/privacy" element={<GenericPage title="Politique de confidentialité" subtitle="Vos données sont protégées." />} />
        <Route path="/legal/legal" element={<GenericPage title="Mentions légales" subtitle="Sellia — LiAfrik." />} />

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
          <Route path="users" element={<AdminGeneric title="Utilisateurs" subtitle="Tous les utilisateurs de la plateforme." />} />
          <Route path="billing" element={<AdminGeneric title="Facturation SaaS" subtitle="Revenus abonnements, MRR, churn, LTV." />} />
          <Route path="content" element={<AdminGeneric title="CMS Plateforme" subtitle="Contenu institutionnel, blog, académie, pages légales." />} />
          <Route path="moderation" element={<AdminGeneric title="Modération" subtitle="Suspension, validation, produits interdits, litiges." />} />
          <Route path="analytics" element={<AdminGeneric title="Statistiques globales" subtitle="Rapports avancés et exportables." />} />
          <Route path="audit" element={<AdminGeneric title="Audit & Logs" subtitle="Traçabilité complète, impersonations, sécurité." />} />
          <Route path="settings" element={<AdminGeneric title="Configuration" subtitle="Intégrations globales, paiements par pays." />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
