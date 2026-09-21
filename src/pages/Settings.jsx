import { useState } from 'react';
import { Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import {
  SettingsGeneral, SettingsPlan,
  SettingsCheckout, SettingsCustomerAccounts, SettingsShippingDelivery, SettingsTaxes,
  SettingsLocations, SettingsApps, SettingsSalesChannels, SettingsDomains,
  SettingsCustomerEvents, SettingsNotifications, SettingsMetafields, SettingsLanguages,
  SettingsCustomerPrivacy, SettingsPolicies,
} from '@/components/settings/SettingsSections';
import Billing from '@/pages/Billing';
import Payments from '@/pages/Payments';
import Profile from '@/pages/Profile';
import StaffManagement from '@/pages/StaffManagement';
import StoreSettings from '@/pages/StoreSettings';
import StoreSetup from '@/pages/StoreSetup';
import Support from '@/pages/Support';
import Chat from '@/pages/Chat';

const SECTIONS = [
  { group: 'Compte', items: [
    { id: 'profile', label: 'Profil', comp: Profile },
  ]},
  { group: 'Boutique', items: [
    { id: 'general', label: 'Général', comp: SettingsGeneral },
    { id: 'plan', label: 'Plan', comp: SettingsPlan },
    { id: 'billing', label: 'Facturation', comp: Billing },
    { id: 'users', label: 'Personnel & permissions', comp: StaffManagement },
    { id: 'store-config', label: 'Configuration boutique', comp: StoreSetup },
    { id: 'store-settings', label: 'Paramètres boutique', comp: StoreSettings },
    { id: 'locations', label: 'Emplacements', comp: SettingsLocations },
  ]},
  { group: 'Paiements', items: [
    { id: 'payments', label: 'Paiements', comp: Payments },
    { id: 'checkout', label: 'Commande', comp: SettingsCheckout },
    { id: 'customer_accounts', label: 'Comptes clients', comp: SettingsCustomerAccounts },
    { id: 'customer_events', label: 'Événements client', comp: SettingsCustomerEvents },
    { id: 'taxes', label: 'Taxes et droits', comp: SettingsTaxes },
  ]},
  { group: 'Boutique en ligne', items: [
    { id: 'shipping', label: 'Livraison et expédition', comp: SettingsShippingDelivery },
    { id: 'domains', label: 'Domaines', comp: SettingsDomains },
    { id: 'channels', label: 'Canaux de vente', comp: SettingsSalesChannels },
    { id: 'languages', label: 'Langues', comp: SettingsLanguages },
  ]},
  { group: 'Règles et confidentialité', items: [
    { id: 'notifications', label: 'Notifications', comp: SettingsNotifications },
    { id: 'privacy', label: 'Confidentialité client', comp: SettingsCustomerPrivacy },
    { id: 'policies', label: 'Politiques', comp: SettingsPolicies },
    { id: 'metafields', label: 'Métadonnées', comp: SettingsMetafields },
  ]},
  { group: 'Extensions & support', items: [
    { id: 'apps', label: 'Applications', comp: SettingsApps },
    { id: 'support', label: 'Support & aide', comp: Support },
    { id: 'chat', label: 'Chat clients', comp: Chat },
  ]},
];

export default function Settings() {
  const { loading } = useCurrentStore();
  const [active, setActive] = useState('general');

  const ActiveComp = (() => {
    for (const g of SECTIONS) {
      const item = g.items.find((i) => i.id === active);
      if (item) return item.comp;
    }
    return SettingsGeneral;
  })();

  const activeLabel = (() => {
    for (const g of SECTIONS) {
      const item = g.items.find((i) => i.id === active);
      if (item) return item.label;
    }
    return 'Général';
  })();

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-5 h-5 text-[#6D7175]" />
        <h1 className="text-xl font-bold text-[#202223]">Paramètres</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-[#E1E1E1] p-2 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            {SECTIONS.map((g) => (
              <div key={g.group} className="mb-1">
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-[#6D7175] uppercase tracking-wide">{g.group}</p>
                {g.items.map((item) => (
                  <button key={item.id} onClick={() => setActive(item.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${active === item.id ? 'bg-[#008060] text-white font-semibold' : 'text-[#202223] hover:bg-black/5'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ActiveComp />
        </div>
      </div>
    </div>
  );
}