'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  children: React.ReactNode;
}

export default function TopBar({ children }: TopBarProps) {
  const { user } = useAuth();
  const email = user?.email ?? '';
  const name = user?.full_name || email.split('@')[0] || '';

  return (
    <header className='flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-4'>
      <div className='flex-1 min-w-[200px]'>{children}</div>
      <div className='hidden lg:flex items-center gap-3 shrink-0 ml-auto'>
        <button className='w-9 h-9 flex items-center justify-center rounded-full border border-grey-10 hover:bg-primary-50 transition-colors shrink-0'>
          <Icon icon='ph:bell' className='text-lg text-secondary-10' />
        </button>
        <div className='flex items-center gap-2 border border-grey-10 rounded-full pl-1 pr-4 py-1 max-w-[180px] sm:max-w-xs'>
          <div className='w-8 h-8 rounded-full bg-secondary-40 overflow-hidden flex items-center justify-center shrink-0'>
            <Icon icon='ph:user-fill' className='text-white text-sm' />
          </div>
          <span className='text-sm text-secondary-10 truncate font-medium'>{name}</span>
        </div>
      </div>
    </header>
  );
}