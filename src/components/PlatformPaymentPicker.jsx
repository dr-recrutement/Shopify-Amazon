import { useState, useEffect, useRef } from 'react';
import { Loader2, X, CreditCard, ArrowLeft } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { loadScript } from '@/pages/Storefront';

// Supabase-js's own error object doesn't carry the real message our
// functions return in their JSON body - this reads it the same way
// Domains.jsx already does, so every failure here shows what actually
// went wrong instead of a generic "non-2xx status code".
async function functionErrorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through to the generic message below */ }
  return error.message || 'Erreur inconnue';
}

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
  const [stripeView, setStripeView] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeSubmitting, setStripeSubmitting] = useState(false);
  const cardElRef = useRef(null);
  const stripeRef = useRef(null);
  const cardRef = useRef(null);
  const clientSecretRef = useRef(null);
  const paymentIntentIdRef = useRef(null);

  useEffect(() => {
    supabase.functions.invoke('platform-billing', { body: { action: 'availability' } })
      .then(({ data }) => setAvailable(data?.available || {}))
      .catch(() => setAvailable({}));
  }, []);

  const verifyThenSucceed = async (provider, ref) => {
    const { data, error: vErr } = await supabase.functions.invoke('platform-billing', { body: { action: 'verify', provider, reference: ref, payment_intent_id: paymentIntentIdRef.current } });
    if (vErr) { setError(await functionErrorMessage(vErr)); setBusyProvider(null); setStripeSubmitting(false); return; }
    if (!data?.paid) { setError('Paiement non confirmé. Réessayez ou choisissez un autre moyen de paiement.'); setBusyProvider(null); setStripeSubmitting(false); return; }
    onSuccess({ provider, reference: ref });
  };

  // Stripe Elements needs a real mounted card field, not a one-call popup
  // like the others - this opens a dedicated inline step within the same
  // picker instead of a separate page, so it's still a real embedded
  // payment, just Stripe's specific shape of "no redirect".
  const openStripe = async () => {
    setError(''); setBusyProvider('stripe'); setStripeView(true);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke('platform-billing', { body: { action: 'create_intent', provider: 'stripe', amount, currency, reference, purpose } });
      if (invokeErr) throw new Error(await functionErrorMessage(invokeErr));
      if (!data || data.error) throw new Error(data?.error || 'Réponse invalide du serveur');
      clientSecretRef.current = data.client_secret;
      paymentIntentIdRef.current = data.payment_intent_id;
      await loadScript('https://js.stripe.com/v3/');
      stripeRef.current = window.Stripe(data.publishable_key);
      const elements = stripeRef.current.elements();
      cardRef.current = elements.create('card');
      cardRef.current.mount(cardElRef.current);
      setStripeReady(true);
    } catch (e) {
      setError(e.message || "Échec de l'initialisation de Stripe");
      setStripeView(false);
    } finally { setBusyProvider(null); }
  };

  const submitStripe = async () => {
    setStripeSubmitting(true); setError('');
    try {
      const { error: confirmError, paymentIntent } = await stripeRef.current.confirmCardPayment(clientSecretRef.current, {
        payment_method: { card: cardRef.current, billing_details: { name, email } },
      });
      if (confirmError) throw new Error(confirmError.message);
      if (paymentIntent.status !== 'succeeded') throw new Error('Paiement non confirmé.');
      await verifyThenSucceed('stripe', paymentIntent.id);
    } catch (e) {
      setError(e.message || 'Échec du paiement');
      setStripeSubmitting(false);
    }
  };

  const pay = async (provider) => {
    if (provider === 'stripe') { openStripe(); return; }
    setError(''); setBusyProvider(provider);
    try {
      if (provider === 'flutterwave') {
        const { data, error: invokeErr } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, email, name } });
        if (invokeErr) throw new Error(await functionErrorMessage(invokeErr));
        if (!data || data.error) throw new Error(data?.error || 'Réponse invalide du serveur');
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
        const { data, error: invokeErr } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, email, name } });
        if (invokeErr) throw new Error(await functionErrorMessage(invokeErr));
        if (!data || data.error) throw new Error(data?.error || 'Réponse invalide du serveur');
        await loadScript('https://js.paystack.co/v1/inline.js');
        window.PaystackPop.setup({
          key: data.public_key, email: data.email || email, amount: data.amount, currency: data.currency, ref: data.reference,
          callback: () => verifyThenSucceed('paystack', data.reference),
          onClose: () => setBusyProvider(null),
        }).openIframe();
        return;
      }
      if (provider === 'korapay') {
        const { data, error: invokeErr } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, email, name } });
        if (invokeErr) throw new Error(await functionErrorMessage(invokeErr));
        if (!data || data.error) throw new Error(data?.error || 'Réponse invalide du serveur');
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
        const { data, error: invokeErr } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, plan, purpose } });
        if (invokeErr) throw new Error(await functionErrorMessage(invokeErr));
        if (!data || data.error) throw new Error(data?.error || 'Réponse invalide du serveur');
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
        const { data, error: invokeErr } = await supabase.functions.invoke('platform-billing', { body: { action: 'initiate', provider, amount, currency, reference, email, name, tenant_id: tenantId } });
        if (invokeErr) throw new Error(await functionErrorMessage(invokeErr));
        if (!data || data.error) throw new Error(data?.error || 'Réponse invalide du serveur');
        // Payunit's own hosted checkout page - the one exception to "no
        // redirect" in this picker, because that's how Payunit's flow is
        // built (confirmed live against their real API earlier), not a
        // shortcut taken here.
        sessionStorage.setItem('sellia_platform_payment_pending', JSON.stringify({ provider: 'payunit', reference: data.transaction_id }));
        window.location.href = data.transaction_url;
        return;
      }
    } catch (e) {
      setError(e.message || "Échec de l'initialisation du paiement");
      setBusyProvider(null);
    }
  };

  const options = available ? Object.entries(available).filter(([, ok]) => ok) : null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={stripeSubmitting ? undefined : onCancel}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-[#202223] flex items-center gap-2">
            {stripeView && <button onClick={() => { setStripeView(false); setStripeReady(false); setError(''); }} className="text-[#6D7175] hover:text-[#202223]"><ArrowLeft className="w-4 h-4" /></button>}
            <CreditCard className="w-4 h-4 text-[#008060]" /> {stripeView ? 'Carte bancaire' : 'Choisir un moyen de paiement'}
          </p>
          {!stripeSubmitting && <button onClick={onCancel} className="text-[#6D7175] hover:text-[#202223]"><X className="w-4 h-4" /></button>}
        </div>

        {stripeView ? (
          <div>
            <div ref={cardElRef} className="px-3 py-3 border border-[#E1E1E1] rounded-lg mb-3 bg-white" />
            {!stripeReady && <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#008060]" /></div>}
            <button onClick={submitStripe} disabled={!stripeReady || stripeSubmitting} className="w-full bg-[#008060] text-white text-sm font-semibold py-2.5 rounded-full hover:bg-[#00694d] disabled:opacity-40 flex items-center justify-center gap-2">
              {stripeSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {stripeSubmitting ? 'Traitement…' : `Payer ${amount} ${currency}`}
            </button>
          </div>
        ) : options === null ? (
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
