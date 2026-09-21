// Real brand logos live in /public/payment-logos (served as static assets).
// Every entry with a `logo` renders that image at a uniform box size; the
// rest (no real asset available yet) fall back to the colored-initial tile
// so the row never breaks, but they're the minority now.
const PSPS = [
  { name: 'Paystack', logo: '/payment-logos/paystack.png', color: '#011B3F', text: '#00C3F7', region: 'Afrique' },
  { name: 'Flutterwave', logo: '/payment-logos/flutterwave.png', color: '#F26B1D', text: '#FFFFFF', region: 'Afrique' },
  { name: 'M-Pesa', logo: '/payment-logos/mpesa.png', color: '#41B549', text: '#FFFFFF', region: 'Afrique' },
  { name: 'MTN MoMo', logo: '/payment-logos/mtn-momo.png', color: '#FFCC00', text: '#000000', region: 'Afrique' },
  { name: 'Airtel Money', color: '#E4002B', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Orange Money', logo: '/payment-logos/orange-money.png', color: '#FF7900', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Wave', logo: '/payment-logos/wave.png', color: '#1DC8FF', text: '#FFFFFF', region: 'Afrique' },
  { name: 'PesaPal', logo: '/payment-logos/pesapal.png', color: '#00A551', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Yoco', color: '#212736', text: '#28C845', region: 'Afrique' },
  { name: 'PayFast', logo: '/payment-logos/payfast.png', color: '#202731', text: '#6CC24A', region: 'Afrique' },
  { name: 'Cellulant', logo: '/payment-logos/cellulant.png', color: '#E11937', text: '#FFFFFF', region: 'Afrique' },
  { name: 'AZipay', color: '#0094D9', text: '#FFFFFF', region: 'Afrique' },
  { name: 'HippoPay', color: '#6C2BD9', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Touch Pay', logo: '/payment-logos/touchpay.png', color: '#1B4965', text: '#62B6CB', region: 'Afrique' },
  { name: 'Kkiapay', logo: '/payment-logos/kkiapay.png', color: '#0F1E45', text: '#FFFFFF', region: 'Afrique' },
  { name: 'PayUnit', logo: '/payment-logos/payunit.png', color: '#0F9C93', text: '#FFFFFF', region: 'Afrique' },
  { name: 'Stripe', logo: '/payment-logos/stripe.png', color: '#635BFF', text: '#FFFFFF', region: 'Europe/USA' },
  { name: 'Adyen', logo: '/payment-logos/adyen.png', color: '#0ABF53', text: '#FFFFFF', region: 'Europe' },
  { name: 'Klarna', color: '#FFA8CD', text: '#17120F', region: 'Europe' },
  { name: 'Alipay', logo: '/payment-logos/alipay.png', color: '#1677FF', text: '#FFFFFF', region: 'Asie' },
  { name: 'WeChat Pay', color: '#07C160', text: '#FFFFFF', region: 'Asie' },
  { name: 'GrabPay', logo: '/payment-logos/grabpay.webp', color: '#00B14F', text: '#FFFFFF', region: 'Asie' },
  { name: 'Razorpay', color: '#5B21B6', text: '#FFFFFF', region: 'Asie' },
  { name: 'PayPal', logo: '/payment-logos/paypal.png', color: '#003087', text: '#FFFFFF', region: 'USA' },
  { name: 'Square', color: '#3E4348', text: '#FFFFFF', region: 'USA' },
  { name: 'Braintree', color: '#1A1F71', text: '#FFFFFF', region: 'USA' },
  { name: 'Mercado Pago', logo: '/payment-logos/mercadopago.png', color: '#00B1EA', text: '#FFFFFF', region: 'Latino' },
  { name: 'PagSeguro', logo: '/payment-logos/pagseguro.png', color: '#FF5C00', text: '#FFFFFF', region: 'Latino' },
  { name: 'EBANX', color: '#0D1B2A', text: '#00D9A3', region: 'Latino' },
];

function PspTile({ p }) {
  return (
    <div className="flex items-center gap-3 shrink-0 px-5 py-3 rounded-xl border border-[#E1E1E1] bg-white shadow-sm min-w-[180px] h-[72px]">
      <div className="w-12 h-9 shrink-0 flex items-center justify-center">
        {p.logo ? (
          <img src={p.logo} alt={p.name} className="max-w-full max-h-full object-contain" loading="lazy" />
        ) : (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: p.color, color: p.text }}>{p.name.charAt(0)}</div>
        )}
      </div>
      <div className="min-w-0"><p className="text-sm font-bold text-[#202223] leading-tight truncate">{p.name}</p><p className="text-[10px] text-[#6D7175]">{p.region}</p></div>
    </div>
  );
}

export default function LandingPSPs() {
  const list = [...PSPS, ...PSPS];
  return (
    <section className="py-12 bg-white border-y border-[#E1E1E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-6">
        <p className="text-sm font-bold text-[#202223] uppercase tracking-wide">{PSPS.length}+ prestataires de paiement mondiaux</p>
        <p className="text-xs text-[#6D7175] mt-1">Acceptez les paiements partout dans le monde — sans redirection</p>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-3 w-max animate-scroll-x">
          {list.map((p, i) => <PspTile key={i} p={p} />)}
        </div>
      </div>
    </section>
  );
}
