import { useState, useEffect } from 'react';
import { Loader2, X, CreditCard } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { loadScript } from '@/pages/Storefront';

const PROVIDER_META = {
  stripe: { label: 'Carte bancaire (Stripe)', logo: 'stripe.png' },
  flutterwave: { label: 'Flutterwave', logo: 'flutterwave.png' },
  paystack: { label: 'Paystack', logo: 'paystack.png' },
  payunit: { label: 'Payunit (Mobile Money)', logo: 'payunit.png' },
  korapay: { label: 'Korapay', logo: null },
  paddle: { label: 'Paddle', logo: null },
};

// Real multi-PSP picker popup: shows only providers Sellia has actually
// configured (platform-billing's 'availability' action), no redirect for
// any of them - each provider's own inline/overlay widget runs on the
// client. Reused for both domain purchases and subscription billing so
// there's exactly one implementation of "let the customer pick a PSP",
// not one per feature.
export default function PlatformPaymentPicker({ amount, currency = 'USD', purpose, reference, email, name, tenantId, plan, onSuccess, onCancel }) {
  const [available, setAvailable] = useState(null);
  const [busyProvider, setBusyProvider] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.functions.invoke('platform-billing', { body: { action: 'availability' } })
      .then(({ data }) => setAvailable(data?.available || {}))
      .catch(() => setAvailable({}));
  }, []);

  const verifyThenSucceed = async (provider, ref) => {
    const { data, error: vErr } = await supabase.functions.invoke('platform-billing', { body: { action: 'verify', provider, reference: ref } });
    if (vErr || !data?.paid) { setError('Paiement non confirmé. Réessayez ou choisissez un autre moyen de paiement.'); setBusyProvider(null); return; }
    onSuccess({ provider, reference: ref });
  };

  const pay = async (provider) => {
    setError(''); setBusyProvider(provider);
    try {
      if (provider === 'flutterwave') {
        const { data } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, email, name } });
        if (data?.error) throw new Error(data.error);
        await loadScript('https://checkout.flutterwave.com/v3.js');
        window.FlutterwaveCheckout({
          public_key: data.public_key, tx_ref: data.tx_ref, amount: data.amount, currency: data.currency,
          customer: data.customer, payment_options: 'card, mobilemoney, ussd',
          callback: () => verifyThenSucceed('flutterwave', data.tx_ref),
          onclose: () => setBusyProvider(null),
        });
        return;
      }
      if (provider === 'paystack') {
        const { data } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, email, name } });
        if (data?.error) throw new Error(data.error);
        await loadScript('https://js.paystack.co/v1/inline.js');
        window.PaystackPop.setup({
          key: data.public_key, email: data.email || email, amount: data.amount, currency: data.currency, ref: data.reference,
          callback: () => verifyThenSucceed('paystack', data.reference),
          onClose: () => setBusyProvider(null),
        }).openIframe();
        return;
      }
      if (provider === 'korapay') {
        const { data } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, email, name } });
        if (data?.error) throw new Error(data.error);
        await loadScript('https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js');
        window.Korapay.initialize({
          key: data.public_key, reference: data.reference, amount: data.amount, currency: data.currency,
          customer: data.customer, notification_url: data.notification_url,
          onClose: () => setBusyProvider(null),
          onSuccess: () => verifyThenSucceed('korapay', data.reference),
        });
        return;
      }
      if (provider === 'paddle') {
        const { data } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, plan, purpose } });
        if (data?.error) throw new Error(data.error);
        await loadScript('https://cdn.paddle.com/paddle/v2/paddle.js');
        window.Paddle.Environment.set('production');
        window.Paddle.Initialize({
          token: data.client_token,
          eventCallback: (e) => {
            if (e.name === 'checkout.completed') verifyThenSucceed('paddle', reference);
            if (e.name === 'checkout.closed') setBusyProvider(null);
          },
        });
        window.Paddle.Checkout.open({ items: [{ priceId: data.price_id, quantity: 1 }], customer: { email } });
        return;
      }
      if (provider === 'payunit') {
        const { data } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, email, name, tenant_id: tenantId } });
        if (data?.error) throw new Error(data.error);
        // Payunit's own hosted checkout page - the one exception to "no
        // redirect" in this picker, because that's how Payunit's flow is
        // built (confirmed live against their real API earlier), not a
        // shortcut taken here.
        sessionStorage.setItem('sellia_platform_payment_pending', JSON.stringify({ provider: 'payunit', reference: data.transaction_id }));
        window.location.href = data.transaction_url;
        return;
      }
      if (provider === 'stripe') {
        setError("Le paiement par carte (Stripe) nécessite une étape supplémentaire non encore branchée ici. Choisissez un autre moyen de paiement pour l'instant.");
        setBusyProvider(null);
      }
    } catch (e) {
      setError(e.message || "Échec de l'initialisation du paiement");
      setBusyProvider(null);
    }
  };

  const options = available ? Object.entries(available).filter(([, ok]) => ok) : null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-[#202223] flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#008060]" /> Choisir un moyen de paiement</p>
          <button onClick={onCancel} className="text-[#6D7175] hover:text-[#202223]"><X className="w-4 h-4" /></button>
        </div>

        {options === null ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div>
        ) : options.length === 0 ? (
          <p className="text-sm text-[#6D7175] py-4">Aucun moyen de paiement n'est configuré pour l'instant. Contactez le support.</p>
        ) : (
          <div className="space-y-2">
            {options.map(([provider]) => {
              const meta = PROVIDER_META[provider] || { label: provider, logo: null };
              return (
                <button
                  key={provider}
                  onClick={() => pay(provider)}
                  disabled={!!busyProvider}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E1E1E1] hover:border-[#008060]/40 hover:bg-[#008060]/5 disabled:opacity-50 transition"
                >
                  {meta.logo && <div className="w-9 h-9 rounded-lg bg-white border border-[#E1E1E1] flex items-center justify-center shrink-0 overflow-hidden"><img src={`/payment-logos/${meta.logo}`} alt="" className="w-full h-full object-contain p-1" /></div>}
                  <span className="text-sm font-semibold text-[#202223] flex-1 text-left">{meta.label}</span>
                  {busyProvider === provider && <Loader2 className="w-4 h-4 animate-spin text-[#008060]" />}
                </button>
              );
            })}
          </div>
        )}
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  );
}
