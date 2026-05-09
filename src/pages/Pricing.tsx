import { Icon } from '@iconify/react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    priceLabel: null,
    description:
      'For sole operators and micro-businesses just getting started.',
    features: [
      'Up to 5 invoices per month',
      'Manual expense tracking',
      'Tax deadline reminders and calendar',
      'Basic financial summary view',
      'Email support',
    ],
    cta: 'Try for Free',
    ctaStyle: 'outline',
    highlight: false,
    badge: null,
  },
  {
    name: 'Growth',
    price: '₦8,500',
    priceLabel: '/month',
    description:
      'For active businesses that want full automation and AI-powered tax compliance.',
    features: [
      'Unlimited Invoicing',
      'Automatic bank transaction import and reconciliation',
      'AI-powered VAT and WHT auto computation',
      'Direct FIRS filing',
      'Profit & Loss and Balance Sheet reports',
      'AI Tax Assistant — ask any tax question, get an instant answer',
      'WhatsApp integration for payments and deadline alerts',
    ],
    cta: 'Get Started',
    ctaStyle: 'filled',
    highlight: true,
    badge: 'Recommended for You',
  },
  {
    name: 'Business',
    price: '₦19,500',
    priceLabel: '/month',
    description:
      'For scaling businesses with a team and complex compliance needs.',
    features: [
      'Everything in Growth',
      'Up to 5 user seats with role-based access (Admin, Accountant, Viewer)',
      'Company Income Tax (CIT) computation and direct filing',
      'Payroll processing with automated PAYE deduction',
      'Custom report exports',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    ctaStyle: 'outline',
    highlight: false,
    badge: null,
  },
];

export default function Pricing() {
  return (
    <>
      {/*  Header  */}
      <section className='pt-4 pb-8 text-center layout-padding'>
        <h6 className='font-medium mb-2'>[PRICING]</h6>
        <h1 className='text-3xl sm:text-4xl lg:text-5xl mb-2'>
          Flexible Pricing for Every Need
        </h1>
        <p className='text-base font-light mx-auto'>
          Choose the plan that fits your business — upgrade or downgrade
          anytime.
        </p>
      </section>

      {/*  Plans  */}
      <section className=' py-12 pb-28'>
        <div className='layout-padding'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-center'>
            {plans.map(
              ({
                name,
                price,
                priceLabel,
                description,
                features,
                cta,
                ctaStyle,
                highlight,
                badge,
              }) => (
                <div
                  key={name}
                  className={`relative rounded-2xl p-4 flex flex-col gap-6 ${
                    highlight
                      ? 'border-2 border-primary-30 shadow-lg shadow-primary-10'
                      : 'border border-grey-10'
                  } bg-white`}>
                  {badge && (
                    <span className='absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-30 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap'>
                      {badge}
                    </span>
                  )}

                  <div className='flex flex-col gap-1'>
                    <h2 className='text-2xl font-medium text-dark'>{name}</h2>
                    <p className=' text-sm font-light'>{description}</p>
                  </div>

                  <div className='border-t border-grey-10 pt-6'>
                    <div className='flex items-end gap-1'>
                      <span className='text-4xl font-medium'>{price}</span>
                      {priceLabel && (
                        <span className='text-grey-30 text-sm mb-1'>
                          {priceLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className='text-sm font-semibold mb-2'>
                      What's included:
                    </p>
                    <ul className='flex flex-col gap-3'>
                      {features.map((f) => (
                        <li
                          key={f}
                          className='flex items-start gap-1.5 text-[#4D4A4A]'>
                          <Icon
                            icon='mdi:check'
                            className=' text-lg shrink-0 mt-0.5'
                          />
                          <span className='text-sm'>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className='mt-auto pt-4'>
                    <button
                      className={`w-full py-3 rounded-full hover:font-semibold transition-colors cursor-pointer ${
                        ctaStyle === 'filled'
                          ? 'bg-dark text-white hover:bg-primary-40'
                          : 'border border-dark text-dark hover:bg-dark hover:text-white'
                      }`}>
                      {cta}
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </>
  );
}
