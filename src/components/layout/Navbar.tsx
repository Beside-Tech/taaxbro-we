import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import logo from '../../assets/StackedLogo.png';
import { useTheme } from '../../context/ThemeContext';

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
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleHowItWorks = () => {
    setOpen(false);
    if (location.pathname === '/') {
      document
        .getElementById('how-it-works')
        ?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document
          .getElementById('how-it-works')
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  return (
    <nav
      className={`fixed py-4 top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled
          ? 'bg-white/80 dark:bg-[#111111]/90 backdrop-blur-md shadow-sm'
          : 'bg-transparent backdrop-blur-none shadow-none'
      }`}>
      <div className='layout-padding flex items-center justify-between h-16'>
        <Link to='/'>
          <img src={logo} alt='' className='h-20 w-auto' />
        </Link>

        <ul className='hidden md:flex items-center gap-8'>
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-30'
                      : 'text-dark dark:text-white hover:text-primary-30'
                  }`
                }>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

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
          <button className='bg-dark dark:bg-white text-white dark:text-dark text-sm font-medium px-5 py-2 rounded-full hover:bg-primary-40 dark:hover:bg-primary-10 transition-colors cursor-pointer'>
            Get Started
          </button>
        </div>

        <div className='md:hidden flex items-center gap-2'>
          <button
            onClick={toggle}
            aria-label='Toggle dark mode'
            className='w-9 h-9 flex items-center justify-center rounded-full text-dark dark:text-white transition-colors cursor-pointer'>
            <Icon icon={dark ? 'ph:sun' : 'ph:moon'} className='text-xl' />
          </button>
          <button
            className='text-dark dark:text-white p-1'
            onClick={() => setOpen(!open)}
            aria-label='Toggle menu'>
            <Icon icon={open ? 'mdi:close' : 'mdi:menu'} className='text-2xl' />
          </button>
        </div>
      </div>

      {open && (
        <div className='md:hidden bg-white dark:bg-[#1c1c1c] border-t border-grey-10 dark:border-white/10 layout-padding py-5 flex flex-col gap-5'>
          <ul className='flex flex-col gap-4'>
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-medium ${isActive ? 'text-primary-30' : 'text-dark dark:text-white'}`
                  }>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className='flex flex-col gap-2 pt-1 border-t border-grey-10 dark:border-white/10'>
            <button
              onClick={handleHowItWorks}
              className='border border-dark dark:border-white text-dark dark:text-white text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer'>
              How it Works
            </button>
            <button className='bg-dark dark:bg-white text-white dark:text-dark text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer'>
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
