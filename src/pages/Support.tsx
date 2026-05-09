import { Icon } from '@iconify/react';
import taaxbroPattern from '../assets/taaxbro_pattern.png';

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
    icon: 'mdi:whatsapp',
    title: 'Chat to Sales',
    description: 'Speak to our friendly team',
    link: { label: '+2348170061600', href: 'https://wa.me/2348170061600' },
  },
];

export default function Support() {
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

      <div className='relative'>
        {/* Header */}
        <section className='pt-20 pb-8 text-center layout-padding'>
          <h6 className='font-medium text-sm mb-2'>[SUPPORT]</h6>
          <h1 className='text-2xl md:text-3xl lg:text-4xl mb-3 dark:text-white'>
            We're here. And we actually respond
          </h1>
          <p className='font-light text-base dark:text-gray-400'>
            Let us know how we can help
          </p>
        </section>

        {/* Contact Cards */}
        <section className='pb-40 layout-padding'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
            {cards.map(({ icon, title, description, link }) => (
              <div
                key={title}
                className='border border-grey-10 dark:border-white/10 rounded-2xl p-7 flex flex-col gap-8 bg-white dark:bg-[#1c1c1c]'>
                <Icon icon={icon} className='text-dark dark:text-white text-3xl' />
                <div className='flex flex-col gap-1.5'>
                  <h3 className='font-medium text-dark dark:text-white text-base'>{title}</h3>
                  <p className='text-sm dark:text-gray-400'>{description}</p>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className='text-sm underline underline-offset-2 text-dark dark:text-white hover:text-primary-30 transition-colors'>
                    {link.label}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
