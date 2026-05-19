import React from 'react';

interface FooterProps {
  style?: React.CSSProperties;
}

export default function Footer({ style }: FooterProps) {
  return (
    <div style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      paddingTop: '32px',
      marginTop: '64px',
      fontFamily: 'Inter, sans-serif',
      ...style
    }}>
      <div style={{
        fontSize: '11px',
        color: '#6B7280',
        lineHeight: '1.8',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        <p style={{ fontWeight: 800, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.1em' }}>
          © 2026 Noxis Hub. Engineered by Omnora Labs.
        </p>
        <p style={{ marginBottom: '8px' }}>
          All trade records remain completely localized within your local workstation node.{' '}
          <a href="/privacy" style={{ color: '#3B82F6', textDecoration: 'underline', fontWeight: 600 }}>
            View our Local Privacy Policy
          </a>.
        </p>
        <p>
          Noxis Hub and Noxis Core Ecosystem are proprietary industrial assets engineered and owned exclusively by Omnora Labs LLC. Registered Office: Lahore, Pakistan. Use of this software is governed by our enterprise Terms of Service and local Data Privacy Regulations.
        </p>
      </div>
    </div>
  );
}
