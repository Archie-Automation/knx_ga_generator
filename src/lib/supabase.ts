import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ajdaacuzcqhuzfmaibpq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rKXK05DQDHUdRXlD34-oyA_2K2RnxBy';

// Audit: log Supabase URL at load and verify not pointing to localhost
const _isLocalhost =
  typeof supabaseUrl === 'string' &&
  (supabaseUrl.startsWith('http://localhost') || supabaseUrl.startsWith('http://127.0.0.1'));
if (import.meta.env.DEV && typeof console !== 'undefined') {
  console.log('[Supabase] Project URL:', supabaseUrl);
  if (_isLocalhost) {
    console.warn('[Supabase] URL is pointing to localhost. For production/Edge Functions use your hosted Supabase project URL.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabaseUrl };

export type { User };
