import { useTranslation } from 'react-i18next';
import { BarChart3, Globe2, Bot } from 'lucide-react';
import FeatureGroupPage from '@/components/marketing/FeatureGroupPage';

const ICONS = [BarChart3, Globe2, Bot];
const IDS = ['analytics-temps-reel', 'multi-devises', 'sellia-assistant'];
const IMAGES = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
];

export default function FeatureGrow() {
  const { t } = useTranslation();
  const f = (k) => t(`pages.feature_grow.${k}`);
  const sections = t('pages.feature_grow.sections', { returnObjects: true }).map((s, i) => ({ ...s, id: IDS[i], icon: ICONS[i], image: IMAGES[i] }));

  return (
    <FeatureGroupPage
      eyebrow={f('eyebrow')}
      title={f('meta_title')}
      description={f('meta_desc')}
      url="/fonctionnalites/croitre"
      intro={f('intro')}
      heroImage="/marketing/hero/tumisu-ecommerce-3640321_1920.jpg"
      sections={sections}
    />
  );
}
