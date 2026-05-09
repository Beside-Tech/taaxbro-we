import { Icon } from '@iconify/react'

const cards = [
  {
    icon: 'mdi:whatsapp',
    title: 'Chat to Sales',
    description: 'Speak to our friendly team',
    link: { label: '+2348170061600', href: 'https://wa.me/2348170061600' },
  },
  {
    icon: 'mdi:phone-outline',
    title: 'Call Us',
    description: '8am–6pm, Mondays – Fridays',
    link: { label: '+2348170061600', href: 'tel:+2348170061600' },
  },
  {
    icon: 'mdi:email-outline',
    title: 'Email Us',
    description: 'Send a mail to our support team',
    link: { label: 'support@taaxbro.com', href: 'mailto:support@taaxbro.com' },
  },
  {
    icon: 'mdi:map-marker-outline',
    title: 'Visit Us',
    description: 'No 32, Lexington way, Lagos, Nigeria',
    link: {
      label: 'View on Google Maps',
      href: 'https://maps.google.com/?q=No+32+Lexington+way+Lagos+Nigeria',
    },
  },
]

export default function Support() {
  return (
    <>
      {/* ── Header ────────────────────────────────────────────────── */}
      <section className="bg-white pt-20 pb-8 text-center layout-padding">
        <h6 className="text-primary-30 text-sm font-semibold mb-3 tracking-wide">[SUPPORT]</h6>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark mb-4">
          We're here. And we actually respond
        </h1>
        <p className="text-grey-30 text-base sm:text-lg">Let us know how we can help</p>
      </section>

      {/* ── Contact Cards ─────────────────────────────────────────── */}
      <section className="bg-white py-12 pb-32">
        <div className="layout-padding">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {cards.map(({ icon, title, description, link }) => (
              <div
                key={title}
                className="border border-grey-10 rounded-2xl p-7 flex flex-col gap-6 bg-white hover:border-primary-20 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-10 flex items-center justify-center">
                  <Icon icon={icon} className="text-primary-30 text-2xl" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold text-dark text-base">{title}</h3>
                  <p className="text-grey-30 text-sm">{description}</p>
                </div>
                <a
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-primary-30 text-sm font-semibold hover:text-primary-40 transition-colors mt-auto"
                >
                  {link.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
