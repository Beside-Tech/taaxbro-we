import Link from 'next/link';
import { Icon } from '@iconify/react';

export default function NotFound() {
  return (
    <section className='min-h-screen bg-white flex flex-col items-center justify-center layout-padding text-center gap-6'>
      <div className='w-16 h-16 rounded-2xl bg-primary-10 flex items-center justify-center'>
        <Icon icon='mdi:alert-circle-outline' className='text-primary-30 text-4xl' />
      </div>
      <div className='flex flex-col gap-2'>
        <h1 className='text-6xl font-bold text-dark'>404</h1>
        <h2 className='text-xl font-semibold text-dark'>Page not found</h2>
        <p className='text-grey-30 text-base max-w-sm'>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        href='/'
        className='bg-dark text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-primary-40 transition-colors'>
        Back to Home
      </Link>
    </section>
  );
}
