import TopBar from '@/components/dashboard/TopBar';

export default function SettingsPage() {
  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <div>
          <h1 className='text-2xl font-bold text-secondary-10'>Settings</h1>
          <p className='text-sm text-secondary-30 mt-0.5'>Manage your account preferences</p>
        </div>
      </TopBar>
      <main className='flex-1 p-8 flex items-center justify-center text-secondary-30 text-sm'>
        Coming soon
      </main>
    </div>
  );
}
