'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  {
    label: 'Overview',
    href: '/overview',
    icon: 'si:dashboard-duotone',
    iconFill: 'si:dashboard-fill',
  },
  {
    label: 'Pay',
    href: '/pay',
    icon: 'solar:card-broken',
    iconFill: 'solar:card-bold',
  },
  {
    label: 'Tax',
    href: '/tax',
    icon: 'heroicons-outline:receipt-tax',
    iconFill: 'heroicons-solid:receipt-tax',
  },
  {
    label: 'Books',
    href: '/books',
    icon: 'solar:book-broken',
    iconFill: 'solar:book-bold',
  },
  {
    label: 'Reminders',
    href: '/reminders',
    icon: 'solar:bell-bing-broken',
    iconFill: 'solar:bell-bing-bold',
  },
];

const bottomItems = [
  {
    label: 'Settings',
    href: '/settings',
    icon: 'ph:gear',
    iconFill: 'ph:gear-fill',
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    onClose?.();
    try {
      await logout();
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen w-56 bg-white border-r border-r-secondary-40 flex flex-col py-6 px-4 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <Link href='/overview' className='flex items-center mb-10 px-2' onClick={() => onClose?.()}>
        <img src='/assets/StackedLogo.png' alt='Taaxbro' className='h-16 w-auto' />
      </Link>

      <nav className='flex flex-col gap-1 flex-1'>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-40 text-white'
                  : 'text-secondary-20 hover:bg-primary-50'
              }`}>
              <Icon
                icon={isActive ? item.iconFill : item.icon}
                className='text-[1.2rem] shrink-0'
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className='flex flex-col gap-1'>
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-30 text-white'
                  : 'text-secondary-20 hover:bg-primary-50'
              }`}>
              <Icon
                icon={isActive ? item.iconFill : item.icon}
                className='text-[1.2rem] shrink-0'
              />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className='flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-secondary-20 hover:bg-primary-50 text-left'>
          <Icon
            icon='ph:sign-out'
            className='text-[1.2rem] shrink-0'
          />
          Logout
        </button>
      </div>
    </aside>
  );
}
