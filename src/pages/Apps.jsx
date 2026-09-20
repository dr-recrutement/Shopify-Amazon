import { Link } from 'react-router-dom';
import {
  LayoutGrid, Loader2, AlertCircle, Plus, CreditCard, Truck, Megaphone, Plug,
} from 'lucide-react';
import { useCurrentStore } from '@/hooks/useCurrentStore';

const LOGO_BASE = 'https://media.base44.com/images/public/6aaf8e00382d12ca2edaacca';

// All logos are on black backgrounds — rendered with mix-blend-mode: screen
// on a dark container to make the black background transparent.
const INTEGRATIONS = [
  // Payments — Africa (real logos)
  { id: 'paystack', name: 'Paystack', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/de5fcd15b_paystack-logo-vector.png`, desc: 'Cartes & Mobile Money (NG, GH, ZA, KE)', type: 'payment' },
  { id: 'flutterwave', name: 'Flutterwave', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/e26c19886_Flutterwave-Logo1.png`, desc: 'Paiements panafricains multi-devises', type: 'payment' },
  { id: 'mpesa', name: 'M-Pesa', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/795fb39dd_unnamed.png`, desc: 'Mobile Money Kenya & Tanzanie', type: 'payment' },
  { id: 'payunit', name: 'Payunit', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/cceaad03f_payunit-logo.png`, desc: 'Agrégateur Mobile Money Cameroun & CEMAC', type: 'payment' },
  { id: 'payfast', name: 'Payfast', category: 'Paiements', region: 'Afrique du Sud', logo: `${LOGO_BASE}/681ccb17d_White-on-Blue-2-1-1-1-1080x499.png`, desc: 'Paiements cartes & EFT (ZA)', type: 'payment' },
  { id: 'mtn-momo', name: 'MTN MoMo', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/fbc0010c3_1648544928638.png`, desc: 'Mobile Money MTN (UG, GH, CI, CM…)', type: 'payment' },
  { id: 'orange-money', name: 'Orange Money', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/85a953228_OIP.png`, desc: 'Mobile Money CI, Sénégal, Mali', type: 'payment' },
  { id: 'wave', name: 'Wave', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/230cdac94_logo_wave_circle_818.png`, desc: 'Mobile Money Sénégal & Côte d\u2019Ivoire', type: 'payment' },
  { id: 'kkiapay', name: 'Kkiapay', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/58a62a75f_1200x630wa.png`, desc: 'Mobile Money & cartes Afrique de l\u2019Ouest', type: 'payment' },
  { id: 'chapa', name: 'Chapa', category: 'Paiements', region: 'Afrique', logo: `${LOGO_BASE}/f25f8db81_Logo-Chapa-.png`, desc: 'Paiements Éthiopie — cartes & mobile', type: 'payment' },

  // Payments — Global (real logos)
  { id: 'stripe', name: 'Stripe', category: 'Paiements', region: 'Mondial', logo: `${LOGO_BASE}/d56771535_1685814539stripe-icon-png.png`, desc: 'Cartes & wallets — 46 pays', type: 'payment' },
  { id: 'paypal', name: 'PayPal', category: 'Paiements', region: 'Mondial', color: '#003087', accent: '#FFFFFF', desc: 'PayPal, cartes, Pay Later', type: 'payment' },
  { id: 'paddle', name: 'Paddle', category: 'Paiements', region: 'Mondial', color: '#9CE37D', accent: '#1A2B3C', desc: 'Merchant of Record — taxes incluses', type: 'payment' },
  { id: 'adyen', name: 'Adyen', category: 'Paiements', region: 'Europe', color: '#0ABF53', accent: '#FFFFFF', desc: 'Paiements unifiés enterprise', type: 'payment' },
  { id: 'klarna', name: 'Klarna', category: 'Paiements', region: 'Europe', color: '#FFA8CD', accent: '#17120F', desc: 'Achetez maintenant, payez plus tard', type: 'payment' },
  { id: 'alipay', name: 'Alipay', category: 'Paiements', region: 'Asie', color: '#1677FF', accent: '#FFFFFF', desc: 'Paiements Chine', type: 'payment' },
  { id: 'razorpay', name: 'Razorpay', category: 'Paiements', region: 'Asie', color: '#5B21B6', accent: '#FFFFFF', desc: 'Paiements Inde', type: 'payment' },
  { id: 'square', name: 'Square', category: 'Paiements', region: 'USA', color: '#3E4348', accent: '#FFFFFF', desc: 'Cartes & en boutique', type: 'payment' },
  { id: 'mercado-pago', name: 'Mercado Pago', category: 'Paiements', region: 'Latino', color: '#00B1EA', accent: '#FFFFFF', desc: 'Paiements Amérique Latine', type: 'payment' },

  // Shipping (real logos where available)
  { id: 'aramex', name: 'Aramex', category: 'Livraison', region: 'Moyen-Orient', logo: `${LOGO_BASE}/c6bba6fdc_ARMXAE_BIG-ade0e246.png`, desc: 'Livraison Moyen-Orient & Asie', type: 'shipping' },
  { id: 'dhl', name: 'DHL Express', category: 'Livraison', region: 'Mondial', color: '#FFCC00', accent: '#D40511', desc: 'Livraison express mondiale', type: 'shipping' },
  { id: 'fedex', name: 'FedEx', category: 'Livraison', region: 'Mondial', color: '#4D148C', accent: '#FF6600', desc: 'Livraison express & freight', type: 'shipping' },
  { id: 'ups', name: 'UPS', category: 'Livraison', region: 'Mondial', color: '#351C15', accent: '#FFB500', desc: 'Livraison mondiale', type: 'shipping' },

  // Marketing & apps (real logos where available)
  { id: 'assistant-ia', name: 'Assistant IA', category: 'IA', region: '', color: '#008060', accent: '#FFFFFF', desc: 'Générez descriptions, SEO et campagnes', installed: true, to: '/assistant-ia', type: 'app' },
  { id: 'marketing', name: 'Marketing', category: 'Marketing', region: '', color: '#0EA5E9', accent: '#FFFFFF', desc: 'Campagnes e-mail et récupération de paniers', installed: true, to: '/marketing', type: 'app' },
  { id: 'automations', name: 'Automatisations', category: 'Productivité', region: '', color: '#8B5CF6', accent: '#FFFFFF', desc: 'Automatisez e-mails et notifications', installed: true, to: '/automations', type: 'app' },
  { id: 'analytics', name: 'Analytics', category: 'Analyse', region: '', color: '#3B82F6', accent: '#FFFFFF', desc: 'Statistiques de vente en temps réel', installed: true, to: '/analytics', type: 'app' },
  { id: 'markets', name: 'Marchés', category: 'Canaux', region: '', color: '#10B981', accent: '#FFFFFF', desc: 'Vendez sur Instagram, Facebook, WhatsApp', installed: true, to: '/markets', type: 'app' },
  { id: 'meta-ads', name: 'Meta Ads', category: 'Publicité', region: 'Mondial', logo: `${LOGO_BASE}/a27eebef6_meta_PNG5.png`, desc: 'Publicités Facebook & Instagram', type: 'marketing' },
  { id: 'google-ads', name: 'Google Ads', category: 'Publicité', region: 'Mondial', logo: `${LOGO_BASE}/92f87bd5b_google-ads-icon-logo-symbol-free-png.webp`, desc: 'Publicités Google Shopping & Search', type: 'marketing' },
  { id: 'klaviyo', name: 'Klaviyo', category: 'E-mail', region: 'Mondial', color: '#000000', accent: '#FF6900', desc: 'E-mail & SMS marketing', type: 'marketing' },
  { id: 'mailchimp', name: 'Mailchimp', category: 'E-mail', region: 'Mondial', logo: `${LOGO_BASE}/49772f9ca_images11.png`, desc: 'E-mail marketing & automations', type: 'marketing' },
  { id: 'tiktok-ads', name: 'TikTok Ads', category: 'Publicité', region: 'Mondial', color: '#000000', accent: '#FF0050', desc: 'Publicités TikTok Shop', type: 'marketing' },
];

