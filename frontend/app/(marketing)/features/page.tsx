'use client';

import gsap from 'gsap';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const payFeatures = [
  {
    icon: '/assets/multiacct.svg',
    title: 'Multi-account reconciliation',
    description:
      'Bank, POS, fintech wallet — all consolidated and matched to your invoices and payments automatically.',
    rounded: false,
  },
  {
    icon: '/assets/payment-link.svg',
    title: 'Payment links',
    description:
      'Create a shareable link in seconds. Send via WhatsApp, email, or SMS. Recorded in your books the moment a customer pays.',
    rounded: false,
  },
  {
    icon: '/assets/autobankimport.jpg',
    title: 'Automatic bank import',
    description:
      'Connect your bank once. Taaxbro syncs your full transaction history daily across every connected account.',
    rounded: true,
  },
  {
    icon: '/assets/transactionhistory.svg',
    title: 'Transaction history & export',
    description:
      'Search and filter every payment. Export your full history at any time, in any format you need.',
    rounded: false,
  },
];

const taxFeatures = [
  {
    num: '1',
    title: 'VAT Automation',
    description:
      'Input VAT, output VAT, and your net position — computed from real data',
  },
  {
    num: '2',
    title: 'Direct FIRS filing',
    description: 'Review, approve, submit. Confirmation sent to you instantly.',
  },
  {
    num: '3',
    title: 'Deadline Reminders',
    description:
      'Every due date in one view. Alerts via email, app, and Whatsapp',
  },
  {
    num: '4',
    title: 'AI tax assistant',
    description:
      'Ask anything in plain English or Pidgin. Answers based on your actual data',
  },
];

const booksFeatures = [
  {
    icon: '/assets/rtprofitloss.svg',
    title: 'Real-time profit & loss',
    description:
      'A live P&L updated with every transaction. Your financial position, always visible — no waiting for month-end, no manual totalling.',
  },
  {
    icon: '/assets/professionalinvoicing.svg',
    title: 'Professional Invoicing',
    description:
      'Create, send, and track professional invoices in seconds. Auto-recorded the moment a client pays.',
  },
  {
    icon: '/assets/expensetracting.svg',
    title: 'Expense tracking',
    description:
      'Every expense categorised and logged automatically — no chasing receipts, no manual entries.',
  },
  {
    icon: '/assets/exportndshare.svg',
    title: 'Export & Share',
    description:
      'Download or share your reports in any format — ready for your accountant, investor, or tax filing.',
  },
];

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.to(e.currentTarget, { y: -6, duration: 0.3, ease: 'power2.out' });
  const icon = e.currentTarget.querySelector<HTMLElement>('.card-icon');
  if (icon) gsap.to(icon, { scale: 1.15, duration: 0.3, ease: 'power2.out' });
}

function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.to(e.currentTarget, { y: 0, duration: 0.35, ease: 'power2.inOut' });
  const icon = e.currentTarget.querySelector<HTMLElement>('.card-icon');
  if (icon) gsap.to(icon, { scale: 1, duration: 0.35, ease: 'power2.inOut' });
}

