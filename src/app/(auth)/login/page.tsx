'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isSignUp) {
      await signUp(email, password);
      // After signup, switch to login
      setIsSignUp(false);
    } else {
      await signIn(email, password);
      if (!useAuthStore.getState().error) {
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Supplier Database
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isLoading}
              className="w-full text-green-600 hover:text-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSignUp ? 'Have an account? Sign in' : 'No account? Sign up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
