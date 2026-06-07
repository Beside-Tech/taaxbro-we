import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] min-h-screen'>
      <div className='flex flex-col px-8 sm:px-12 md:px-16 py-6'>
        <Link href='/'>
          <img
            src='/assets/StackedLogo.png'
            alt='Taaxbro'
            className='h-14 w-auto mx-auto lg:mx-0'
          />
        </Link>
        <div className='flex-1 flex flex-col justify-center w-full max-w-md mx-auto lg:mx-0 lg:ml-12 xl:ml-16 pt-14 pb-24'>
          {children}
        </div>
        <p className='w-full max-w-md mx-auto lg:mx-0 lg:ml-12 xl:ml-16 text-center text-xs text-secondary-30 pb-2'>
          2026 Taaxbro All rights reserved
        </p>
      </div>

      <div className='hidden lg:flex p-4 sticky top-0 h-screen overflow-hidden'>
        <img
          src='/assets/authimage.png'
          alt=''
          className='w-full h-full object-cover rounded-3xl'
        />
      </div>
    </div>
  );
}
