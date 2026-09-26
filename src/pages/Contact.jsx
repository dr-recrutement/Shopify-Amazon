import { useTranslation } from 'react-i18next';
import { Mail, MessageCircle, Linkedin, Facebook, Instagram } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { SUPPORT_EMAIL, CS_EMAIL, ORG_SOCIALS } from '@/lib/seo';

const SOCIALS = [
  { icon: Linkedin, label: 'LinkedIn', href: ORG_SOCIALS[0] },
  { icon: Facebook, label: 'Facebook', href: ORG_SOCIALS[1] },
  { icon: Instagram, label: 'Instagram', href: ORG_SOCIALS[2] },
];

export default function Contact() {
  const { t } = useTranslation();
  const p = (k) => t(`pages.contact.${k}`);
  const channels = [
    { icon: Mail, title: p('channel1_title'), text: p('channel1_text'), value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    { icon: MessageCircle, title: p('channel2_title'), text: p('channel2_text'), value: CS_EMAIL, href: `mailto:${CS_EMAIL}` },
  ];

  return (
    <MarketingLayout title={p('meta_title')} description={p('meta_desc')} url="/contact">
      <section className="relative overflow-hidden bg-[#0A0A0A] py-16 lg:py-20">
        <div className="absolute inset-0">
          <img src="/marketing/hero/affa_esens-alone-4502456_1920.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-[#0A0A0A]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-landing font-semibold text-white text-3xl sm:text-4xl tracking-tight">{p('h1')}</h1>
          <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed">{p('hero_p')}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 gap-6">
          {channels.map((c) => (
            <a key={c.title} href={c.href} className="block bg-white border border-[#E1E1E1] rounded-2xl p-7 hover:border-[#008060] hover:shadow-lg transition-all">
              <c.icon className="w-7 h-7 text-[#008060]" />
              <h3 className="mt-4 font-landing font-semibold text-lg text-[#202223]">{c.title}</h3>
              <p className="mt-2 text-sm text-[#6D7175] leading-relaxed">{c.text}</p>
              <p className="mt-4 font-semibold text-sm text-[#008060]">{c.value}</p>
            </a>
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10">
          <div className="bg-[#F8F9FA] border border-[#E1E1E1] rounded-2xl p-7 text-center">
            <h3 className="font-landing font-semibold text-lg text-[#202223]">{p('follow_title')}</h3>
            <p className="mt-2 text-sm text-[#6D7175]">{p('follow_p')}</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="w-11 h-11 rounded-full bg-white border border-[#E1E1E1] hover:border-[#008060] hover:text-[#008060] flex items-center justify-center transition-colors text-[#202223]">
                  <s.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
