import gsap from 'gsap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { Icon } from '@iconify/react';
import 'swiper/css';
import 'swiper/css/navigation';

import { useScrollAnimation } from '../hooks/useScrollAnimation';
import heroImage from '../assets/hero-image.svg';
import heroImage2 from '../assets/hero-image.png';
import opCard1 from '../assets/financial-opcard1.svg';
import opCard2 from '../assets/financial-opcard2.svg';
import opCard3 from '../assets/financial-opcard3.svg';
import testimonyImg from '../assets/testimonyimg.JPG';
import testimonialImg from '../assets/testimonialimg.png';
import howItWorksImg from '../assets/how-it-works.png';
import taaxbroPattern from '../assets/taaxbro_pattern.png';

const coreOps = [
  {
    icon: 'fluent:notebook-sync-20-regular',
    title: 'Automated Reconciliation',
    description:
      'Every bank transaction is imported, matched to invoices, and recorded without manual work.',
    image: opCard1,
  },
  {
    icon: 'stash:invoice',
    title: 'Smarter Business Accounting',
    description:
      'Send invoices, manage your books, and access real-time Profit & Loss and Balance Sheet reports from one system.',
    image: opCard2,
  },
  {
    icon: 'si:ai-note-line',
    title: 'AI-Powered Tax Operations',
    description:
      'From VAT calculations to deadline tracking and FIRS submissions, manage your entire tax workflow automatically.',
    image: opCard3,
  },
];

const steps = [
  {
    num: '1',
    title: 'Connect your accounts',
    description:
      'Link your bank, POS terminal, or existing accounting tool. Taaxbro pulls in your full transaction history automatically.',
  },
  {
    num: '2',
    title: 'AI organizes everything',
    description:
      'Our AI engine categorizes your income and expenses, computes your VAT and WHT positions, and surfaces anything that needs your attention — before it becomes a problem.',
  },
  {
    num: '3',
    title: 'Review and approve',
    description:
      "Check your dashboard. See your tax position, outstanding invoices, and cash flow at a glance. Approve what's ready.",
  },
  {
    num: '4',
    title: 'File and move on',
    description:
      'One click. Taaxbro files your return directly with FIRS. Confirmation delivered. Deadline met. Back to running your business.',
  },
];

const testimonials = [
  {
    quote:
      'We were paying our accountant ₦180,000 a month for bookkeeping and tax filings. Taaxbro handles all of that. It costs us less per year than we were paying per month.',
    name: 'Adaeze Nwosu',
    role: 'Founder, Lagos',
  },
  {
    quote:
      'I was always worried I was overpaying or underpaying VAT. Taaxbro tracks every sale and tells me exactly what I owe. That peace of mind alone is worth the subscription.',
    name: 'Babatunde Akinsanya',
    role: 'Business Owner, Ibadan',
  },
  {
    quote:
      "I used to spend two full days every quarter on my VAT return. With Taaxbro, I reviewed and filed it in 20 minutes. I didn't realise how much time I was losing until I stopped losing it.",
    name: 'Chidi Okafor',
    role: 'CEO, Abuja',
  },
];

const carouselTestimonials = [...testimonials, ...testimonials];

function onCardEnter(e: React.MouseEvent<HTMLDivElement>) {
  gsap.to(e.currentTarget, { y: -6, duration: 0.3, ease: 'power2.out' });
}

function onCardLeave(e: React.MouseEvent<HTMLDivElement>) {
  gsap.to(e.currentTarget, { y: 0, duration: 0.35, ease: 'power2.inOut' });
}

