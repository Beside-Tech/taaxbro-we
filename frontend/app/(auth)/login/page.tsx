'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // AuthContext.login() already calls router.push based on onboarding_completed
      // Do NOT push here — double-push causes a race where middleware fires before
      // the cookie is readable, bouncing the user back to /login
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className='text-sm text-secondary-30 mb-1'>Jump back in</p>
      <h1 className='text-3xl md:text-4xl mb-7'>Sign In</h1>

      <button
        type='button'
        className='w-full flex items-center justify-center gap-2 border border-grey-10 rounded-full py-3 text-sm font-medium text-dark hover:bg-grey-10/30 transition-colors mb-5'>
        <Icon icon='logos:google-icon' className='text-xl' />
        Login with Google
      </button>

      <div className='flex items-center gap-3 mb-5'>
        <div className='flex-1 h-px bg-grey-10' />
        <span className='text-xs text-secondary-30'>or</span>
        <div className='flex-1 h-px bg-grey-10' />
      </div>

      {error && (
        <div className='mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700'>
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
          disabled={loading}
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