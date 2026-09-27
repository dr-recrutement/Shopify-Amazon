import { useTranslation } from 'react-i18next';
import { Package, CreditCard, Truck, Tag } from 'lucide-react';
import FeatureGroupPage from '@/components/marketing/FeatureGroupPage';

const ICONS = [Package, CreditCard, Truck, Tag];
const IDS = ['gestion-stocks', 'paiements-integres', 'livraison-multi-zones', 'promotions-reductions'];
const IMAGES = [
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1601599963565-b7f49deb2076?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=900&q=80',
];

export default function FeatureManage() {
  const { t } = useTranslation();
  const f = (k) => t(`pages.feature_manage.${k}`);
  const sections = t('pages.feature_manage.sections', { returnObjects: true }).map((s, i) => ({ ...s, id: IDS[i], icon: ICONS[i], image: IMAGES[i] }));

  return (
    <FeatureGroupPage
      eyebrow={f('eyebrow')}
      title={f('meta_title')}
      description={f('meta_desc')}
      url="/fonctionnalites/gerer"
      intro={f('intro')}
      heroImage="/marketing/hero/rupixen-payment-4334491_1920.jpg"
      sections={sections}
    />
  );
}
