'use client';

import { useState } from 'react';
import gsap from 'gsap';
import { Icon } from '@iconify/react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const cards = [
  {
    icon: 'ph:envelope',
    title: 'Email Us',
    description: 'Send a mail to our support team',
    link: { label: 'support@taaxbro.com', href: 'mailto:support@taaxbro.com' },
  },
  {
    icon: 'ri:twitter-x-line',
    title: 'X (Twitter)',
    description: 'Message us on X',
    link: { label: '@taaxbro', href: 'https://x.com/taaxbro' },
  },
  {
    icon: 'mdi:instagram',
    title: 'Instagram',
    description: 'Reach us on Instagram',
    link: { label: '@taaxbro', href: 'https://www.instagram.com/taaxbro' },
  },
  {
    icon: 'mdi:linkedin',
    title: 'LinkedIn',
    description: 'Connect with us on LinkedIn',
    link: { label: '@taaxbro', href: 'https://www.linkedin.com/company/taaxbro' },
  },
];

const faqs = [
  {
    q: 'What banks are currently supported for automatic import?',
    a: 'Taaxbro currently supports GTBank, Access Bank, Zenith Bank, UBA, First Bank, and major fintechs including Opay, Kuda, and PalmPay. More banks are added regularly.',
  },
  {
    q: 'How does VAT automation work?',
    a: 'Taaxbro tracks every sale and purchase, computes your input and output VAT in real time, and prepares your VAT return for review. When ready, you approve and submit directly to FIRS with one click.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'Yes. All data is encrypted at rest and in transit using bank-grade AES-256 encryption. We are SOC 2 compliant and never share your data with third parties.',
  },
  {
    q: 'Can I manage multiple businesses from one account?',
    a: 'Absolutely. You can manage multiple business profiles under one login, each with its own transactions, invoices, and tax filings.',
  },
  {
    q: 'What happens if I miss a tax deadline?',
    a: "Taaxbro sends reminders via email, app notification, and WhatsApp well before every deadline — so you're never caught off guard.",
  },
  {
    q: 'Do I need an accountant to use Taaxbro?',
    a: 'No. Taaxbro is built for business owners, not accountants. Everything is in plain language, and the AI assistant can answer any question about your finances.',
  },
];

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.to(e.currentTarget, { y: -6, duration: 0.3, ease: 'power2.out' });
}

function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.to(e.currentTarget, { y: 0, duration: 0.35, ease: 'power2.inOut' });
}

export default function Support() {
  const ref = useScrollAnimation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div
        className='fixed inset-0 -z-10'
        style={{
          backgroundImage: `url(/assets/taaxbro_pattern.png)`,
          backgroundSize: '1200px auto',
          backgroundRepeat: 'repeat',
        }}>
        <div className='absolute inset-0 bg-white/95 dark:bg-[#111111]/95' />
      </div>

      <div ref={ref} className='relative'>
        <section data-anim className='pt-20 pb-8 text-center layout-padding'>
          <h6 className='font-medium text-sm mb-2'>[SUPPORT]</h6>
          <h1 className='text-2xl md:text-3xl lg:text-4xl mb-3 dark:text-white'>
            We're here. And we actually respond
          </h1>
          <p className='font-light text-base dark:text-white'>
            Let us know how we can help
          </p>
        </section>

        <section className='pb-16 layout-padding'>
          <div data-anim-group className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            {cards.map(({ icon, title, description, link }) => (
              <div
                key={title}
                data-anim-item
                onMouseEnter={onCardEnter}
                onMouseLeave={onCardLeave}
                className='border border-grey-10 dark:border-white/10 rounded-2xl px-7 py-5 flex flex-col gap-6 bg-white dark:bg-[#1c1c1c] cursor-default'>
                <Icon icon={icon} className='text-dark dark:text-white text-3xl' />
                <div className='flex flex-col gap-1.5'>
                  <h3 className='font-medium text-dark dark:text-white text-base'>{title}</h3>
                  <p className='text-sm dark:text-white'>{description}</p>
                  <div>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className='text-sm text-dark dark:text-white hover:text-primary-30 transition-colors'>
                      <span className='border-b border-current pb-px'>{link.label}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className='pb-32 layout-padding'>
          <div data-anim className='mb-8'>
            <h6 className='font-medium text-sm mb-2'>[FAQ]</h6>
            <h2 className='text-2xl md:text-3xl dark:text-white'>Frequently Asked Questions</h2>
          </div>

          <div data-anim-group className='flex flex-col divide-y divide-grey-10 dark:divide-white/10 border-t border-grey-10 dark:border-white/10'>
            {faqs.map(({ q, a }, i) => (
              <div key={i} data-anim-item>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className='w-full flex items-center justify-between py-5 text-left gap-4 cursor-pointer'>
                  <span className='font-medium text-sm md:text-base dark:text-white'>{q}</span>
                  <Icon
                    icon='mdi:chevron-down'
                    className={`text-xl shrink-0 text-dark dark:text-white transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                  <p className='pb-5 text-sm font-light dark:text-white leading-relaxed'>{a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
