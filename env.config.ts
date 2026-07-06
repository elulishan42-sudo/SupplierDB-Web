/// Environment configuration for Supabase
/// Copy this file to env.local.ts and fill in your actual credentials
/// Add env.local.ts to .gitignore to keep credentials secure

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

export function assertConfigured(): void {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
    );
  }
}
