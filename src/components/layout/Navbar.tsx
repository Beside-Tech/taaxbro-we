import { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import logo from '../../assets/StackedLogo.png';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/features', label: 'Features' },
  { to: '/support', label: 'Support' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    <nav>
      <div className='layout-padding flex items-center justify-between h-16 pt-7'>
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
                      : 'text-dark hover:text-primary-30'
                  }`
                }>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className='hidden md:flex items-center gap-3'>
          <button
            onClick={handleHowItWorks}
            className='border border-dark text-dark text-sm font-medium px-5 py-2 rounded-full hover:bg-dark hover:text-white transition-colors cursor-pointer'>
            How it Works
          </button>
          <button className='bg-dark text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-primary-40 transition-colors cursor-pointer'>
            Get Started
          </button>
        </div>

        <button
          className='md:hidden text-dark p-1'
          onClick={() => setOpen(!open)}
          aria-label='Toggle menu'>
          <Icon icon={open ? 'mdi:close' : 'mdi:menu'} className='text-2xl' />
        </button>
      </div>

      {open && (
        <div className='md:hidden bg-white border-t border-grey-10 layout-padding py-5 flex flex-col gap-5'>
          <ul className='flex flex-col gap-4'>
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `text-sm font-medium ${isActive ? 'text-primary-30' : 'text-dark'}`
                  }>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className='flex flex-col gap-2 pt-1 border-t border-grey-10'>
            <button
              onClick={handleHowItWorks}
              className='border border-dark text-dark text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer'>
              How it Works
            </button>
            <button className='bg-dark text-white text-sm font-medium px-5 py-2.5 rounded-full cursor-pointer'>
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
