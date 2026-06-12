'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import ChatButton from '@/components/ChatButton';
import { useAuth } from '@/context/AuthContext';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { Icon } from '@iconify/react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, refreshSession } = useAuth();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { reset } = useIdleTimeout({
    onWarning: () => setShowWarningModal(true),
    onTimeout: () => {
      setShowWarningModal(false);
      logout();
    },
    isActive: true, // Only track if logged in
  });

  const handleStayLoggedIn = async () => {
    setIsRefreshing(true);
    const success = await refreshSession();
    setIsRefreshing(false);
    if (success) {
      setShowWarningModal(false);
      reset(); // Reset timers
    } else {
      // Refresh failed (refresh token expired/revoked) — logout
      setShowWarningModal(false);
      logout();
    }
  };

  const handleLogout = () => {
    setShowWarningModal(false);
    logout();
  };

  return (
    <div className='min-h-screen bg-[#fafafa] relative'>
      {/* Mobile Top Navigation Bar */}
      <header className='lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-b-secondary-40 flex items-center justify-between px-4 z-30 shadow-sm'>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className='p-2 -ml-2 text-secondary-10 hover:bg-grey-10/50 rounded-xl transition-colors'
        >
          <Icon icon='ph:list' className='text-2xl' />
        </button>
        <Link href='/overview' className='flex items-center mx-auto pr-6'>
          <img src='/assets/StackedLogo.png' alt='Taaxbro' className='h-10 w-auto' />
        </Link>
      </header>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className='fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity'
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className='ml-0 lg:ml-56 pt-16 lg:pt-0 flex flex-col min-h-screen'>{children}</div>
      <ChatButton />

      {/* Inactivity Warning Modal */}
      {showWarningModal && (
        <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in'>
          <div className='bg-white rounded-3xl p-8 max-w-md w-full mx-4 border border-grey-10 shadow-2xl space-y-6 text-center animate-scale-up'>
            <div className='mx-auto w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm'>
              <Icon icon='ph:warning-circle-bold' className='text-3xl' />
            </div>

            <div className='space-y-2'>
              <h3 className='text-xl font-bold text-secondary-10'>Are you still there?</h3>
              <p className='text-sm text-secondary-30 leading-relaxed'>
                For your security, you will be logged out in <span className='font-semibold text-secondary-10'>2 minutes</span> due to inactivity. Click below to continue your session.
              </p>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 pt-2'>
              <button
                type='button'
                onClick={handleLogout}
                className='w-full sm:w-1/3 px-4 py-3 border border-grey-10 hover:bg-grey-0 text-sm font-bold text-secondary-20 transition rounded-full'
              >
                Log Out
              </button>
              <button
                type='button'
                onClick={handleStayLoggedIn}
                disabled={isRefreshing}
                className='w-full sm:w-2/3 px-6 py-3 bg-primary-30 hover:bg-primary-40 disabled:opacity-55 disabled:cursor-not-allowed text-sm font-bold text-white transition rounded-full flex items-center justify-center gap-2 shadow-md shadow-primary-30/10'
              >
                {isRefreshing && <Icon icon='ph:circle-notch' className='animate-spin text-base' />}
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
