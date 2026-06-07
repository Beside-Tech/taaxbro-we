'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <label className='text-sm'>Email Address</label>
          <input
            type='email'
            placeholder='example@example.com'
            className='border border-grey-10 rounded-lg px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors placeholder:text-secondary-40'
          />
        </div>

        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <label className='text-sm'>Password</label>
            <button type='button' className='text-sm text-primary-30 hover:underline'>
              Forgot password?
            </button>
          </div>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder='Enter password'
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
          className='w-full bg-primary-30 text-white rounded-full py-3 text-sm font-medium hover:bg-primary-40 transition-colors mt-1'>
          Sign In
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
