import featuresHero from '../assets/features-hero2.png';
import btbTransfer from '../assets/btbtransfer.svg';
import multiAcct from '../assets/multiacct.svg';
import paymentLink from '../assets/payment-link.svg';
import autoBankImport from '../assets/autobankimport.jpg';
import transactionHistory from '../assets/transactionhistory.svg';
import rtProfitLoss from '../assets/rtprofitloss.svg';
import professionalInvoicing from '../assets/professionalinvoicing.svg';
import expenseTracking from '../assets/expensetracting.svg';
import exportNShare from '../assets/exportndshare.svg';

const payFeatures = [
  {
    icon: multiAcct,
    title: 'Multi-account reconciliation',
    description:
      'Bank, POS, fintech wallet — all consolidated and matched to your invoices and payments automatically.',
    rounded: false,
  },
  {
    icon: paymentLink,
    title: 'Payment links',
    description:
      'Create a shareable link in seconds. Send via WhatsApp, email, or SMS. Recorded in your books the moment a customer pays.',
    rounded: false,
  },
  {
    icon: autoBankImport,
    title: 'Automatic bank import',
    description:
      'Connect your bank once. Taaxbro syncs your full transaction history daily across every connected account.',
    rounded: true,
  },
  {
    icon: transactionHistory,
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
    icon: rtProfitLoss,
    title: 'Real-time profit & loss',
    description:
      'A live P&L updated with every transaction. Your financial position, always visible — no waiting for month-end, no manual totalling.',
  },
  {
    icon: professionalInvoicing,
    title: 'Professional Invoicing',
    description:
      'Create, send, and track professional invoices in seconds. Auto-recorded the moment a client pays.',
  },
  {
    icon: expenseTracking,
    title: 'Expense tracking',
    description:
      'Every expense categorised and logged automatically — no chasing receipts, no manual entries.',
  },
  {
    icon: exportNShare,
    title: 'Export & Share',
    description:
      'Download or share your reports in any format — ready for your accountant, investor, or tax filing.',
  },
];

export default function Features() {
  return (
    <>
      {/* Hero */}
      <section className='pt-4 pb-12 text-center layout-padding'>
        <h6 className='font-medium mb-2'>[FEATURES]</h6>
        <h1 className='text-3xl sm:text-4xl lg:text-5xl mb-4'>
          Every tool your business finances need.{' '}
          <br className='hidden sm:block' />
          All working together
        </h1>
        <p className='text-base font-light max-w-2xl mx-auto mb-6'>
          Taaxbro isn't three apps sharing a login. It's one AI-powered system
          — so your payments inform your books, your books inform your taxes,
          and your taxes file themselves.
        </p>

        <div className='flex items-center justify-center gap-2 flex-wrap mb-8'>
          {['Taaxbro Tax', 'Taaxbro Pay', 'Taaxbro Books'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(' ', '-')}`}
              className='border border-dark text-dark px-5 py-2 rounded-full text-sm hover:bg-dark hover:text-white transition-colors'>
              {label}
            </a>
          ))}
        </div>

        <div className='rounded-2xl overflow-hidden'>
          <img
            src={featuresHero}
            alt='Taaxbro features — business owners using the platform'
            className='w-full object-cover'
          />
        </div>
      </section>

      {/* Taaxbro Pay */}
      <section id='taaxbro-pay' className='py-16 layout-padding'>
        <h6 className='font-medium mb-2'>[TAAXBRO PAY]</h6>
        <h2 className='text-3xl sm:text-4xl mb-8'>
          Business payments that <br className='hidden sm:block' />
          reconcile themselves
        </h2>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Dark featured card */}
          <div className='bg-dark text-white rounded-2xl p-6 flex flex-col justify-between min-h-72'>
            <div className='flex flex-col gap-4'>
              <div className='w-10 h-10'>
                <img
                  src={btbTransfer}
                  alt=''
                  className='w-full h-full object-contain'
                />
              </div>
              <div>
                <h3 className='text-xl font-medium mb-3'>
                  Bank-to-bank transfers
                </h3>
                <p className='text-sm font-light text-white/80 leading-relaxed'>
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

          {/* 2×2 grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {payFeatures.map(({ icon, title, description, rounded }) => (
              <div
                key={title}
                className='bg-white border border-grey-10 rounded-2xl p-4 flex flex-col gap-3'>
                <img
                  src={icon}
                  alt={title}
                  className={`w-10 h-10 object-contain ${rounded ? 'rounded-lg' : ''}`}
                />
                <div>
                  <h4 className='font-medium text-sm mb-1'>{title}</h4>
                  <p className='text-xs font-light text-grey-30'>
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
          <h6 className='font-medium mb-2 text-white/50'>[TAAXBRO TAX]</h6>
          <h2 className='text-3xl sm:text-4xl mb-12'>
            Built for Nigerian Compliance.
          </h2>

          <div className='border-t border-white/20 grid grid-cols-1 sm:grid-cols-2'>
            {taxFeatures.map(({ num, title, description }) => (
              <div
                key={num}
                className='border-b border-white/20 py-8 flex gap-4 items-start'>
                <h6 className='font-medium text-white/50 shrink-0'>[{num}]</h6>
                <div>
                  <h4 className='text-base font-medium mb-1'>{title}</h4>
                  <p className='text-sm font-light text-white/70'>
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
        <h6 className='font-medium mb-2'>[TAAXBRO BOOKS]</h6>
        <h2 className='text-3xl sm:text-4xl mb-8'>
          Bookkeeping without the <br className='hidden sm:block' />
          bookkeeper
        </h2>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          {booksFeatures.map(({ icon, title, description }) => (
            <div
              key={title}
              className='bg-white border border-grey-10 rounded-2xl p-6 flex flex-col gap-4'>
              <img
                src={icon}
                alt={title}
                className='w-10 h-10 object-contain'
              />
              <div>
                <h4 className='font-medium text-base mb-1'>{title}</h4>
                <p className='text-sm font-light'>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
