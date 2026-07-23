import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#060708',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          height: 400,
          background: 'rgba(96,165,250,0.08)',
          borderRadius: '50%',
          filter: 'blur(80px)',
        }} as="div" />

        {/* Logo box */}
        <div style={{
          width: 96,
          height: 96,
          background: '#0F1114',
          border: '1px solid rgba(96,165,250,0.3)',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }} as="div">
          <span style={{
            fontSize: 48,
            fontWeight: 900,
            color: '#60A5FA',
          }}>N</span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 56,
          fontWeight: 900,
          color: '#FFFFFF',
          letterSpacing: -2,
          marginBottom: 16,
          textAlign: 'center',
        }} as="div">
          Noxis Hub
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 24,
          color: '#6B7280',
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.4,
          marginBottom: 40,
        }} as="div">
          Factory Management Software for Pakistan & UAE
        </div>

        {/* Feature pills */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 900,
        }} as="div">
          {[
            'Karigar Management',
            'Offline-First',
            'WhatsApp Billing',
            'CCTV Integration',
            'PKR 2,500/year',
          ].map(tag => (
            <div key={tag} style={{
              background: 'rgba(96,165,250,0.1)',
              border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: 100,
              padding: '8px 20px',
              fontSize: 16,
              color: '#60A5FA',
              fontWeight: 600,
            }} as="div">
              {tag}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          fontSize: 18,
          color: '#374151',
          letterSpacing: 2,
        }} as="div">
          noxishub.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
