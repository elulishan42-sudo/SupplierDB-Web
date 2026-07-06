import { createClient } from '@supabase/supabase-js';
import { env, assertConfigured } from '@/env.config';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    assertConfigured();
    supabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return supabaseClient;
}
