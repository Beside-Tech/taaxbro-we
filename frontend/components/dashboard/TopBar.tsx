'use client';

import { Icon } from '@iconify/react';

interface TopBarProps {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
}

export default function TopBar({
  children,
  userEmail = 'danielochoja@gmail.com',
  userName = 'Daniel',
  userAvatar,
}: TopBarProps) {
  return (
    <header className='flex items-center justify-between px-8 py-4'>
      <div>{children}</div>
      <div className='flex items-center gap-3'>
        <button className='w-9 h-9 flex items-center justify-center rounded-full border border-grey-10 hover:bg-primary-50 transition-colors'>
          <Icon icon='ph:bell' className='text-lg text-secondary-10' />
        </button>
        <div className='flex items-center gap-2 border border-grey-10 rounded-full pl-1 pr-4 py-1'>
          <div className='w-8 h-8 rounded-full bg-secondary-40 overflow-hidden flex items-center justify-center shrink-0'>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className='w-full h-full object-cover'
              />
            ) : (
              <Icon icon='ph:user-fill' className='text-white text-sm' />
            )}
          </div>
          <span className='text-sm text-secondary-10'>{userEmail}</span>
        </div>
      </div>
    </header>
  );
}
