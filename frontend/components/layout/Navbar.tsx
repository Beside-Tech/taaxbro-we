'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useTheme } from '@/context/ThemeContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/features', label: 'Features' },
  { to: '/support', label: 'Support' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const pathname = usePathname();
  const { dark, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const scrolled = currentY > 8;
      setIsScrolled(scrolled);
      if (!scrolled) {
        setVisible(true);
      } else if (currentY > lastScrollY.current) {
        setVisible(false);
        setOpen(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHowItWorks = () => {
    setOpen(false);
    if (pathname === '/') {
      document
        .getElementById('how-it-works')
        ?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/');
      setTimeout(() => {
        document
          .getElementById('how-it-works')
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-white/80 dark:bg-[#111111]/90 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}>
        <div className='layout-padding flex items-center justify-between h-20'>
          <Link href='/'>
            <img src='/assets/StackedLogo.png' alt='Taaxbro' className='h-20 w-auto' />
          </Link>

          {/* Desktop links */}
          <ul className='hidden md:flex items-center gap-8'>
            {navLinks.map(({ to, label }) => {
              const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    href={to}
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-30'
                        : 'text-dark dark:text-white hover:text-primary-30'
                    }`}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop CTAs */}
          <div className='hidden md:flex items-center gap-3'>
            <button
              onClick={toggle}
              aria-label='Toggle dark mode'
              className='w-9 h-9 flex items-center justify-center rounded-full text-dark dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer'>
              <Icon icon={dark ? 'ph:sun' : 'ph:moon'} className='text-xl' />
            </button>
            <button
              onClick={handleHowItWorks}
              className='border border-dark dark:border-white text-dark dark:text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-dark hover:text-white dark:hover:bg-white dark:hover:text-dark transition-colors cursor-pointer'>
              How it Works
            </button>
            <Link
              href='/register'
              className='bg-dark dark:bg-white text-white dark:text-dark text-sm font-medium px-5 py-2 rounded-full hover:bg-primary-40 dark:hover:bg-primary-10 transition-colors cursor-pointer'>
              Get Started
            </Link>
          </div>

          {/* Mobile controls */}
          <div className='md:hidden flex items-center gap-1'>
            <button
              onClick={toggle}
              aria-label='Toggle dark mode'
              className='w-9 h-9 flex items-center justify-center rounded-full text-dark dark:text-white transition-colors cursor-pointer'>
              <Icon icon={dark ? 'ph:sun' : 'ph:moon'} className='text-xl' />
            </button>
            <button
              className='w-9 h-9 flex items-center justify-center text-dark dark:text-white'
              onClick={() => setOpen(true)}
              aria-label='Open menu'>
              <Icon icon='mdi:menu' className='text-2xl' />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile menu slide panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md z-50 md:hidden transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {/* Panel header */}
        <div className='flex items-center justify-between px-5 h-20 shrink-0'>
          <img src='/assets/StackedLogo.png' alt='Taaxbro' className='h-20 w-auto' />
          <button
            onClick={() => setOpen(false)}
            aria-label='Close menu'
            className='w-9 h-9 flex items-center justify-center text-dark dark:text-white'>
            <Icon icon='mdi:close' className='text-2xl' />
          </button>
        </div>

        {/* Nav links */}
        <ul className='flex flex-col gap-1 p-4 flex-1 overflow-y-auto'>
          {navLinks.map(({ to, label }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  href={to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-10 text-primary-40'
                      : 'text-dark dark:text-white hover:bg-grey-10/50 dark:hover:bg-white/5'
                  }`}>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA buttons */}
        <div className='p-4 flex flex-col gap-2.5 border-t border-grey-10 dark:border-white/10 shrink-0'>
          <button
            onClick={handleHowItWorks}
            className='w-full border border-dark dark:border-white text-dark dark:text-white text-sm font-medium py-2.5 rounded-full cursor-pointer hover:bg-dark hover:text-white dark:hover:bg-white dark:hover:text-dark transition-colors'>
            How it Works
          </button>
          <Link
            href='/register'
            className='w-full bg-dark dark:bg-white text-white dark:text-dark text-sm font-medium py-2.5 rounded-full cursor-pointer hover:bg-primary-40 transition-colors text-center'>
            Get Started
          </Link>
        </div>
      </div>
    </>
  );
}
