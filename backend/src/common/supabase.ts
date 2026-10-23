import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClientInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY || '';
}

function getSupabaseServiceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  return (
    Boolean(url) &&
    Boolean(anonKey) &&
    !url.includes('placeholder-project') &&
    !url.includes('your-supabase-project') &&
    !anonKey.includes('placeholder-') &&
    !anonKey.includes('your-supabase-')
  );
}

export function isSupabaseAdminConfigured(): boolean {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  return (
    isSupabaseConfigured() &&
    Boolean(serviceKey) &&
    !serviceKey.includes('placeholder-') &&
    !serviceKey.includes('your-supabase-') &&
    !serviceKey.includes('your-service-role')
  );
}

export function getSupabaseClient(token?: string): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      'Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are defined in backend/.env'
    );
  }

  // If a user token is provided, return a client with the user's Bearer token so PostgreSQL RLS rules pass
  if (token) {
    return createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(url, anonKey);
  }
  return supabaseClientInstance;
}

export function getSupabaseAdminClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!supabaseAdminInstance) {
    if (!url || !serviceKey || serviceKey.includes('placeholder-')) {
      throw new Error(
        'Supabase admin credentials missing or placeholder. Ensure SUPABASE_SERVICE_ROLE_KEY is defined in backend/.env'
      );
    }
    supabaseAdminInstance = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminInstance;
}
