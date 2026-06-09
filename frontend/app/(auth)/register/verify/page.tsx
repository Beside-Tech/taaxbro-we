'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { auth, ApiError } from '@/lib/api';

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') ?? '');
  }, []);

  useEffect(() => {
    if (email === '') {
      router.replace('/register');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    if (!email) {
      router.replace('/register');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const user = await auth.verifyEmail({ email, otp: code });
      router.push(user.onboarding_completed ? '/overview' : '/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setError('');
    setResendMsg('');
    try {
      const response = await auth.resendOtp(email);
      setResendMsg(response.message);
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend the code. Please try again.');
    }
  };

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
        <div className='flex gap-3'>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputs.current[index] = el; }}
              type='text'
              inputMode='numeric'
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className='flex-1 min-w-0 aspect-square border border-grey-10 rounded-lg text-center text-lg font-medium outline-none focus:border-primary-30 transition-colors'
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
          type='button'
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className='text-primary-30 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed'>
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </p>
    </>
  );
}
