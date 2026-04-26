import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        'src/main.tsx',
        'src/App.tsx',
      ],
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 10000,
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router'],
  },
})
