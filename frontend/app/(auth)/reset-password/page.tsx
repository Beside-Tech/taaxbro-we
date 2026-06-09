'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { auth, ApiError } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') ?? '');
  }, []);

  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token === undefined) {
    return null;
  }

  if (!token) {
    return (
      <>
        <h1 className='text-3xl mb-4'>Invalid Link</h1>
        <p className='text-sm text-secondary-30 mb-5'>
          This reset link is missing or invalid. Please request a new one.
        </p>
        <Link href='/forgot-password' className='text-sm text-primary-30 font-medium hover:underline'>
          Request new link
        </Link>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      await auth.resetPassword({ token, new_password: password });
      router.push('/login?reset=1');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className='text-sm text-secondary-30 mb-1'>Almost there</p>
      <h1 className='text-3xl md:text-4xl mb-7'>Set New Password</h1>

      {error && (
        <div className='mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        {[
          { label: 'New Password', value: password, set: setPassword, show: showPassword, toggle: () => setShowPassword(v => !v) },
          { label: 'Confirm Password', value: confirm, set: setConfirm, show: showPassword, toggle: () => setShowPassword(v => !v) },
        ].map(({ label, value, set, show, toggle }, i) => (
          <div key={i} className='flex flex-col gap-1'>
            <label className='text-sm'>{label}</label>
            <div className='relative'>
              <input
                type={show ? 'text' : 'password'}
                placeholder={i === 0 ? 'Min 8 chars, 1 letter, 1 number' : 'Re-enter password'}
                value={value}
                onChange={(e) => set(e.target.value)}
                required
                className='w-full border border-grey-10 rounded-lg px-4 py-3 pr-11 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
              />
              <button type='button' onClick={toggle}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-30 hover:text-dark transition-colors'>
                <Icon icon={show ? 'ph:eye-slash' : 'ph:eye'} className='text-xl' />
              </button>
            </div>
          </div>
        ))}

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-primary-30 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-40 transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed'>
          {loading ? 'Saving…' : 'Set New Password'}
        </button>
      </form>
    </>
  );
}