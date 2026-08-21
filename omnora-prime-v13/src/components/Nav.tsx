'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Download, ChevronDown } from 'lucide-react'

const PUBLIC_ROUTES = [
  '/', '/features', '/pricing', '/industries', '/download', '/docs',
  '/changelog', '/blog', '/compare', '/terms', '/privacy',
  '/refund', '/who-is-it-for', '/technology', '/reviews',
]

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Industries', href: '/industries' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Download', href: '/download' },
  {
    label: 'Resources',
    children: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Blog', href: '/blog' },
      { label: 'Compare', href: '/compare' },
    ]
  },
]

export function Nav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdown, setDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const isPublic = pathname === '/' || PUBLIC_ROUTES.some(r => r !== '/' && pathname?.startsWith(r))

  if (!isPublic) {
    return null
  }

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-200
      ${scrolled
        ? 'bg-[#060708]/95 border-b border-[#21262D]'
        : 'bg-[#060708]/80 border-b border-[#21262D]/50'}
    `}>
      <nav className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-7 h-7 rounded-md overflow-hidden bg-[#3B82F6] flex items-center justify-center">
            <img src="/noxis.png" alt="Noxis Hub" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-tight font-sans">
              Noxis Hub
            </span>
            <span className="text-[10px] font-mono font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded border border-[#F59E0B]/20">
              v13
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(link => (
            link.children ? (
              <div key={link.label} className="relative">
                <button
                  onClick={() => setDropdown(dropdown === link.label ? null : link.label)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                  <ChevronDown size={12} />
                </button>
                {dropdown === link.label && (
                  <div className="absolute top-7 left-0 bg-[#0D1117] border border-[#21262D] rounded-md p-1.5 min-w-[160px] shadow-xl z-50">
                    {link.children.map(child => (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={() => setDropdown(null)}
                        className="block px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-[#161B22] rounded transition-colors no-underline"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-semibold text-gray-400 hover:text-white transition-colors no-underline cursor-pointer"
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://wa.me/923264742678?text=I want to know more about Noxis Hub"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-[#161B22] border border-[#21262D] rounded-md transition-colors"
          >
            WhatsApp Us
          </a>
          <Link
            href="/download"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-[#3B82F6] hover:bg-[#2563EB] rounded-md transition-colors"
          >
            <Download size={13} />
            Free Download
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-400 hover:text-white transition-colors p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0D1117] border-t border-[#21262D]">
          <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1">
            {NAV_LINKS.flatMap(link =>
              link.children ? link.children : [link]
            ).map(link => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-[#161B22] rounded-md transition-colors no-underline"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-[#21262D]">
              <Link
                href="/download"
                className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-black bg-[#3B82F6] rounded-md"
              >
                <Download size={13} />
                Free Download
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
