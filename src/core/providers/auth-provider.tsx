'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/application/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
