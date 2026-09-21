import { useI18n } from '@/lib/i18n';

const PSPS = [
  { name: 'Paystack', color: '#011B3F', text: '#00C3F7', region: 'Afrique' },
  { name: 'Flutterwave', color: '#F26B1D', text: '#FFFFFF', region: 'Afrique' },
  { name: 'M-Pesa', color: '#41B549', text: '#FFFFFF', region: 'Afrique' },
  { name: 'MTN MoMo', color: '#FFCC00', text: '#000000', region: 'Afrique' },
  { name: 'Airtel Money', color: '#E4002B', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Orange Money', color: '#FF7900', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Wave', color: '#1DC8FF', text: '#FFFFFF', region: 'Afrique' },
  { name: 'PesaPal', color: '#00A551', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Yoco', color: '#212736', text: '#28C845', region: 'Afrique' },
  { name: 'PayFast', color: '#202731', text: '#6CC24A', region: 'Afrique' },
  { name: 'Cellulant', color: '#E11937', text: '#FFFFFF', region: 'Afrique' },
  { name: 'AZipay', color: '#0094D9', text: '#FFFFFF', region: 'Afrique' },
  { name: 'HippoPay', color: '#6C2BD9', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Touch Pay', color: '#1B4965', text: '#62B6CB', region: 'Afrique' },
  { name: 'Geldtech Pay', color: '#0D7377', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Stripe', color: '#635BFF', text: '#FFFFFF', region: 'Europe/USA' },
  { name: 'Adyen', color: '#0ABF53', text: '#FFFFFF', region: 'Europe' },
  { name: 'Klarna', color: '#FFA8CD', text: '#17120F', region: 'Europe' },
  { name: 'Alipay', color: '#1677FF', text: '#FFFFFF', region: 'Asie' },
  { name: 'WeChat Pay', color: '#07C160', text: '#FFFFFF', region: 'Asie' },
  { name: 'GrabPay', color: '#00B14F', text: '#FFFFFF', region: 'Asie' },
  { name: 'Razorpay', color: '#5B21B6', text: '#FFFFFF', region: 'Asie' },
  { name: 'PayPal', color: '#003087', text: '#FFFFFF', region: 'USA' },
  { name: 'Square', color: '#3E4348', text: '#FFFFFF', region: 'USA' },
  { name: 'Braintree', color: '#1A1F71', text: '#FFFFFF', region: 'USA' },
  { name: 'Mercado Pago', color: '#00B1EA', text: '#FFFFFF', region: 'Latino' },
  { name: 'PagSeguro', color: '#FF5C00', text: '#FFFFFF', region: 'Latino' },
  { name: 'EBANX', color: '#0D1B2A', text: '#00D9A3', region: 'Latino' },
];

export default function LandingPSPs() {
  const { t } = useI18n();
  const regions = t('psps.regions') || {};
  const list = [...PSPS, ...PSPS];
  return (
    <section className="py-12 bg-white border-y border-[#E1E1E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-6">
        <p className="text-sm font-bold text-[#202223] uppercase tracking-wide">{t('psps.title')}</p>
        <p className="text-xs text-[#6D7175] mt-1">{t('psps.subtitle')}</p>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-3 w-max animate-scroll-x">
          {list.map((p, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0 px-5 py-3 rounded-xl border border-[#E1E1E1] bg-white shadow-sm min-w-[160px]">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: p.color, color: p.text }}>{p.name.charAt(0)}</div>
              <div><p className="text-sm font-bold text-[#202223] leading-tight">{p.name}</p><p className="text-[10px] text-[#6D7175]">{regions[p.region] || p.region}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}