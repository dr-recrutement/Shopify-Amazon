import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { PageHeader, Card, Badge, Button } from './ui';
import { TemplateRenderer } from '../../lib/theme-system/TemplateRenderer';
import { withLiveProducts } from '../../lib/theme-system/liveData';
import { fromLegacyTheme } from '../../lib/theme-system/fromLegacyTheme';
import type { ThemeConfig as NewThemeConfig } from '../../lib/theme-system/types';
import { defaultThemeForType, getVariantStyles, type ThemeConfig as LegacyThemeConfig } from '../../lib/theme-engine';
import { fetchCloudTheme, fetchCloudSettings } from '../../lib/tenant-sync';
import { getShopProfile, getTenantStorageKey, getProducts, getShopSubdomain } from '../../lib/app-state';

/** A real, live-rendered miniature of the actual storefront — not a static
 *  screenshot. Renders the full-size page in a fixed box and scales it down,
 *  so the thumbnail always matches what the merchant's real settings
 *  produce, right now, with their real products. */
function LiveThumbnail({ config }: { config: NewThemeConfig }) {
  return (
    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-t-xl bg-white">
      <div style={{ width: '1200px', height: '750px', transform: 'scale(0.2358)', transformOrigin: 'top left', pointerEvents: 'none' }}>
        <TemplateRenderer config={config} />
      </div>
    </div>
  );
}

export default function OnlineStoreThemes() {
  const shopProfile = getShopProfile();
  const [legacyTheme, setLegacyTheme] = useState<LegacyThemeConfig>(() => {
    const saved = localStorage.getItem(getTenantStorageKey('liafrikos_theme_config'));
    if (saved) { try { return JSON.parse(saved); } catch { /* fall through */ } }
    return defaultThemeForType('ecommerce');
  });
  const [usingNewEngine, setUsingNewEngine] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCloudTheme<LegacyThemeConfig>(), fetchCloudSettings()]).then(([cloudTheme, settings]) => {
      if (cloudTheme) setLegacyTheme(cloudTheme);
      if (settings?.useNewThemeEngine) setUsingNewEngine(true);
      if (settings?.newThemeConfigSavedAt) setLastSavedAt(settings.newThemeConfigSavedAt);
      setLoading(false);
    });
  }, []);

  const previewConfig = useMemo<NewThemeConfig>(() => {
    const { radius } = getVariantStyles(legacyTheme.layoutVariant);
    const base = fromLegacyTheme(legacyTheme, {
      shopName: shopProfile.name,
      countryCode: shopProfile.country,
      radiusClass: radius,
      storeUrl: '/store',
      supportUrl: '/support',
    });
    return withLiveProducts(base, getProducts());
  }, [legacyTheme, shopProfile.name, shopProfile.country]);

  const storeUrl = `/s/${shopProfile.slug || getShopSubdomain().replace('.os.liafrik.com', '')}`;

  return (
    <div>
      <PageHeader
        title="Online Store"
        subtitle="Thèmes"
        action={
          <div className="flex gap-2">
            <Link to="/app/online-store/advanced"><Button variant="secondary" size="sm"><SettingsIcon size={14} /> Réglages avancés</Button></Link>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm"><ExternalLink size={14} /> Voir ma boutique</Button></a>
          </div>
        }
      />

      <Card className="overflow-hidden border border-gray-200">
        {loading ? (
          <div className="aspect-[16/10] bg-gray-50 animate-pulse" />
        ) : (
          <LiveThumbnail config={previewConfig} />
        )}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-sm">{shopProfile.name || 'Ma boutique'}</p>
                <Badge color="green">Thème actuel</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {usingNewEngine ? 'Moteur de thème Sellia Pro' : 'Moteur de thème classique'}
                {lastSavedAt && ` — enregistré le ${new Date(lastSavedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </p>
            </div>
          </div>
          <Link to="/app/online-store/customize">
            <Button size="sm" className="bg-gray-950 hover:bg-gray-800 text-white flex items-center gap-1.5">
              <Sparkles size={14} /> Personnaliser
            </Button>
          </Link>
        </div>
      </Card>

      <p className="text-xs text-gray-400 mt-4">
        La miniature ci-dessus est un rendu réel de votre boutique (vos vraies couleurs, votre vrai catalogue) — pas une capture d'écran statique.
      </p>
    </div>
  );
}
