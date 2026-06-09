'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { auth, ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (password !== confirm) return 'Passwords do not match.';
    if (!agreed) return 'You must agree to the Terms of Service.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      await auth.signup({ full_name: fullName, email, password });
      // Pass email to verify page via query param
      router.push(`/register/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className='text-sm text-secondary-30 mb-1'>Get started for free</p>
      <h1 className='text-3xl md:text-4xl mb-7'>Create an Account</h1>

      <button
        type='button'
        className='w-full flex items-center justify-center gap-2 border border-grey-10 rounded-full py-3 text-sm font-medium text-dark hover:bg-grey-10/30 transition-colors mb-5'>
        <Icon icon='logos:google-icon' className='text-xl' />
        Continue with Google
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
          <label className='text-sm'>Full Name</label>
          <input
            type='text'
            placeholder='Surname First'
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className='border border-grey-10 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
          />
        </div>

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
          <label className='text-sm'>Password</label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder='Min 8 chars, 1 letter, 1 number'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='w-full border border-grey-10 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
            />
            <button type='button' onClick={() => setShowPassword((v) => !v)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-30 hover:text-dark transition-colors'>
              <Icon icon={showPassword ? 'ph:eye-slash' : 'ph:eye'} className='text-xl' />
            </button>
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm'>Confirm Password</label>
          <div className='relative'>
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder='Re-enter password'
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className='w-full border border-grey-10 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
            />
            <button type='button' onClick={() => setShowConfirm((v) => !v)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-30 hover:text-dark transition-colors'>
              <Icon icon={showConfirm ? 'ph:eye-slash' : 'ph:eye'} className='text-xl' />
            </button>
          </div>
        </div>

        <label className='flex items-start gap-2 cursor-pointer'>
          <input type='checkbox' checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
            className='mt-0.5 accent-primary-30' />
          <span className='text-sm text-secondary-30'>
            I agree to the{' '}
            <Link href='/terms' className='text-primary-30 hover:underline'>Terms of Service</Link>
            {' '}and{' '}
            <Link href='/privacy' className='text-primary-30 hover:underline'>Privacy Policy</Link>
          </span>
        </label>

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-primary-30 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-40 transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed'>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className='text-sm mt-5'>
        Already have an account?{' '}
        <Link href='/login' className='text-primary-30 font-medium hover:underline'>
          Sign in
        </Link>
      </p>
    </>
  );
}