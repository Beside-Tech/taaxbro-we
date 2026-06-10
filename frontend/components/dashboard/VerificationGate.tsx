'use client';

/**
 * VerificationGate
 *
 * Modal overlay shown on /overview for users who haven't completed KYC/KYB.
 * Matches the Figma "Complete your verification to unlock all features" design.
 *
 * When to show: user.kyc_completed === false (add this field to User model + AuthUser
 * interface when you build the KYC flow). Until then, the gate stays dormant
 * because the condition below won't fire.
 *
 * Drop <VerificationGate /> at the top of OverviewPage's JSX:
 *   return (
 *     <div className='flex flex-col flex-1'>
 *       <VerificationGate />
 *       <TopBar>...
 *
 * Dismissal persists in sessionStorage so it doesn't re-fire on page navigation
 * within the same browser session. It reappears on the next login.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const DISMISSED_KEY = 'tb_kyc_gate_dismissed';

export default function VerificationGate() {
  const { user }        = useAuth();
  const router          = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Guard: only show when the kyc_completed field exists and is false.
    // Until the KYC flow is built and the field is added to the API response,
    // (user as any).kyc_completed will be undefined — which is falsy but we
    // deliberately check `=== false` so we don't gate users prematurely.
    const needsKyc = (user as any)?.kyc_completed === false;
    const dismissed = typeof window !== 'undefined' && sessionStorage.getItem(DISMISSED_KEY);
    if (needsKyc && !dismissed) {
      setOpen(true);
    }
  }, [user]);

  if (!open) return null;

  function dismiss() {
    setOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    }
  }

  return (
    /* Backdrop */
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 backdrop-blur-[3px]'
        style={{ background: 'rgba(250,250,250,0.55)' }}
        aria-hidden='true'
      />

      {/* Modal */}
      <div className='relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md px-10 py-12 flex flex-col items-center text-center'>
        <h2 className='text-2xl font-bold text-secondary-10 mb-3 leading-snug'>
          Complete your verification to<br />unlock all features
        </h2>

        <p className='text-sm text-secondary-30 mb-10 leading-relaxed max-w-[300px]'>
          Payments, tax filing, and bank connections require KYC or KYB.
          This is a one time process which takes under 5 minutes.
        </p>

        <button
          type='button'
          onClick={() => {
            dismiss();
            router.push('/settings?tab=verification');
          }}
          className='w-full bg-primary-40 text-white rounded-full py-3.5 text-sm font-medium
            hover:bg-primary-30 transition-colors mb-4'>
          Start Verification
        </button>

        <button
          type='button'
          onClick={dismiss}
          className='text-sm text-secondary-30 hover:text-secondary-10 transition-colors'>
          Set up Later
        </button>
      </div>
    </div>
  );
}