export default function Home() {
  const ref = useScrollAnimation();

  return (
    <div ref={ref}>
      {/* Hero */}
      <section className='mt-18 pl-[5%] pr-[5%] lg:pl-[8%] lg:pr-0 xl:pl-[10%] xxl:pl-[15%] xxl:pr-[15%] xxxl:pl-[22%] xxxl:pr-[22%] grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center'>
        <div
          data-anim
          className='flex flex-col gap-4 max-w-xl mx-auto lg:mx-0 text-center lg:text-left'>
          <h1 className='text-3xl md:text-4xl xl:text-5xl dark:text-white'>
            Your Business Finances, <br />
            Finally Under Control
          </h1>
          <p className='font-light text-sm md:text-base xl:text-lg dark:text-white'>
            Payments, tax compliance, and bookkeeping — powered by AI, built for
            Nigerian businesses. One platform. Zero spreadsheets.
          </p>
          <div className='flex items-center gap-2 flex-wrap mx-auto lg:mx-0'>
            <button className='bg-dark dark:bg-white text-white dark:text-dark text-sm px-4 py-2 md:px-6 md:py-3 rounded-full hover:bg-primary-40 transition-colors cursor-pointer'>
              Try for Free
            </button>
            <button
              onClick={() =>
                document
                  .getElementById('how-it-works')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className='border border-dark dark:border-white text-dark dark:text-white text-sm px-4 py-2 md:px-6 md:py-3 rounded-full hover:bg-dark hover:text-white dark:hover:bg-white dark:hover:text-dark transition-colors cursor-pointer'>
              How it Works
            </button>
          </div>
        </div>

        <div
          data-anim
          className='flex justify-center lg:justify-end xxl:justify-center'>
          <img
            src={heroImage}
            alt='Taaxbro dashboard'
            className='hero-svg hidden lg:block xxl:hidden w-full object-contain'
          />
          <img
            src={heroImage2}
            alt='Taaxbro dashboard'
            className='block lg:hidden xxl:block w-full max-w-sm md:max-w-lg xxl:max-w-full object-contain rounded-2xl border border-grey-20 dark:border-white/10'
          />
        </div>
      </section>

      {/* Core Operations */}
      <section className='py-20 lg:py-28'>
        <div className='layout-padding'>
          <div data-anim className='text-center max-w-xl mx-auto mb-14'>
            <h2 className='text-2xl md:text-4xl mb-4 dark:text-white'>
              Three core financial operations. One seamless system.
            </h2>
            <p className='font-light text-sm md:text-lg dark:text-white'>
              Payments, tax compliance, and bookkeeping — not bolted together,
              but built as one intelligent system.
            </p>
          </div>

          <div
            data-anim-group
            className='grid grid-cols-1 max-w-90 lg:max-w-full mx-auto lg:grid-cols-3 gap-6 xl:gap-8'>
            {coreOps.map(({ icon, title, description, image }) => (
              <div
                key={title}
                data-anim-item
                onMouseEnter={onCardEnter}
                onMouseLeave={onCardLeave}
                className='bg-white dark:bg-[#1c1c1c] border border-grey-10 dark:border-white/10 rounded-2xl flex flex-col justify-between cursor-default'>
                <div className='p-4 flex flex-col gap-3 text-center justify-center'>
                  <div className='flex justify-center items-center'>
                    <Icon
                      icon={icon}
                      className='text-3xl xl:text-4xl dark:text-white'
                    />
                  </div>
                  <div>
                    <h3 className='font-medium text-base lg:text-lg dark:text-white'>
                      {title}
                    </h3>
                    <p className='text-xs md:text-sm font-light dark:text-white'>
                      {description}
                    </p>
                  </div>
                </div>
                <div className='px-4'>
                  <img
                    src={image}
                    alt={title}
                    className='w-full rounded-t-xl object-cover'
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='layout-padding'>
        <div
          data-anim
          className='flex flex-col lg:flex-row justify-between items-center mb-8'>
          <div className='max-w-full lg:max-w-[40%] text-center lg:text-left'>
            <h6 className='font-medium text-sm mb-1'>[HOW IT WORKS]</h6>
            <h2 className='text-2xl md:text-3xl xl:text-4xl lg:whitespace-nowrap dark:text-white'>
              Taxes sorted. No experts required
            </h2>
          </div>
          <p className='font-light text-sm max-w-full lg:max-w-[38%] text-center lg:text-left dark:text-white'>
            No accountant. No spreadsheets. No chasing receipts. Just connect
            your accounts and we take care of the rest — built for business
            owners who have better things to do.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
          <div data-anim className='mx-auto'>
            <img
              src={howItWorksImg}
              alt='Business owner using Taaxbro'
              className='xxl:max-w-130 rounded-3xl object-cover'
            />
          </div>
          <div
            data-anim-group
            className='flex flex-col justify-center gap-6 xl:max-w-[85%] xxl:max-w-[85%] lg:justify-self-end'>
            {steps.map(({ num, title, description }) => (
              <div key={num} data-anim-item className='flex gap-4 items-center'>
                <h6 className='font-medium'>[{num}]</h6>
                <div>
                  <h4 className='text-base md:text-xl mb-1 dark:text-white'>
                    {title}
                  </h4>
                  <p className='text-xs md:text-sm font-light dark:text-white'>
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-20 lg:py-28 overflow-hidden'>
        <div data-anim className='text-center mb-12'>
          <h6 className='text-sm font-medium mb-1'>[TESTIMONIALS]</h6>
          <h2 className='text-2xl md:text-4xl mb-1 dark:text-white'>
            Real Stories, Real Results
          </h2>
          <p className='text-sm lg:text-base font-light dark:text-white'>
            500+ Nigerian businesses trust Taaxbro with their finances.
          </p>
          <div className='flex justify-center mt-6'>
            <img
              src={testimonialImg}
              alt='Taaxbro customers'
              className='h-16 object-contain'
            />
          </div>
        </div>

        <div className='testimonial-carousel'>
          <Swiper
            modules={[Navigation, Autoplay]}
            centeredSlides
            loop
            spaceBetween={12}
            slidesPerView='auto'
            navigation={{
              prevEl: '.testimonial-prev',
              nextEl: '.testimonial-next',
            }}
            autoplay={{ delay: 6000, disableOnInteraction: false }}
            className='testimonial-swiper'>
            {carouselTestimonials.map(({ quote, name, role }, index) => (
              <SwiperSlide key={`${name}-${index}`}>
                <article className='testimonial-card relative flex min-h-72 flex-col justify-between overflow-hidden rounded-2xl border border-grey-10 dark:border-white/10 bg-white dark:bg-[#1c1c1c] p-6 text-left md:min-h-80 md:p-8'>
                  <div
                    className='testimonial-pattern absolute inset-0 opacity-0'
                    style={{ backgroundImage: `url(${taaxbroPattern})` }}
                  />
                  <div className='testimonial-pattern-overlay absolute inset-0 bg-white/95 dark:bg-[#1c1c1c]/95 opacity-0' />
                  <div className='relative z-10'>
                    <p className='testimonial-quote text-sm leading-relaxed text-dark dark:text-white md:text-base'>
                      "{quote}"
                    </p>
                  </div>
                  <div className='relative z-10 flex items-end justify-between gap-6'>
                    <div>
                      <p className='testimonial-name text-lg font-medium text-dark dark:text-white md:text-xl'>
                        {name}
                      </p>
                      <p className='mt-1 text-xs font-light text-dark dark:text-white md:text-sm'>
                        {role}
                      </p>
                    </div>
                    <img
                      src={testimonyImg}
                      alt={name}
                      className='size-16 shrink-0 rounded-full object-cover md:size-18'
                    />
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className='mt-8 flex justify-center gap-4'>
            <button
              type='button'
              aria-label='Previous testimonial'
              className='testimonial-prev flex size-11 items-center justify-center rounded-lg border border-grey-10 dark:border-white/10 bg-white dark:bg-[#1c1c1c] text-dark dark:text-white transition-colors hover:border-dark dark:hover:border-white'>
              <Icon icon='mdi:arrow-left' className='text-2xl' />
            </button>
            <button
              type='button'
              aria-label='Next testimonial'
              className='testimonial-next flex size-11 items-center justify-center rounded-lg border border-grey-10 dark:border-white/10 bg-white dark:bg-[#1c1c1c] text-dark dark:text-white transition-colors hover:border-dark dark:hover:border-white'>
              <Icon icon='mdi:arrow-right' className='text-2xl' />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
