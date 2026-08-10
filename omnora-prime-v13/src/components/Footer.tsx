'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PUBLIC_ROUTES = [
  '/', '/pricing', '/industries', '/download', '/docs',
  '/changelog', '/blog', '/compare', '/terms', '/privacy',
  '/refund', '/who-is-it-for', '/technology', '/reviews',
]

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Download', href: '/download' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Compare', href: '/compare' },
  ],
  Industries: [
    { label: 'Textile Mill', href: '/industries' },
    { label: 'Rice Mill', href: '/industries' },
    { label: 'Pharmacy', href: '/industries' },
    { label: 'Garment Factory', href: '/industries' },
    { label: 'General Shop', href: '/industries' },
    { label: 'Auto Parts', href: '/industries' },
  ],
  Compare: [
    { label: 'vs Manager.io', href: '/compare' },
    { label: 'vs Vyapar', href: '/compare' },
    { label: 'vs Tally', href: '/compare' },
    { label: 'vs QuickBooks', href: '/compare' },
    { label: 'vs GnuCash', href: '/compare' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export function Footer() {
  const pathname = usePathname()
  const isPublic = pathname === '/' || PUBLIC_ROUTES.some(r => r !== '/' && pathname?.startsWith(r))

  if (!isPublic) {
    return null
  }

  return (
    <footer className="border-t border-[#21262D] bg-[#060708] pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md overflow-hidden bg-[#3B82F6] flex items-center justify-center">
                <img src="/noxis.png" alt="Noxis Hub" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-bold text-sm font-sans">
                Noxis Hub
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Offline-first ERP for Pakistan and UAE factories.
            </p>
            <a
              href="https://wa.me/923264742678"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#3B82F6] hover:underline"
            >
              WhatsApp +92 326 474 2678
            </a>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 font-mono">
                {category}
              </p>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-gray-400 hover:text-white transition-colors no-underline font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-[#21262D]">
          <p className="text-xs text-gray-500 font-medium">
            © 2026 Omnora Labs, Lahore, Pakistan. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-gray-500 font-mono">
            <span>Engineered in Pakistan</span>
            <span>noxishub.app</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
