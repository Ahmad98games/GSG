/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          p: '#070809', // Primary OLED
          s: '#0F1113', // Secondary
          t: '#14171A', // Tertiary
        },
        gold: {
          DEFAULT: '#C6A756',
          soft: '#A88E45',
          glow: 'rgba(198,167,86,0.15)',
        },
        zinc: {
          950: '#070809', 
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xxs': ['0.65rem', { lineHeight: '1rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
      },
    },
  },
  plugins: [],
}
