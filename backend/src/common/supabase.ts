import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseClientInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('placeholder-project')
  );
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are defined in backend/.env'
      );
    }
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClientInstance;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdminInstance) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Supabase admin credentials missing. Ensure SUPABASE_SERVICE_ROLE_KEY is defined in backend/.env'
      );
    }
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
}
