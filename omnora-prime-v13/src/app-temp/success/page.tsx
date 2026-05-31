"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const GITHUB_BASE = 'https://github.com/omnoralabs/noxis-releases/releases/latest/download';

const DOWNLOADS = {
  lite: {
    exe: `${GITHUB_BASE}/NoxisSetup-Lite.exe`,
    apk: `${GITHUB_BASE}/noxis-lite.apk`,
    label: 'Noxis Lite',
    color: '#9CA3AF',
  },
  pro: {
    exe: `${GITHUB_BASE}/NoxisSetup-Pro.exe`,
    apk: `${GITHUB_BASE}/noxis-pro.apk`,
    label: 'Noxis Pro',
    color: '#60A5FA',
  },
  elite: {
    exe: `${GITHUB_BASE}/NoxisSetup-Elite.exe`,
    apk: `${GITHUB_BASE}/noxis-elite.apk`,
    label: 'Noxis Elite',
    color: '#C5A059',
  },
};

function SuccessContent() {
  const params = useSearchParams();
  const tier = (params.get('tier') || 'lite') as keyof typeof DOWNLOADS;
  const licenseKey = params.get('key') || '';
  const [downloaded, setDownloaded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  const downloads = DOWNLOADS[tier] || DOWNLOADS.lite;
  
  // Auto-start .exe download after countdown hits 0
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Trigger download
          const link = document.createElement('a');
          link.href = downloads.exe;
          link.download = 'NoxisSetup.exe';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setDownloaded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [downloads.exe]);

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0A0C0F',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
    }}>
      
      {/* Success Icon */}
      <div style={{
        width: 80, height: 80,
        backgroundColor: 'rgba(16,185,129,0.1)',
        border: '2px solid rgba(16,185,129,0.3)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
        marginBottom: 32,
      }}>
        ✓
      </div>
      
      {/* Tier Badge */}
      <div style={{
        backgroundColor: `${downloads.color}15`,
        border: `1px solid ${downloads.color}40`,
        borderRadius: 4,
        padding: '4px 16px',
        fontSize: 11,
        letterSpacing: '0.1em',
        color: downloads.color,
        marginBottom: 16,
        textTransform: 'uppercase',
      }}>
        {downloads.label} Activated
      </div>
      
      <h1 style={{
        fontSize: 36,
        fontWeight: 800,
        marginBottom: 12,
        letterSpacing: '-0.02em',
      }}>
        Payment Confirmed
      </h1>
      
      <p style={{
        color: '#9CA3AF',
        fontSize: 16,
        marginBottom: 32,
        maxWidth: 480,
        lineHeight: 1.6,
      }}>
        Your license is active.
        {downloaded
          ? ' Your download has started.'
          : ` Download starts in ${countdown} seconds...`
        }
      </p>
      
      {/* License Key Display */}
      {licenseKey && (
        <div style={{
          backgroundColor: '#111418',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4,
          padding: 24,
          marginBottom: 32,
          width: '100%',
          maxWidth: 480,
        }}>
          <div style={{
            fontSize: 11, color: '#6B7280',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Your License Key
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: downloads.color,
            wordBreak: 'break-all',
          }}>
            {licenseKey}
          </div>
          <div style={{
            fontSize: 12, color: '#EF4444',
            marginTop: 8,
          }}>
            ⚠ Save this key. It is also your password. Do not share it.
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(licenseKey);
            }}
            style={{
              marginTop: 12,
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9CA3AF',
              padding: '6px 16px',
              fontSize: 12,
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            Copy Key
          </button>
        </div>
      )}
      
      {/* Download Buttons */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 40,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <a
          href={downloads.exe}
          style={{
            backgroundColor: '#60A5FA',
            color: 'black',
            padding: '14px 28px',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderRadius: 2,
          }}
        >
          Download for Windows (.exe)
        </a>
        <a
          href={downloads.apk}
          style={{
            backgroundColor: '#10B981',
            color: 'black',
            padding: '14px 28px',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            borderRadius: 2,
          }}
        >
          Download Android (.apk)
        </a>
      </div>
      
      {/* Next Steps */}
      <div style={{
        maxWidth: 480,
        textAlign: 'left',
        backgroundColor: '#111418',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 4,
        padding: 24,
        marginBottom: 32,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          marginBottom: 16, color: '#D1D5DB',
        }}>
          What to do next:
        </div>
        {[
          'Install NoxisSetup.exe on your Windows PC',
          `Enter your license key: ${licenseKey || 'YOUR-KEY-HERE'}`,
          'Complete the 2-minute setup (industry + country)',
          'Optional: Install the Android APK and pair via QR',
        ].map((step, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 12,
            marginBottom: 12,
            alignItems: 'flex-start',
          }}>
            <span style={{
              color: '#60A5FA',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}>
              {i + 1}.
            </span>
            <span style={{
              color: '#9CA3AF',
              fontSize: 13,
              lineHeight: 1.5,
            }}>
              {step}
            </span>
          </div>
        ))}
      </div>
      
      {/* Support */}
      <div style={{
        fontSize: 13, color: '#6B7280',
      }}>
        Need help?{' '}
        <a
          href="https://wa.me/923334355475"
          style={{ color: '#25D366' }}
        >
          WhatsApp support
        </a>
        {' '}or email{' '}
        <a
          href="mailto:[EMAIL_ADDRESS]"
          style={{ color: '#60A5FA' }}
        >
          [EMAIL_ADDRESS]
        </a>
      </div>
      
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0A0C0F',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 12,
          color: '#60A5FA',
          fontFamily: 'monospace',
          letterSpacing: '0.2em',
        }}>
          Verifying Payment Confirmation...
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
