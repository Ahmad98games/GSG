"use client";

import React from "react";

export default function DocsPage() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0A0C0F',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      padding: '80px 20px',
    }}>
      <div style={{
        maxWidth: 760,
        margin: '0 auto',
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <div style={{
            fontSize: 11,
            color: '#60A5FA',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Documentation
          </div>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}>
            Getting Started with Noxis
          </h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: 18,
            lineHeight: 1.6,
          }}>
            Everything you need to get your factory
            running on Noxis in under 10 minutes.
          </p>
        </div>
        
        {/* Quick Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 64,
        }}>
          {[
            { icon: '⬇️', title: 'Installation',
              href: '#install' },
            { icon: '🔑', title: 'License Activation',
              href: '#license' },
            { icon: '📱', title: 'Mobile Pairing',
              href: '#mobile' },
            { icon: '📦', title: 'Adding Products',
              href: '#inventory' },
            { icon: '📄', title: 'Creating Invoices',
              href: '#invoices' },
            { icon: '⚡', title: 'Quick Entry Console',
              href: '#quickentry' },
            { icon: '❓', title: 'Troubleshooting',
              href: '#troubleshoot' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                backgroundColor: '#111418',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 4,
                padding: '16px 20px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'white',
              }}
            >
              <span style={{ fontSize: 20 }}>
                {link.icon}
              </span>
              <span style={{
                fontSize: 14, fontWeight: 500,
              }}>
                {link.title}
              </span>
            </a>
          ))}
        </div>
        
        {/* Section 1: Installation */}
        <section id="install" style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700,
            marginBottom: 24,
            paddingTop: 64,
          }}>
            1. Installation
          </h2>
          
          <div style={{
            backgroundColor: '#111418',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 4,
            padding: 24,
            marginBottom: 24,
          }}>
            <p style={{
              color: '#D1D5DB', lineHeight: 1.7,
              marginBottom: 16,
            }}>
              Download the Noxis installer from the
              download page. The file is named
              NoxisSetup.exe.
            </p>
            <ol style={{
              color: '#9CA3AF',
              paddingLeft: 24,
              lineHeight: 2,
            }}>
              <li>
                Double-click NoxisSetup.exe to run
              </li>
              <li>
                If Windows shows a security warning,
                click "More info" then "Run anyway"
                (this warning appears because the app
                is new and not yet code-signed)
              </li>
              <li>
                Follow the installer steps
              </li>
              <li>
                Click Finish — Noxis opens automatically
              </li>
            </ol>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 4,
            padding: 16,
            fontSize: 13,
            color: '#D97706',
          }}>
            <strong>System Requirements:</strong>{' '}
            Windows 10 or 11 (64-bit).
            Minimum 4GB RAM and 2GB free disk space.
            Internet required only for first activation.
          </div>
        </section>
        
        {/* Section 2: License */}
        <section id="license" style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700,
            marginBottom: 24,
            paddingTop: 64,
          }}>
            2. Activating Your License
          </h2>
          
          <p style={{
            color: '#D1D5DB', lineHeight: 1.7,
            marginBottom: 16,
          }}>
            When Noxis opens for the first time,
            you will see the license activation screen.
          </p>
          
          <ol style={{
            color: '#9CA3AF',
            paddingLeft: 24,
            lineHeight: 2,
            marginBottom: 16,
          }}>
            <li>
              Enter your license key in the format:
              XXXX-XXXX-XXXX-XXXX
            </li>
            <li>
              Make sure you are connected to the internet
              for this step only
            </li>
            <li>
              Click Activate
            </li>
            <li>
              After activation, internet is no longer
              required to use Noxis
            </li>
          </ol>
          
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 4,
            padding: 16,
            fontSize: 13,
            color: '#EF4444',
          }}>
            <strong>Important:</strong> Your license key
            is your password. Save it somewhere safe.
            Do not share it with anyone.
          </div>
        </section>
        
        {/* Section 3: Mobile Pairing */}
        <section id="mobile" style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700,
            marginBottom: 24,
            paddingTop: 64,
          }}>
            3. Pairing Your Android Phone
          </h2>
          
          <p style={{
            color: '#D1D5DB', lineHeight: 1.7,
            marginBottom: 16,
          }}>
            The Noxis mobile app connects to your Hub
            PC over local WiFi. Both devices must be
            on the same network.
          </p>
          
          <ol style={{
            color: '#9CA3AF',
            paddingLeft: 24,
            lineHeight: 2,
          }}>
            <li>
              Download the Noxis APK on your Android
              phone from the download page
            </li>
            <li>
              Install the APK (enable "Install from
              unknown sources" in Android settings)
            </li>
            <li>
              On your PC: open Noxis and go to Pairing
              in the sidebar
            </li>
            <li>
              A QR code appears on screen
            </li>
            <li>
              On your phone: open Noxis Mobile and
              scan the QR code
            </li>
            <li>
              The phone connects to the Hub instantly
            </li>
          </ol>
        </section>
        
        {/* Section 4: Inventory */}
        <section id="inventory" style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700,
            marginBottom: 24,
            paddingTop: 64,
          }}>
            4. Adding Your First Product
          </h2>
          
          <ol style={{
            color: '#9CA3AF',
            paddingLeft: 24,
            lineHeight: 2,
          }}>
            <li>Click Inventory in the left sidebar</li>
            <li>Click the + Add SKU button (top right)</li>
            <li>Enter: Product name, SKU code, unit, 
                cost price, and sale price</li>
            <li>Click Save</li>
            <li>Your product appears in the inventory list</li>
          </ol>
        </section>
        
        {/* Section 5: Invoices */}
        <section id="invoices" style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700,
            marginBottom: 24,
            paddingTop: 64,
          }}>
            5. Creating an Invoice
          </h2>
          
          <ol style={{
            color: '#9CA3AF',
            paddingLeft: 24,
            lineHeight: 2,
          }}>
            <li>Click Invoices in the left sidebar</li>
            <li>Click + New Invoice</li>
            <li>Search and select a customer</li>
            <li>Add line items by typing the product name</li>
            <li>Review the total and tax</li>
            <li>Click Finalize and Post</li>
            <li>
              The invoice is saved and your ledger
              updates automatically
            </li>
          </ol>
        </section>
        
        {/* Section 6: Quick Entry Console */}
        <section id="quickentry" style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700,
            marginBottom: 24,
            paddingTop: 64,
          }}>
            6. The Quick Entry Console
          </h2>
          
          <p style={{
            color: '#D1D5DB', lineHeight: 1.7,
            marginBottom: 16,
          }}>
            The Quick Entry Console provides a fast, touch-friendly interface designed specifically for high-speed factory floor inputs. It is structured into three unified logging tabs:
          </p>
          
          <ul style={{
            color: '#9CA3AF',
            paddingLeft: 24,
            lineHeight: 2,
            marginBottom: 24,
          }}>
            <li>
              <strong>Production Log:</strong> Search for any Karigar, input their production quantity, select their quality grade (A, B, C, or Rejected), and submit. Instantly updates the running output total.
            </li>
            <li>
              <strong>Payment Slip:</strong> Log payments received from customers or paid to suppliers. Supports selecting payment modes (Cash, Bank, JazzCash, EasyPaisa) and automatically records corresponding double-entry ledger items (credits for receivables, debits for payables).
            </li>
            <li>
              <strong>Attendance Slip:</strong> Pick dates, mark recent Karigars present/absent/late, or perform a bulk "Mark All Present" action to quickly log attendance sheets.
            </li>
          </ul>
          
          <div style={{
            backgroundColor: 'rgba(96,165,250,0.05)',
            border: '1px solid rgba(96,165,250,0.2)',
            borderRadius: 4,
            padding: 16,
            fontSize: 13,
            color: '#60A5FA',
          }}>
            <strong>Live Floor Feed:</strong> The right side of the Quick Entry Console houses a reactive vertical timeline stream, showing the last 10 log actions recorded today in real-time.
          </div>
        </section>

        {/* Section 7: Troubleshooting */}
        <section id="troubleshoot" style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 700,
            marginBottom: 24,
            paddingTop: 64,
          }}>
            7. Common Issues
          </h2>
          
          {[
            {
              q: 'License activation fails',
              a: 'Make sure you are connected to the internet. Check that the key is entered correctly without spaces. If the problem continues, contact support via WhatsApp.',
            },
            {
              q: 'Windows shows security warning',
              a: 'Click "More info" then "Run anyway". This appears because Noxis is new software. It is safe to install.',
            },
            {
              q: 'Mobile app cannot find Hub',
              a: 'Make sure both your PC and phone are connected to the same WiFi network. The Hub must be running on the PC before scanning the QR code.',
            },
            {
              q: 'Cannot add products or invoices',
              a: 'Make sure you have completed the initial setup (industry selection and business profile). If the issue continues, try restarting the Hub.',
            },
            {
              q: 'Data not syncing to cloud',
              a: 'Check your internet connection. Noxis works completely offline and syncs automatically when internet is available. Your data is never lost.',
            },
          ].map((item, i) => (
            <div key={i} style={{
              backgroundColor: '#111418',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 4,
              padding: 20,
              marginBottom: 12,
            }}>
              <p style={{
                fontWeight: 600, fontSize: 15,
                marginBottom: 8, color: 'white',
              }}>
                {item.q}
              </p>
              <p style={{
                color: '#9CA3AF', fontSize: 14,
                lineHeight: 1.6,
              }}>
                {item.a}
              </p>
            </div>
          ))}
          
          {/* Support Contact */}
          <div style={{
            backgroundColor:
              'rgba(37,211,102,0.05)',
            border: '1px solid rgba(37,211,102,0.2)',
            borderRadius: 4,
            padding: 20,
            marginTop: 24,
          }}>
            <p style={{
              fontSize: 14, color: '#D1D5DB',
              marginBottom: 12,
            }}>
              Still need help? Contact us directly:
            </p>
            
            <a
              href="https://wa.me/923334355475"
              style={{
                display: 'inline-block',
                backgroundColor: '#25D366',
                color: 'black',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                borderRadius: 2,
              }}
            >
              WhatsApp Support
            </a>
          </div>
        </section>
        
      </div>
    </main>
  );
}
