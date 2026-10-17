import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E, Visual Regression and Accessibility Configuration
 */
export default defineConfig({
  testDir: './e2e',
  // Apaga as contas que os fluxos reais (signup/users) criam no AuthService local.
  globalTeardown: './e2e/global-teardown.ts',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Localmente, 2 workers: com mais, Next + AuthService + Docker na mesma máquina ficam tão
  // disputados que a hidratação das páginas atrasa e os fluxos de formulário ficam instáveis.
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
