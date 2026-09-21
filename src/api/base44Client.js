import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Auth now runs entirely on Supabase (see src/api/supabaseClient.js). This
// client is kept only so the not-yet-migrated data pages (products, orders,
// ...) keep compiling - see MIGRATION.md. VITE_BASE44_APP_ID is gone on
// purpose, so appId is undefined here: disable the SDK's automatic analytics
// heartbeat, which otherwise fires on every page load (including /login,
// since these pages are still statically imported into the same bundle) and
// hits /api/apps/undefined/analytics/track/batch, a 405 that has nothing to
// do with authentication.
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  appBaseUrl,
  analytics: { enabled: false },
});

