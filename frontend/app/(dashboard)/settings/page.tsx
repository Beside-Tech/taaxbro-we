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

      <main className='flex-1 p-8'>
        <div className='mx-auto max-w-4xl space-y-8'>
          <section className='rounded-3xl border border-grey-10 bg-white p-8 shadow-sm'>
            <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-secondary-10'>WhatsApp integration</h2>
                <p className='text-sm text-secondary-30 mt-1'>Connect your WhatsApp Business number so customers can reach you directly from Taaxbro.</p>
              </div>
            </div>

            <div className='mt-8 space-y-6'>
              <div className='grid gap-4 md:grid-cols-2'>
                <label className='space-y-2 text-sm text-secondary-30'>
                  WhatsApp business number
                  <input
                    type='text'
                    placeholder='+234 800 000 0000'
                    className='w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors'
                  />
                </label>

                <label className='space-y-2 text-sm text-secondary-30'>
                  Display name
                  <input
                    type='text'
                    placeholder='Taaxbro Support'
                    className='w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm outline-none focus:border-primary-30 transition-colors'
                  />
                </label>
              </div>

              <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <button
                  type='button'
                  className='inline-flex items-center justify-center rounded-full bg-primary-30 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-40 transition-colors'>
                  Connect WhatsApp
                </button>
                <p className='text-sm text-secondary-30 max-w-2xl'>
                  Once connected, Taaxbro can send WhatsApp messages for onboarding, login, and support. You can also configure message templates in the WhatsApp flows section.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
