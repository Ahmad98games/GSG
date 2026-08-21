'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Download, ChevronDown, Cpu, Sparkles } from 'lucide-react'

const PUBLIC_ROUTES = [
  '/', '/features', '/pricing', '/industries', '/download', '/docs',
  '/changelog', '/blog', '/compare', '/terms', '/privacy',
  '/refund', '/who-is-it-for', '/technology', '/reviews', '/specs',
]

const NAV_LINKS = [
  { label: 'Features', href: '/#features', isAnchor: true },
  { label: 'Industries', href: '/industries' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Specs & Hardware', href: '/specs' },
  {
    label: 'Resources',
    children: [
      { label: 'Documentation', href: '/docs' },
      { label: 'FileMorph Engine', href: '/#filemorph' },
      { label: 'CCTV Sentinel AI', href: '/#cctv' },
      { label: 'Working Capital Hub', href: '/#capital' },
      { label: 'Compare Solutions', href: '/compare' },
    ]
  },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdown, setDropdown] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // IntersectionObserver for active section highlighting on home page
  useEffect(() => {
    if (pathname !== '/') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.25 }
    )

    const sections = document.querySelectorAll('section[id]')
    sections.forEach((sec) => observer.observe(sec))

    return () => observer.disconnect()
  }, [pathname])

  // Handle hash scrolling on page mount (e.g. navigated from /docs to /#features)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash) {
      const hash = window.location.hash.substring(1)
      setTimeout(() => {
        const targetEl = document.getElementById(hash)
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [pathname])

  const handleFeaturesClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith('/#')) {
      e.preventDefault()
      const targetId = href.replace('/#', '')
      if (pathname === '/') {
        const el = document.getElementById(targetId)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
          setMobileOpen(false)
          return
        }
      } else {
        router.push(`/#${targetId}`)
        setMobileOpen(false)
      }
    }
  }

  const isPublic = pathname === '/' || PUBLIC_ROUTES.some(r => r !== '/' && pathname?.startsWith(r))
  if (!isPublic) return null

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-x-hidden
      ${scrolled
        ? 'bg-[#0B0F17]/95 border-b border-[#06B6D4]/30 shadow-[0_4px_30px_rgba(6,182,212,0.1)] backdrop-blur-md'
        : 'bg-[#0B0F17]/80 border-b border-[#06B6D4]/15 backdrop-blur-sm'}
    `}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="w-8 h-8 rounded-md bg-[#06B6D4]/10 border border-[#06B6D4]/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Cpu size={18} className="text-[#06B6D4]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-extrabold text-base tracking-tight font-sans uppercase italic">
              NOXIS<span className="text-[#06B6D4] font-normal not-italic">HUB</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/30 uppercase tracking-widest">
              v13.1 Industrial OS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(link => (
            link.children ? (
              <div key={link.label} className="relative">
                <button
                  onClick={() => setDropdown(dropdown === link.label ? null : link.label)}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-[#06B6D4] transition-colors"
                >
                  {link.label}
                  <ChevronDown size={12} className={`transition-transform ${dropdown === link.label ? 'rotate-180 text-[#06B6D4]' : ''}`} />
                </button>
                {dropdown === link.label && (
                  <div className="absolute top-8 left-0 bg-[#0B0F17] border border-[#06B6D4]/30 rounded-md p-2 min-w-[200px] shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 backdrop-blur-xl">
                    {link.children.map(child => (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={(e) => {
                          setDropdown(null)
                          if (child.href.startsWith('/#')) {
                            handleFeaturesClick(e, child.href)
                          }
                        }}
                        className="block px-3 py-2 text-xs font-semibold text-gray-300 hover:text-[#06B6D4] hover:bg-[#06B6D4]/10 rounded transition-colors no-underline uppercase tracking-wide"
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
                onClick={(e) => link.isAnchor && handleFeaturesClick(e, link.href)}
                className={`text-xs font-bold uppercase tracking-wider transition-colors no-underline ${
                  (link.isAnchor && activeSection === 'features') || pathname === link.href
                    ? 'text-[#06B6D4] font-black border-b-2 border-[#06B6D4] pb-0.5'
                    : 'text-gray-300 hover:text-[#06B6D4]'
                }`}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/docs"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white bg-white/5 border border-white/10 rounded hover:border-[#06B6D4]/40 transition-all no-underline"
          >
            Documentation
          </Link>
          <Link
            href="/download"
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-black bg-[#06B6D4] hover:bg-[#08EBF6] rounded shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all no-underline"
          >
            <Download size={14} />
            Deploy Node
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-300 hover:text-[#06B6D4] transition-colors p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0B0F17] border-t border-[#06B6D4]/30 px-6 py-4 space-y-3">
          {NAV_LINKS.flatMap(link =>
            link.children ? link.children : [link]
          ).map(link => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => {
                if (link.href.startsWith('/#')) {
                  handleFeaturesClick(e, link.href)
                } else {
                  setMobileOpen(false)
                }
              }}
              className="block py-2.5 text-xs font-bold uppercase tracking-wider text-gray-200 hover:text-[#06B6D4] border-b border-white/5 no-underline"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/download"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black uppercase tracking-widest text-black bg-[#06B6D4] rounded shadow-[0_0_15px_rgba(6,182,212,0.3)] no-underline"
            >
              <Download size={14} />
              Deploy Offline Node
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
