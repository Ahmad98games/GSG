'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LandingClient() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.navigator.userAgent.toLowerCase().includes('electron')
    }
    return false
  })

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('id, onboarding_done')
            .eq('user_id', session.user.id)
            .single()
          if (profile && profile.onboarding_done) {
            router.push('/dashboard')
          } else {
            router.push('/setup')
          }
        } else {
          const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
          if (isElectron) {
            router.push('/login')
          } else {
            setChecking(false)
          }
        }
      } catch {
        setChecking(false)
      }
    }
    handleAuthRedirect()
  }, [supabase, router])

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#070809',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(96,165,250,0.3)',
          borderTopColor: '#60A5FA',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#070809',
      color: 'white',
      fontFamily: '"Inter", system-ui, sans-serif',
      minHeight: '100vh',
    }}>

      {/* ═══ NAVIGATION ═══ */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(7,8,9,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 40px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <img
            src="/logos/noxis.png"
            alt="Noxis"
            style={{ width: 28, height: 28, objectFit: 'contain' }}
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <span style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '-0.01em',
          }}>
            NOXIS
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}>
          {[
            { label: 'Pricing', href: '/pricing' },
            { label: 'Blog', href: '/blog' },
            { label: 'Docs', href: '/docs' },
          ].map(link => (
            <a key={link.href} href={link.href}
              style={{
                fontSize: 13,
                color: '#6B7280',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 150ms',
              }}
              onMouseEnter={e =>
                (e.target as HTMLElement).style.color = 'white'
              }
              onMouseLeave={e =>
                (e.target as HTMLElement).style.color = '#6B7280'
              }
            >
              {link.label}
            </a>
          ))}
          <a href="/download"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              color: 'black',
              backgroundColor: '#60A5FA',
              padding: '8px 18px',
              textDecoration: 'none',
              transition: 'background-color 150ms',
            }}
          >
            Download
          </a>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{
        paddingTop: 160,
        paddingBottom: 120,
        paddingLeft: 40,
        paddingRight: 40,
        maxWidth: 1100,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        alignItems: 'center',
      }}>

        {/* Left: Text */}
        <div>
          {/* Version pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(96,165,250,0.08)',
            border: '1px solid rgba(96,165,250,0.2)',
            borderRadius: 100,
            padding: '5px 14px',
            marginBottom: 28,
          }}>
            <div style={{
              width: 6, height: 6,
              borderRadius: '50%',
              backgroundColor: '#60A5FA',
            }} />
            <span style={{
              fontSize: 11,
              color: '#60A5FA',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
            }}>
              Industrial ERP · v13.1
            </span>
          </div>

          {/* H1 */}
          <h1 style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            color: 'white',
          }}>
            Factory software
            <br />
            that runs{' '}
            <span style={{ color: '#60A5FA' }}>
              offline.
            </span>
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: 17,
            color: '#9CA3AF',
            lineHeight: 1.7,
            marginBottom: 36,
            maxWidth: 440,
          }}>
            Manage inventory, karigars, invoices,
            and cameras from one place.
            Works without internet.
            Available in Urdu and English.
          </p>

          {/* CTA row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}>
            <a href="/download"
              style={{
                backgroundColor: '#60A5FA',
                color: 'black',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.04em',
                padding: '13px 28px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Download Free Trial
            </a>
            <a href="/pricing"
              style={{
                color: '#9CA3AF',
                fontSize: 13,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              See pricing →
            </a>
          </div>

          {/* Social proof */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            {[
              { flag: '🇵🇰', label: 'Pakistan' },
              { flag: '🇦🇪', label: 'UAE' },
              { flag: '🇧🇩', label: 'Bangladesh' },
              { flag: '🇹🇷', label: 'Turkey' },
              { flag: '🌍', label: '+36 countries' },
            ].map(c => (
              <div key={c.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                <span style={{ fontSize: 14 }}>
                  {c.flag}
                </span>
                <span style={{
                  fontSize: 11,
                  color: '#4B5563',
                  fontWeight: 500,
                }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: App screenshot */}
        <div style={{ position: 'relative' }}>
          {/* Glow effect */}
          <div style={{
            position: 'absolute',
            inset: -40,
            background: 'radial-gradient(ellipse at center, rgba(96,165,250,0.08) 0%, transparent 70%)',
            pointerEvents: 'none' as const,
          }} />

          {/* Screenshot frame */}
          <div style={{
            backgroundColor: '#0F1114',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Fake titlebar */}
            <div style={{
              backgroundColor: '#0A0C0F',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <div style={{
                width: 10, height: 10,
                borderRadius: '50%',
                backgroundColor: '#EF4444',
              }} />
              <div style={{
                width: 10, height: 10,
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
              }} />
              <div style={{
                width: 10, height: 10,
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }} />
              <span style={{
                marginLeft: 8,
                fontSize: 11,
                color: '#374151',
              }}>
                Noxis — Industrial ERP
              </span>
            </div>

            {/* Dashboard preview */}
            <div style={{
              padding: 20,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              {[
                { label: 'Monthly Revenue',
                  value: 'Rs. 12,84,500',
                  color: '#C5A059' },
                { label: 'Accounts Receivable',
                  value: 'Rs. 3,45,000',
                  color: '#EF4444' },
                { label: 'Stock Value',
                  value: 'Rs. 8,20,000',
                  color: '#60A5FA' },
                { label: 'Net Profit',
                  value: 'Rs. 2,14,000',
                  color: '#10B981' },
              ].map(card => (
                <div key={card.label} style={{
                  backgroundColor: '#161A1F',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '14px 16px',
                  borderRadius: 4,
                }}>
                  <p style={{
                    fontSize: 9,
                    color: '#6B7280',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                    marginBottom: 8,
                  }}>
                    {card.label}
                  </p>
                  <p style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 15,
                    fontWeight: 700,
                    color: card.color,
                  }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'center',
        gap: 64,
      }}>
        {[
          { value: '40+', label: 'Industries' },
          { value: '30+', label: 'Currencies' },
          { value: '6', label: 'Languages' },
          { value: '100%', label: 'Offline capable' },
          { value: 'PKR 2,500', label: 'Starting price' },
        ].map(s => (
          <div key={s.label}
            style={{ textAlign: 'center' as const }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 22,
              fontWeight: 700,
              color: 'white',
              marginBottom: 4,
            }}>
              {s.value}
            </p>
            <p style={{
              fontSize: 11,
              color: '#4B5563',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ═══ FEATURES ═══ */}
      <section style={{
        padding: '100px 40px',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        <div style={{
          marginBottom: 64,
        }}>
          <p style={{
            fontSize: 11,
            color: '#60A5FA',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            fontWeight: 600,
            marginBottom: 12,
          }}>
            What Noxis does
          </p>
          <h2 style={{
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            maxWidth: 500,
          }}>
            Everything your factory needs.
            Nothing it doesn't.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[
            {
              icon: '📦',
              title: 'Inventory & Stock',
              desc: 'Track every item with barcode scanning, reorder alerts, and batch/lot management.',
            },
            {
              icon: '👷',
              title: 'Karigar Management',
              desc: 'Attendance, piece-rate wages, Peshgi advances, and payslips — all automated.',
            },
            {
              icon: '📄',
              title: 'Invoicing & Khata',
              desc: 'Professional invoices with double-entry accounting. Customer balances update automatically.',
            },
            {
              icon: '📱',
              title: 'Mobile + Desktop',
              desc: 'Hub runs on Windows PC. Workers use Android app. Connected over local WiFi.',
            },
            {
              icon: '📷',
              title: 'CCTV & Security',
              desc: 'Connect IP cameras and get AI-powered person and vehicle detection alerts.',
            },
            {
              icon: '📊',
              title: 'Reports & Analytics',
              desc: 'Profit & Loss, Trial Balance, Aging Reports. Export to Excel or print.',
            },
          ].map((f) => (
            <div key={f.title} style={{
              backgroundColor: '#0F1114',
              padding: '32px 28px',
            }}>
              <div style={{
                fontSize: 28,
                marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 8,
                color: 'white',
              }}>
                {f.title}
              </h3>
              <p style={{
                fontSize: 13,
                color: '#6B7280',
                lineHeight: 1.6,
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section style={{
        padding: '80px 40px',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          textAlign: 'center' as const,
          marginBottom: 12,
        }}>
          Why not just use Excel?
        </h2>
        <p style={{
          textAlign: 'center' as const,
          color: '#6B7280',
          fontSize: 15,
          marginBottom: 48,
        }}>
          Most Pakistani factories use spreadsheets.
          Here is what they are missing.
        </p>

        <div style={{ overflowX: 'auto' as const }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse' as const,
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                {['', 'Noxis', 'Excel', 'Odoo'].map(
                  (h, i) => (
                  <th key={h || 'feature'} style={{
                    padding: '12px 16px',
                    textAlign: i === 0 ? 'left' as const : 'center' as const,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    color: i === 1 ? '#60A5FA' : '#374151',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Works 100% offline', '✅', '✅', '❌'],
                ['Karigar piece-rate wages', '✅', '❌', '❌'],
                ['Urdu language', '✅', '❌', '⚠️'],
                ['Peshgi tracking', '✅', '❌', '❌'],
                ['CCTV integration', '✅', '❌', '❌'],
                ['Mobile app included', '✅', '❌', '⚠️'],
                ['Setup time', '10 min', 'DIY', '3 months'],
                ['Price/month', 'PKR 2,500', 'Free', 'PKR 15,000+'],
              ].map((row, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  backgroundColor: i % 2 === 0
                    ? 'transparent'
                    : 'rgba(255,255,255,0.01)',
                }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: '13px 16px',
                      textAlign: j === 0 ? 'left' as const : 'center' as const,
                      fontSize: 13,
                      color: j === 1 ? 'white' : '#6B7280',
                      fontWeight: j === 1 ? 500 : 400,
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{
        padding: '100px 40px',
        textAlign: 'center' as const,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          fontSize: 11,
          color: '#60A5FA',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          marginBottom: 16,
          fontWeight: 600,
        }}>
          Free 3-day trial
        </p>
        <h2 style={{
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: 16,
          lineHeight: 1.1,
        }}>
          Start running your
          <br />
          factory properly.
        </h2>
        <p style={{
          color: '#6B7280',
          fontSize: 16,
          marginBottom: 36,
        }}>
          No credit card. No IT team.
          Download and you are running in 10 minutes.
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
        }}>
          <a href="/download" style={{
            backgroundColor: '#60A5FA',
            color: 'black',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.04em',
            padding: '14px 32px',
            textDecoration: 'none',
          }}>
            Download Free Trial
          </a>
          <a
            href="https://wa.me/923334355475?text=Hi, I want to try Noxis ERP"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#25D366',
              color: 'black',
              fontWeight: 700,
              fontSize: 13,
              padding: '14px 32px',
              textDecoration: 'none',
            }}
          >
            WhatsApp Us
          </a>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <img src="/logos/noxis.png" alt=""
            style={{ width: 20, height: 20, objectFit: 'contain' }}
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <span style={{
            fontSize: 13,
            fontWeight: 700,
          }}>
            NOXIS
          </span>
          <span style={{
            fontSize: 13,
            color: '#374151',
          }}>
            by Omnora Labs
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: 24,
        }}>
          {[
            { label: 'Download', href: '/download' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Blog', href: '/blog' },
            { label: 'Privacy', href: '/privacy' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 12,
              color: '#374151',
              textDecoration: 'none',
            }}>
              {l.label}
            </a>
          ))}
        </div>

        <p style={{
          fontSize: 12,
          color: '#374151',
        }}>
          © 2025 Omnora Labs · Made in Pakistan 🇵🇰
        </p>
      </footer>
    </div>
  )
}
