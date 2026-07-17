import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/dotenv-setup.ts', './src/tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      'src/tests/integration/**',
      '**/dist/**',
      '**/.next/**',
      '**/supabase/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        // Exclude system/database/TCP network infrastructure from unit test coverage metrics
        'src/lib/db/**',
        'src/lib/nsp/**',
        'src/lib/supabase/**',
        'src/server/**',
        'src/stores/**',
        'src/lib/logger.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
