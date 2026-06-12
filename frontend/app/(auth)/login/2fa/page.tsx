'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { auth, ApiError } from '@/lib/api';

function TwoFactorVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const userId = searchParams.get('user_id') ?? '';

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
    }
  }, [userId, router]);

  // Trigger verify if 6 digits are filled
  useEffect(() => {
    const code = otpDigits.join('');
    if (code.length === 6 && !loading) {
      handleVerify(code);
    }
  }, [otpDigits]);

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await auth.verify2fa(userId, code);
      setUser(user);
      router.push(user.onboarding_completed ? '/overview' : '/onboarding');
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Verification failed. Please try again.');
      // Clear OTP digits on failure so they can try again
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }
    
    const newDigits = [...otpDigits];
    const valDigits = val.split('').slice(0, 6 - index);
    valDigits.forEach((d, i) => {
      newDigits[index + i] = d;
    });
    setOtpDigits(newDigits);
    
    const nextIndex = Math.min(index + valDigits.length, 5);
    if (nextIndex !== index) {
      otpRefs.current[nextIndex]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpRefs.current[index - 1]?.focus();
      } else if (otpDigits[index]) {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pastedData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <>
      <p className='text-sm text-secondary-30 mb-1'>Security verification</p>
      <h1 className='text-3xl md:text-4xl mb-3'>Two-Factor Authentication</h1>
      <p className='text-sm text-secondary-30 mb-8'>
        Enter the 6-digit code from your authenticator app to complete sign-in.
      </p>

      {error && (
        <div className='mb-6 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2 animate-fade-in'>
          <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
          {error}
        </div>
      )}

      <div className="flex flex-col items-center space-y-6">
        <div className="flex gap-2 sm:gap-3 justify-center w-full">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                otpRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleOtpChange(e, index)}
              onKeyDown={(e) => handleOtpKeyDown(e, index)}
              onPaste={handleOtpPaste}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-2xl border-2 border-grey-10 bg-grey-0 focus:border-primary-30 focus:bg-white focus:ring-4 focus:ring-primary-30/10 outline-none transition-all"
            />
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-primary-30 text-sm font-medium">
            <Icon icon="ph:circle-notch" className="animate-spin text-lg" />
            Verifying secure code...
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-sm text-secondary-30 hover:text-primary-30 font-medium transition"
        >
          Back to login
        </button>
      </div>
    </>
  );
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense fallback={<div className='p-8 text-center'>Loading…</div>}>
      <TwoFactorVerifyForm />
    </Suspense>
  );
}
