import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Ignores padrão do eslint-config-next
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Artefato gerado por scripts/generate-catalog.js
    'src/data/mapping.ts',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
  ]),
  {
    // Dívida pré-existente registrada na Fase 0: continua visível como aviso.
    // Corrigir exige refatorar componentes que serão reescritos na migração para a API
    // (ClientLayout/AuthProvider, Sidebar, contexto de consentimento, hooks de storage).
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);

export default eslintConfig;
