import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Metade dos núcleos. Com o padrão (núcleos - 1), cada worker monta seu jsdom e a CPU
    // satura: os testes de componente demoravam de 3 a 7 vezes mais que isolados (até 4 s
    // contra 750 ms) e, de vez em quando, passavam dos 5 s, sempre num teste diferente.
    // Medido em 2026-10-15: 2 falhas em 10 execuções completas antes, 0 em 10 depois.
    maxWorkers: '50%',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', 'dist/', 'scripts/'],
      // Catraca: branches ficou em 65% na Fase 0 e voltou a 70% com os testes de
      // autenticação (etapa 2). Só suba estes números; nunca baixe para passar.
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
      '@': path.resolve(__dirname, './src'),
      // Nos testes, `server-only` vira um módulo vazio (no build do Next ele barra
      // importações a partir de componentes de cliente).
      'server-only': path.resolve(
        __dirname,
        './node_modules/next/dist/compiled/server-only/empty.js'
      ),
    },
  },
});
