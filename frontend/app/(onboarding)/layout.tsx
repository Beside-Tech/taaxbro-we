export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className='relative min-h-screen flex items-center justify-center p-6 overflow-hidden'
      style={{ backgroundColor: '#f3eeff', backgroundImage: 'url(/assets/taaxbro_pattern.png)', backgroundRepeat: 'repeat', backgroundSize: '320px' }}>

      {/* Soft radial glow behind the card */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255,255,255,0.6) 0%, transparent 80%)',
        }}
      />

      {/* Content */}
      <div className='relative z-10 w-full'>
        {children}
      </div>
    </div>
  );
}
