import { supabase } from './supabase';

export interface PlatformSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement_active: boolean;
  announcement_message: string;
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

/** Real-read (not cached/hardcoded) of the platform_settings singleton —
 *  powers the merchant-dashboard maintenance gate and announcement
 *  banner. Returns null on any failure so callers can fail open (never
 *  block the dashboard because this one read failed). */
export async function fetchPlatformSettings(): Promise<PlatformSettings | null> {
  try {
    const { data, error } = await supabase.from('platform_settings').select('*').eq('id', SETTINGS_ID).single();
    if (error || !data) return null;
    return data as PlatformSettings;
  } catch {
    return null;
  }
}

export async function savePlatformSettings(patch: Partial<PlatformSettings>): Promise<boolean> {
  try {
    const { error } = await supabase.from('platform_settings').update(patch).eq('id', SETTINGS_ID);
    return !error;
  } catch {
    return false;
  }
}
