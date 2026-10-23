import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    // Por padrão (desenvolvimento ágil de frontend), foca exclusivamente nas telas e UI
    include: [
      'src/tests/articles/**/*.{test,spec}.{ts,tsx}',
      'src/tests/navigation/**/*.{test,spec}.{ts,tsx}',
      'src/tests/search/**/*.{test,spec}.{ts,tsx}',
      'src/tests/shell/**/*.{test,spec}.{ts,tsx}',
      'src/tests/sobre/**/*.{test,spec}.{ts,tsx}',
      'src/tests/consent/**/*.{test,spec}.{ts,tsx}',
    ],
    maxWorkers: '50%',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', 'dist/', 'scripts/'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'server-only': path.resolve(
        require.resolve('next/package.json'),
        '../dist/compiled/server-only/empty.js'
      ),
    },
  },
});
