'use client';

import { useAuth } from '@/context/AuthContext';

export default function GreetingHeading() {
  const { user } = useAuth();

  const displayName = user?.full_name
    ? user.full_name.split(' ')[0]
    : user?.email?.split('@')[0] ?? 'there';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div>
      <h1 className='text-2xl font-bold text-secondary-10'>
        {greeting}, {displayName}
      </h1>
      <p className='text-sm text-secondary-30 mt-0.5'>{date}</p>
    </div>
  );
}