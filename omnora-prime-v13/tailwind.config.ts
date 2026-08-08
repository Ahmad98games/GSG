import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        noxis: {
          base:     'var(--bg-base)',
          surface1: 'var(--bg-surface-1)',
          surface2: 'var(--bg-surface-2)',
          surface3: 'var(--bg-surface-3)',
          accent:   'var(--accent)',
          gold:     'var(--gold)',
          success:  'var(--success)',
          warning:  'var(--warning)',
          danger:   'var(--danger)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
export default config
