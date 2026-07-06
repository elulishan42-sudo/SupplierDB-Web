import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { authRepository } from '../data/auth-repository';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const session = await authRepository.currentSession();
      set({ session, isLoading: false });

      // Listen for auth changes
      authRepository.onAuthStateChange((_event, session) => {
        set({ session, isLoading: false });
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await authRepository.signIn(email, password);
      const session = await authRepository.currentSession();
      set({ session, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await authRepository.signUp(email, password);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authRepository.signOut();
      set({ session: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
