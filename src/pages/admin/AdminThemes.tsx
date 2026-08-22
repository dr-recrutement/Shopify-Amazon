import { PageHeader, Card, Badge, Table, LockedFeature } from '../dashboard/ui';
import { Eye, Star } from 'lucide-react';
import { THEME_PRESETS } from '../../lib/theme-engine';

// The real 9 theme presets built into the platform's own theme engine
// (src/lib/theme-engine.tsx THEME_PRESETS) — this used to list 13
// official Shopify Theme Store theme names (Dawn, Refresh, Spotlight,
// Sense, Taste, Craft, Colorblock, Crave, Studio, Origin, Publisher,
// Trade, Ride) with fabricated "stores using" counts up to 268,000,
// claiming they were "convertible from Shopify (respecting licenses)".
// None of those actually exist in this codebase — this was presenting
// Shopify's own trademarked theme names as if hosted on this platform,
// which is a real misrepresentation risk, not just a cosmetic issue.
export default function AdminThemes() {
  const presets = Object.entries(THEME_PRESETS);
  return (
    <div>
      <PageHeader title="Thèmes" subtitle="Les presets réels du moteur de thème Os." />
      <Card className="mb-6 p-4 flex items-center justify-between bg-gradient-to-r from-brand-50 to-white">
        <div className="flex items-center gap-3">
          <Star className="text-brand-600" size={20} />
          <div>
            <p className="text-sm font-medium text-gray-900">Moteur de thème propre à Os</p>
            <p className="text-xs text-gray-500">Sections, blocs et éditeur visuel développés pour la plateforme — pas une adaptation d'un thème tiers.</p>
          </div>
        </div>
        <Badge color="green">{presets.length} presets réels</Badge>
      </Card>
      <Card>
        <Table headers={['Thème', 'Description', 'Polices', '']}>
          {presets.map(([key, preset]) => (
            <tr key={key} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">{preset.label}</td>
              <td className="py-3 px-4 text-gray-600 text-sm max-w-md">{preset.desc}</td>
              <td className="py-3 px-4 text-gray-500 text-xs">{preset.fonts.heading}{preset.fonts.heading !== preset.fonts.body ? ` / ${preset.fonts.body}` : ''}</td>
              <td className="py-3 px-4">
                <a href="/app/online-store" className="text-brand-600 hover:underline text-sm flex items-center gap-1"><Eye size={14} /> Voir dans l'éditeur</a>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <LockedFeature title="Accès éditeur visuel via impersonation" desc="Super Admin peut éditer visuellement n'importe quelle boutique via impersonation sécurisée et tracée." plan="Super Admin" />
    </div>
  );
}
