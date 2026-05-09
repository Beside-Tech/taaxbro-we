import { Icon } from '@iconify/react';
import taaxbroPattern from '../assets/taaxbro_pattern.png';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

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

export default function Support() {
  const ref = useScrollAnimation();

  return (
    <>
      {/* Full-page pattern background */}
      <div
        className='fixed inset-0 -z-10'
        style={{
          backgroundImage: `url(${taaxbroPattern})`,
          backgroundSize: '1200px auto',
          backgroundRepeat: 'repeat',
        }}>
        <div className='absolute inset-0 bg-white/95 dark:bg-[#111111]/95' />
      </div>

      <div ref={ref} className='relative'>
        {/* Header */}
        <section data-anim className='pt-20 pb-8 text-center layout-padding'>
          <h6 className='font-medium text-sm mb-2'>[SUPPORT]</h6>
          <h1 className='text-2xl md:text-3xl lg:text-4xl mb-3 dark:text-white'>
            We're here. And we actually respond
          </h1>
          <p className='font-light text-base dark:text-white'>
            Let us know how we can help
          </p>
        </section>

        {/* Contact Cards */}
        <section className='pb-40 layout-padding'>
          <div data-anim-group className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            {cards.map(({ icon, title, description, link }) => (
              <div
                key={title}
                data-anim-item
                className='border border-grey-10 dark:border-white/10 rounded-2xl px-7 py-5 flex flex-col gap-6 bg-white dark:bg-[#1c1c1c]'>
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
      </div>
    </>
  );
}
