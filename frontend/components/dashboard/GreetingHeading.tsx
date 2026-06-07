'use client';

export default function GreetingHeading({ name = 'Daniel' }: { name?: string }) {
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
        {greeting}, {name}
      </h1>
      <p className='text-sm text-secondary-30 mt-0.5'>{date}</p>
    </div>
  );
}
