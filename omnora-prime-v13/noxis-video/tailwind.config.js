module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        noxis: {
          bg: '#060708',
          card: '#0F1114',
          surface: '#161A1F',
          border: 'rgba(255,255,255,0.07)',
          blue: '#60A5FA',
          green: '#10B981',
          gold: '#C5A059',
          amber: '#F59E0B',
          red: '#EF4444',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: [
          'Inter', '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI', 'sans-serif'
        ],
        mono: ['JetBrains Mono',
          'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
