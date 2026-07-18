import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    // Return a proxy that throws on access so it doesn't crash imports during next build
    return new Proxy({}, {
      get: (target, prop) => {
        return () => {
          throw new Error('Supabase URL or Service Role Key is missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
        };
      }
    });
  }

  supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseInstance;
}
