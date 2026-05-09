import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import logoMark from '../../assets/LogoMark.png';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/support', label: 'Support' },
  { to: '/features', label: 'Features' },
];

const socials = [
  { icon: 'mdi:instagram', href: 'https://www.instagram.com/taaxbro', label: 'Instagram' },
  { icon: 'ri:twitter-x-line', href: 'https://x.com/taaxbro', label: 'X (Twitter)' },
  { icon: 'mdi:linkedin', href: 'https://www.linkedin.com/company/taaxbro', label: 'LinkedIn' },
  { icon: 'mdi:facebook', href: 'https://facebook.com/taaxbro', label: 'Facebook' },
];

export default function Footer() {
  const [email, setEmail] = useState('');

  return (
    <footer className='bg-dark text-white'>
      <div className='layout-padding py-12'>
        {/* Main grid — 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-10'>
          {/* Brand — spans 2 cols on tablet */}
          <div className='md:col-span-2 lg:col-span-1 flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <img src={logoMark} alt='' className='h-10 w-auto self-start' />
              <span className='font-medium text-base'>Taaxbro</span>
            </div>
            <p className='text-2xl font-bold leading-snug'>
              Your Business Finances
              <br />
              Finally Under Your Control
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className='font-semibold text-base mb-4'>Quick Navigation</h4>
            <ul className='flex flex-col gap-3'>
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className='text-grey-20 hover:text-white text-sm transition-colors'>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className='font-semibold text-base mb-4'>Follow Us</h4>
            <ul className='flex flex-col gap-4'>
              {socials.map(({ icon, href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-3 text-grey-20 hover:text-white text-sm transition-colors group'>
                    <Icon icon={icon} className='text-xl shrink-0' />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className='mt-12 pt-10 border-t border-white/10'>
          <h4 className='font-semibold text-base mb-1'>Subscribe to our Newsletter</h4>
          <p className='text-grey-30 text-sm mb-4'>
            Get updates on new features and product releases
          </p>
          <div className='flex gap-2 max-w-sm'>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Your Email'
              className='flex-1 bg-transparent border border-white/20 text-white placeholder:text-grey-30 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:border-primary-20'
            />
            <button className='border border-white/60 text-white text-sm px-5 py-2.5 rounded-full hover:bg-white hover:text-dark transition-colors cursor-pointer shrink-0'>
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <p className='text-grey-30 text-sm'>2026 Taaxbro, All rights reserved</p>
          <div className='flex items-center gap-6'>
            <a
              href='#'
              className='text-grey-30 hover:text-white text-sm transition-colors flex items-center gap-1'>
              Terms of Service
              <Icon icon='mdi:arrow-top-right' className='text-sm' />
            </a>
            <a
              href='#'
              className='text-grey-30 hover:text-white text-sm transition-colors flex items-center gap-1'>
              Privacy Policy
              <Icon icon='mdi:arrow-top-right' className='text-sm' />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
