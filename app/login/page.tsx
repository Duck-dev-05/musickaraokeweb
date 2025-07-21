'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { signIn } from 'next-auth/react';

const getErrorMessage = (error: string | null) => {
  switch (error) {
    case 'Callback':
      return 'Failed to authenticate with Google. Please try again.';
    case 'OAuthSignin':
      return 'Error starting Google sign in. Please try again.';
    case 'OAuthCallback':
      return 'Error completing Google sign in. Please try again.';
    case 'OAuthCreateAccount':
      return 'Error creating account. Please try again.';
    case 'EmailCreateAccount':
      return 'Error creating account. Please try again.';
    case 'Callback':
      return 'Error during authentication. Please try again.';
    case 'CredentialsSignin':
      return 'Invalid email or password.';
    default:
      return error ? `Authentication error: ${error}` : null;
  }
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error from NextAuth
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }

    // Get the callback URL
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push(callbackUrl);
    }
  }, [searchParams, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(getErrorMessage('CredentialsSignin'));
      } else {
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        router.push(callbackUrl);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      await signIn('google', { callbackUrl });
    } catch (error) {
      setError('Failed to login with Google');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="max-w-md w-full space-y-8 p-8 bg-dark-secondary rounded-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <MicrophoneIcon className="h-6 w-6 text-dark" />
          </div>
          <h2 className="text-3xl font-bold text-center">Welcome back</h2>
          <p className="text-light-secondary mt-2">Login to continue to Music Karaoke</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-light-secondary mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-light"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-light-secondary mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-light"
              placeholder="Enter your password"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-700 bg-dark text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-light-secondary">
                Remember me
              </label>
            </div>

            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-primary text-dark rounded-full hover:bg-primary/90 transition-colors font-medium relative"
          >
            {formLoading ? (
              <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-dark-secondary text-light-secondary">Or continue with</span>
          </div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={formLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-700 rounded-full hover:bg-secondary transition-colors relative"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-sm text-light-secondary">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 