import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useTenant, useIsSuperAdmin } from './lib/hooks';
import Login from './pages/dashboard/Login';
import LandingPage from './pages/LandingPage';
import HelpPage from './pages/HelpPage';
import SupportPage from './pages/SupportPage';
import Onboarding from './pages/dashboard/Onboarding';
import { supabase } from './lib/supabase';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Home from './pages/dashboard/Home';
import Orders from './pages/dashboard/Orders';
import Products from './pages/dashboard/Products';
import Customers from './pages/dashboard/Customers';
import Growth from './pages/dashboard/Growth';
import Discounts from './pages/dashboard/Discounts';
import Content from './pages/dashboard/Content';
import Markets from './pages/dashboard/Markets';
import Analytics from './pages/dashboard/Analytics';
import OnlineStore from './pages/dashboard/OnlineStore';
import Marketing from './pages/dashboard/Marketing';
import Comptabilite from './pages/dashboard/Comptabilite';
import Team from './pages/dashboard/Team';
import Reports from './pages/dashboard/Reports';
import Automations from './pages/dashboard/Automations';
import Settings from './pages/dashboard/Settings';
import Agentic from './pages/dashboard/Agentic';
import SuperAdminLayout, { SuperAdminOverview, SuperAdminTenants, SuperAdminThemes, SuperAdminUsers, SuperAdminAnalytics, SuperAdminContent, SuperAdminSettings } from './pages/admin/SuperAdmin';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const { isSuperAdmin, loading: adminLoading } = useIsSuperAdmin(user);
  const loading = authLoading || tenantLoading || adminLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Chargement…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // Check if user is super admin.
  // NOTE: le statut réel est déterminé par la table Supabase `super_admins`
  // (user_id, status='active'), pas par app_metadata — cette dernière n'était
  // jamais renseignée nulle part dans ce projet.
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    if (!isSuperAdmin) {
      // Logged in but not an admin: bounce them back to the normal app.
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <Routes>
        <Route path="/admin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminOverview />} />
          <Route path="tenants" element={<SuperAdminTenants />} />
          <Route path="themes" element={<SuperAdminThemes />} />
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="platform-analytics" element={<SuperAdminAnalytics />} />
          <Route path="content" element={<SuperAdminContent />} />
          <Route path="settings" element={<SuperAdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    );
  }

  if (!tenant) {
    return <Onboarding />;
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="customers" element={<Customers />} />
        <Route path="growth" element={<Growth />} />
        <Route path="discounts" element={<Discounts />} />
        <Route path="content" element={<Content />} />
        <Route path="markets" element={<Markets />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="online-store" element={<OnlineStore />} />
        <Route path="marketing" element={<Marketing />} />
        <Route path="comptabilite" element={<Comptabilite />} />
        <Route path="team" element={<Team />} />
        <Route path="reports" element={<Reports />} />
        <Route path="automations" element={<Automations />} />
        <Route path="settings" element={<Settings />} />
        <Route path="agentic" element={<Agentic />} />
      </Route>
      <Route path="/help" element={<HelpPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
