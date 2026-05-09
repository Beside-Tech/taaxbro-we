import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@iconify/react'
import logoMark from '../../assets/LogoMark.png'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/support', label: 'Support' },
  { to: '/features', label: 'Features' },
  { to: '/blog', label: 'Blog' },
]

const contactItems = [
  { icon: 'mdi:email-outline', label: 'support@taaxbro.com', href: 'mailto:support@taaxbro.com' },
  { icon: 'mdi:whatsapp', label: '+234 817 006 1600', href: 'tel:+2348170061600' },
  { icon: 'mdi:phone-outline', label: '+234 583 123 4001', href: 'tel:+2345831234001' },
  { icon: 'mdi:map-marker-outline', label: 'No 32, Lexington way, Lagos, Nigeria', href: null },
]

export default function Footer() {
  const [email, setEmail] = useState('')

  return (
    <footer className="bg-dark text-white">
      <div className="layout-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <img src={logoMark} alt="" className="h-7 w-auto brightness-0 invert" />
              <span className="font-bold text-base">Taaxbro</span>
            </div>
            <p className="text-2xl font-bold leading-snug">
              Your Business Finances<br />
              Finally Under Your Control
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-base mb-6">Quick Navigation</h4>
            <ul className="flex flex-col gap-3">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-grey-20 hover:text-white text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-base mb-6">Get in Touch</h4>
            <ul className="flex flex-col gap-4">
              {contactItems.map(({ icon, label, href }) => (
                <li key={label} className="flex items-start gap-3">
                  <Icon icon={icon} className="text-grey-20 text-xl shrink-0 mt-0.5" />
                  {href ? (
                    <a href={href} className="text-grey-20 hover:text-white text-sm transition-colors">
                      {label}
                    </a>
                  ) : (
                    <span className="text-grey-20 text-sm">{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-10 border-t border-white/10">
          <h4 className="font-semibold text-base mb-1">Subscribe to our Newsletter</h4>
          <p className="text-grey-30 text-sm mb-4">Get updates on new features and product releases</p>
          <div className="flex gap-2 max-w-sm">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your Email"
              className="flex-1 bg-white/10 border border-white/15 text-white placeholder:text-grey-30 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-primary-20"
            />
            <button className="bg-white text-dark text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-10 transition-colors cursor-pointer shrink-0">
              Subscribe
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-grey-30 text-sm">2026 Taaxbro, All rights reserved</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-grey-30 hover:text-white text-sm transition-colors flex items-center gap-1">
              Terms of Service
              <Icon icon="mdi:arrow-top-right" className="text-sm" />
            </a>
            <a href="#" className="text-grey-30 hover:text-white text-sm transition-colors flex items-center gap-1">
              Privacy Policy
              <Icon icon="mdi:arrow-top-right" className="text-sm" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
