import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 50,
        functions: 30,
        branches: 40,
        statements: 50,
      },
      exclude: [
        'node_modules/',
        'dist/',
        'drizzle/',
        '**/*.d.ts',
        'src/seed-admin.ts',
        'src/types/',
      ],
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '~': './src',
    },
  },
})
