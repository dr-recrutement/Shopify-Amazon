import { useTranslation } from 'react-i18next';
import { Palette, Sparkles, ShoppingCart } from 'lucide-react';
import FeatureGroupPage from '@/components/marketing/FeatureGroupPage';

const ICONS = [Palette, Sparkles, ShoppingCart];
const IDS = ['editeur-boutique', 'themes-premium', 'checkout-optimise'];
const IMAGES = [
  'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
];

export default function FeatureCreateSell() {
  const { t } = useTranslation();
  const f = (k) => t(`pages.feature_create_sell.${k}`);
  const sections = t('pages.feature_create_sell.sections', { returnObjects: true }).map((s, i) => ({ ...s, id: IDS[i], icon: ICONS[i], image: IMAGES[i] }));

  return (
    <FeatureGroupPage
      eyebrow={f('eyebrow')}
      title={f('meta_title')}
      description={f('meta_desc')}
      url="/fonctionnalites/creer-vendre"
      intro={f('intro')}
      heroImage="/marketing/hero/tungart7-woman-8656653_1920.jpg"
      sections={sections}
    />
  );
}
