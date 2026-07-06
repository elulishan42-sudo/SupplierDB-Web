import { getSupabaseClient } from '@/core/supabase/client';
import { AuthError, Session } from '@supabase/supabase-js';

export class AuthRepository {
  private client = getSupabaseClient();

  async currentSession(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.client.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }
}

export const authRepository = new AuthRepository();
