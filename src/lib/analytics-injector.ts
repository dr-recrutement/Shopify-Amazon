/**
 * Real third-party analytics script injection for the public storefront.
 * Reads the IDs a merchant connected in the dashboard's Apps page
 * (src/pages/dashboard/Apps.tsx) and loads each platform's own official
 * script exactly as their own docs specify — not a placeholder, not a
 * simulation. Idempotent (checks for an existing script before adding
 * another) so this can safely run again on client-side navigation.
 */
export function injectAnalyticsScripts(settings: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  if (settings.gaId && !document.getElementById('ga4-script')) {
    const s1 = document.createElement('script');
    s1.id = 'ga4-script';
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${settings.gaId}`;
    document.head.appendChild(s1);
    const s2 = document.createElement('script');
    s2.id = 'ga4-inline';
    s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.gaId}');`;
    document.head.appendChild(s2);
  }

  if (settings.gtmId && !document.getElementById('gtm-script')) {
    const s = document.createElement('script');
    s.id = 'gtm-script';
    s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtmId}');`;
    document.head.appendChild(s);
  }

  if (settings.metaPixelId && !document.getElementById('meta-pixel-script')) {
    const s = document.createElement('script');
    s.id = 'meta-pixel-script';
    s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.metaPixelId}');fbq('track','PageView');`;
    document.head.appendChild(s);
  }

  if (settings.tiktokPixelId && !document.getElementById('tiktok-pixel-script')) {
    const s = document.createElement('script');
    s.id = 'tiktok-pixel-script';
    s.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${settings.tiktokPixelId}');ttq.page();}(window,document,'ttq');`;
    document.head.appendChild(s);
  }
}

/**
 * Real third-party live-chat widget injection, mirroring the analytics
 * injector above. Reads settings.chatProvider/chatValue (dashboard →
 * Settings → Support & Live Chat). WhatsApp doesn't need a script at all —
 * it's rendered as a real wa.me deep-link button by ChatFloatSection in
 * theme-engine.tsx instead — this function only handles providers that are
 * genuinely third-party embed scripts.
 */
export function injectChatWidget(settings: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  if (settings.chatProvider === 'crisp' && settings.chatValue && !document.getElementById('crisp-chat-script')) {
    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = settings.chatValue;
    const s = document.createElement('script');
    s.id = 'crisp-chat-script';
    s.src = 'https://client.crisp.chat/l.js';
    s.async = true;
    document.head.appendChild(s);
  }

  if (settings.chatProvider === 'tawk' && settings.chatValue && !document.getElementById('tawk-chat-script')) {
    const s = document.createElement('script');
    s.id = 'tawk-chat-script';
    s.async = true;
    s.src = `https://embed.tawk.to/${settings.chatValue}/default`;
    s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);
  }
}
