'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | undefined>(undefined);
  const { setUser } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') ?? '');
  }, []);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleDigitChange = (i: number, val: string) => {
    // Handle paste of full 6-digit code
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const next = val.split('');
      setDigits(next);
      inputRefs.current[5]?.focus();
      return;
    }
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (char && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) { setError('Enter the full 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const user = await auth.verifyEmail({ email, otp });
      setUser(user);
      router.push(user.onboarding_completed ? '/overview' : '/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendMsg('');
    setError('');
    try {
      const res = await auth.resendOtp(email);
      setResendMsg(res.message);
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend. Please try again.');
    }
  };

  useEffect(() => {
    if (email === '') {
      router.replace('/register');
    }
  }, [email, router]);

  if (email === undefined) {
    return null;
  }

  if (!email) {
    return null;
  }

  return (
    <>
      <p className='text-sm text-secondary-30 mb-1'>One last step</p>
      <h1 className='text-3xl md:text-4xl mb-3'>Verify Your Email</h1>
      <p className='text-sm text-secondary-30 mb-7'>
        We sent a 6-digit code to <span className='font-medium text-dark'>{email}</span>.
        Check your inbox and spam folder.
      </p>

      {error && (
        <div className='mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700'>
          {error}
        </div>
      )}
      {resendMsg && (
        <div className='mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700'>
          {resendMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        <div className='flex gap-2 justify-between'>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type='text'
              inputMode='numeric'
              maxLength={6}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className='w-12 h-14 text-center text-xl font-semibold border border-grey-10 rounded-lg outline-none focus:border-primary-30 transition-colors'
            />
          ))}
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-primary-30 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'>
          {loading ? 'Verifying…' : 'Verify Email'}
        </button>
      </form>

      <p className='text-sm mt-5 text-secondary-30'>
        Didn&apos;t receive it?{' '}
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className='text-primary-30 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed'>
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </p>
    </>
  );
}