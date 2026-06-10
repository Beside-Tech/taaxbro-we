'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

function LoginForm() {
  const { login } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Surface Google OAuth errors passed back via query param
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'google_denied') setError('Google sign-in was cancelled.');
    if (err === 'google_failed') setError('Google sign-in failed. Please try again or use email.');
    if (err === 'google_no_email') setError('Could not retrieve your Google email. Please use email sign-in.');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext.login() handles redirect
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const res  = await fetch(`${API}/api/v1/auth/google/url`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? 'Google OAuth unavailable');
      // Full-page redirect to Google consent screen
      // The backend callback will set cookies and redirect back to /overview or /onboarding
      window.location.href = data.url;
    } catch (err: unknown) {
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : 'Could not start Google sign-in.');
    }
  };

  return (
    <>
      <p className='text-sm text-secondary-30 mb-1'>Jump back in</p>
      <h1 className='text-3xl md:text-4xl mb-7'>Sign In</h1>

      <button
        type='button'
        disabled={googleLoading || loading}
        onClick={handleGoogleLogin}
        className='w-full flex items-center justify-center gap-2 border border-grey-10 rounded-full py-3 text-sm font-medium text-dark hover:bg-grey-10/30 transition-colors mb-5 disabled:opacity-60 disabled:cursor-not-allowed'>
        {googleLoading
          ? <Icon icon='ph:circle-notch' className='animate-spin text-xl' />
          : <Icon icon='logos:google-icon' className='text-xl' />
        }
        {googleLoading ? 'Redirecting to Google…' : 'Login with Google'}
      </button>

      <div className='flex items-center gap-3 mb-5'>
        <div className='flex-1 h-px bg-grey-10' />
        <span className='text-xs text-secondary-30'>or</span>
        <div className='flex-1 h-px bg-grey-10' />
      </div>

      {error && (
        <div className='mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
          <Icon icon='ph:warning-circle' className='shrink-0' />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <label className='text-sm'>Email Address</label>
          <input
            type='email'
            placeholder='example@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='border border-grey-10 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
          />
        </div>

        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <label className='text-sm'>Password</label>
            <Link href='/forgot-password' className='text-sm text-primary-30 hover:underline'>
              Forgot password?
            </Link>
          </div>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder='Enter password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='w-full border border-grey-10 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
            />
            <button
              type='button'
              onClick={() => setShowPassword((v) => !v)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-30 hover:text-dark transition-colors'>
              <Icon icon={showPassword ? 'ph:eye-slash' : 'ph:eye'} className='text-xl' />
            </button>
          </div>
        </div>

        <button
          type='submit'
          disabled={loading || googleLoading}
          className='w-full bg-primary-30 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-40 transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed'>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className='text-sm mt-5'>
        Don&apos;t have an account?{' '}
        <Link href='/register' className='text-primary-30 font-medium hover:underline'>
          Sign up
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className='p-8 text-center'>Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}