export default function Features() {
  const ref = useScrollAnimation();

  return (
    <div ref={ref}>
      {/* Hero */}
      <section className='mt-18 pb-12 text-center layout-padding'>
        <div data-anim>
          <h6 className='font-medium mb-2'>[FEATURES]</h6>
          <h1 className='text-2xl md:text-4xl lg:text-5xl mb-4 dark:text-white'>
            Every tool your business finances need.{' '}
            <br className='hidden sm:block' />
            All working together
          </h1>
          <p className='text-sm md:text-base font-light max-w-2xl mx-auto mb-6 dark:text-white'>
            Taaxbro isn't three apps sharing a login. It's one AI-powered system
            — so your payments inform your books, your books inform your taxes,
            and your taxes file themselves.
          </p>

          <div className='flex items-center justify-center gap-2 flex-wrap mb-8'>
            {['Taaxbro Tax', 'Taaxbro Pay', 'Taaxbro Books'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(' ', '-')}`}
                className='border border-dark dark:border-white text-dark dark:text-white px-5 py-2 rounded-full text-sm hover:bg-dark hover:text-white dark:hover:bg-white dark:hover:text-dark transition-colors'>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div data-anim className='rounded-2xl overflow-hidden'>
          <img
            src='/assets/features-hero2.png'
            alt='Taaxbro features — business owners using the platform'
            className='aspect-[1.7/1] md:aspect-auto w-full object-cover border border-[#8979FF]/30 rounded-2xl'
          />
        </div>
      </section>

      {/* Taaxbro Pay */}
      <section id='taaxbro-pay' className='py-16 layout-padding'>
        <div data-anim>
          <h6 className='font-medium mb-2'>[TAAXBRO PAY]</h6>
          <h2 className='text-2xl md:text-4xl mb-8 dark:text-white'>
            Business payments that <br className='hidden sm:block' />
            reconcile themselves
          </h2>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4'>
          <div
            data-anim
            onMouseEnter={onCardEnter}
            onMouseLeave={onCardLeave}
            className='bg-dark dark:bg-primary-40 text-white rounded-2xl p-6 flex flex-col justify-between min-h-72 cursor-default'>
            <div className='flex flex-col gap-4'>
              <div className='w-10 h-10'>
                <img
                  src='/assets/btbtransfer.svg'
                  alt=''
                  className='card-icon w-full h-full object-contain'
                />
              </div>
              <div>
                <h3 className='font-medium mb-2'>Bank-to-bank transfers</h3>
                <p className='text-xs md:text-sm font-light text-white'>
                  Taaxbro isn't three apps sharing a login. It's one AI-powered
                  system — so your payments inform your books, your books inform
                  your taxes, and your taxes file themselves.
                </p>
              </div>
            </div>
            <button className='mt-8 self-start border border-white/60 text-white px-6 py-2.5 rounded-full text-sm hover:bg-white hover:text-dark transition-colors cursor-pointer'>
              Open an Account
            </button>
          </div>

          <div
            data-anim-group
            className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {payFeatures.map(({ icon, title, description, rounded }) => (
              <div
                key={title}
                data-anim-item
                onMouseEnter={onCardEnter}
                onMouseLeave={onCardLeave}
                className='bg-white dark:bg-[#1c1c1c] border border-grey-10 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3 cursor-default'>
                <img
                  src={icon}
                  alt={title}
                  className={`card-icon w-10 h-10 mb-4 object-contain ${rounded ? 'rounded-lg' : ''}`}
                />
                <div>
                  <h4 className='font-medium mb-1 dark:text-white'>{title}</h4>
                  <p className='text-xs md:text-sm font-light dark:text-white'>
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Taaxbro Tax */}
      <section id='taaxbro-tax' className='bg-dark text-white py-16'>
        <div className='layout-padding'>
          <div data-anim>
            <h6 className='font-medium mb-2 text-white'>[TAAXBRO TAX]</h6>
            <h2 className='text-2xl md:text-4xl mb-12'>
              Built for Nigerian Compliance.
            </h2>
          </div>
          <div
            data-anim-group
            className='border-t border-white/20 grid grid-cols-1 sm:grid-cols-2'>
            {taxFeatures.map(({ num, title, description }) => (
              <div
                key={num}
                data-anim-item
                className='border-b border-white/20 py-8 flex gap-4 items-start'>
                <h6 className='font-medium'>[{num}]</h6>
                <div>
                  <h4 className='text-base font-medium mb-1'>{title}</h4>
                  <p className='text-xs md:text-sm font-light text-white'>
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Taaxbro Books */}
      <section id='taaxbro-books' className='py-16 layout-padding'>
        <div data-anim>
          <h6 className='font-medium mb-2'>[TAAXBRO BOOKS]</h6>
          <h2 className='text-2xl md:text-4xl mb-8 dark:text-white'>
            Bookkeeping without the <br className='hidden sm:block' />
            bookkeeper
          </h2>
        </div>
        <div data-anim-group className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          {booksFeatures.map(({ icon, title, description }) => (
            <div
              key={title}
              data-anim-item
              onMouseEnter={onCardEnter}
              onMouseLeave={onCardLeave}
              className='bg-white dark:bg-[#1c1c1c] border border-grey-10 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-4 cursor-default'>
              <img
                src={icon}
                alt={title}
                className='card-icon w-10 h-10 mb-4 object-contain'
              />
              <div>
                <h4 className='font-medium mb-1 dark:text-white'>{title}</h4>
                <p className='text-xs md:text-sm font-light dark:text-white'>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