function LogoBadge({ app }) {
  if (app.logo) {
    return (
      <div className="w-14 h-14 rounded-xl bg-[#0F0F1A] flex items-center justify-center shrink-0 overflow-hidden">
        <img src={app.logo} alt={app.name} className="w-full h-full object-contain p-1.5" style={{ mixBlendMode: 'screen' }} />
      </div>
    );
  }
  return (
    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg" style={{ background: app.color, color: app.accent }}>
      {app.name.charAt(0)}
    </div>
  );
}

export default function Apps() {
  const { store, loading: storeLoading } = useCurrentStore();

  if (storeLoading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-[#008060]" /></div>;
  if (!store) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <AlertCircle className="w-10 h-10 text-[#008060] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#202223]">Configurez votre boutique</h1>
        <Link to="/store-setup" className="inline-flex items-center gap-1.5 bg-[#008060] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#00694d] mt-3">Configurer</Link>
      </div>
    );
  }

  const installed = INTEGRATIONS.filter((a) => a.installed);
  const available = INTEGRATIONS.filter((a) => !a.installed);
  const categories = [...new Set(available.map((a) => a.category))];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <LayoutGrid className="w-5 h-5 text-[#6D7175]" />
        <div>
          <h1 className="text-xl font-bold text-[#202223]">Apps & Intégrations</h1>
          <p className="text-xs text-[#6D7175]">{installed.length} installée(s) · {available.length} disponible(s) · 25+ PSP mondiaux</p>
        </div>
      </div>

      <h2 className="text-sm font-bold text-[#202223] mb-3">Apps installées</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {installed.map((app) => (
          <Link key={app.id} to={app.to} className="bg-white rounded-xl border border-[#E1E1E1] p-5 hover:shadow-sm hover:border-[#008060]/30 transition group block">
            <div className="flex items-start gap-3 mb-3">
              <LogoBadge app={app} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#202223]">{app.name}</h3>
                  <span className="text-[10px] font-semibold text-[#008060] bg-[#008060]/10 px-2 py-0.5 rounded-full">Installé</span>
                </div>
                <p className="text-[10px] text-[#6D7175] font-medium uppercase tracking-wide mt-0.5">{app.category}</p>
              </div>
            </div>
            <p className="text-xs text-[#6D7175] leading-relaxed">{app.desc}</p>
            <span className="mt-3 text-xs font-semibold text-[#008060] inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">Ouvrir →</span>
          </Link>
        ))}
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <h2 className="text-sm font-bold text-[#202223] mb-3">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.filter((a) => a.category === cat).map((app) => (
              <div key={app.id} className="bg-white rounded-xl border border-[#E1E1E1] p-5 hover:shadow-sm hover:border-[#008060]/30 transition">
                <div className="flex items-start gap-3 mb-3">
                  <LogoBadge app={app} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#202223]">{app.name}</h3>
                    <p className="text-[10px] text-[#6D7175] font-medium uppercase tracking-wide mt-0.5">{app.region || 'Intégration'}</p>
                  </div>
                </div>
                <p className="text-xs text-[#6D7175] leading-relaxed mb-3">{app.desc}</p>
                <button className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#008060] px-3 py-2 rounded-full hover:bg-[#00694d]">
                  <Plus className="w-3.5 h-3.5" /> Connecter
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}