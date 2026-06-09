'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth, ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <h1 className='text-3xl md:text-4xl mb-4'>Check your inbox</h1>
        <p className='text-sm text-secondary-30 mb-7'>
          If <span className='font-medium text-dark'>{email}</span> is registered, a reset link has been sent.
          Check your spam folder if you don&apos;t see it.
        </p>
        <Link href='/login' className='text-sm text-primary-30 font-medium hover:underline'>
          ← Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <p className='text-sm text-secondary-30 mb-1'>No worries</p>
      <h1 className='text-3xl md:text-4xl mb-3'>Reset Password</h1>
      <p className='text-sm text-secondary-30 mb-7'>
        Enter your email and we&apos;ll send a reset link.
      </p>

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
        <button
          type='submit'
          disabled={loading}
          className='w-full bg-primary-30 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <Link href='/login' className='block text-sm mt-5 text-primary-30 font-medium hover:underline'>
        ← Back to sign in
      </Link>
    </>
  );
}