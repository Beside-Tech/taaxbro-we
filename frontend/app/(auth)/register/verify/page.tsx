'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleChange = (index: number, value: string) => {
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

  const handlePaste = (e: React.ClipboardEvent) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/login');
  };

  return (
    <>
      <h1 className='text-3xl md:text-4xl mb-3'>Complete Sign Up</h1>
      <p className='text-sm text-secondary-30 mb-8'>
        To complete sign up, input the 6 digit OTP sent to your email
      </p>

      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        <div className='flex gap-3'>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type='text'
              inputMode='numeric'
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className='flex-1 min-w-0 aspect-square border border-grey-10 rounded-lg text-center text-lg font-medium outline-none focus:border-primary-30 transition-colors'
            />
          ))}
        </div>

        <p className='text-sm'>
          Didn&apos;t receive OTP?{' '}
          <button type='button' className='text-primary-30 font-medium hover:underline'>
            Send another OTP
          </button>
        </p>

        <button
          type='submit'
          className='w-full bg-primary-30 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-40 transition-colors'>
          Register
        </button>
      </form>
    </>
  );
}
