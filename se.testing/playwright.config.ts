import { defineConfig } from '@playwright/test';
import path from 'node:path';

const apiBaseURL = process.env.API_BASE_URL ?? 'http://127.0.0.1:18080';
const rootDir = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './project/specs',
  globalSetup: './project/setup/global-setup.ts',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(rootDir, 'test-results/api-results.json') }],
    ['html', { outputFolder: path.join(rootDir, 'test-results/html-report'), open: 'never' }],
  ],
  use: {
    baseURL: apiBaseURL,
    trace: 'retain-on-failure',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  outputDir: path.join(rootDir, 'test-results/artifacts'),
  projects: [
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
    },
    {
      name: 'contract',
      testMatch: /contract\/.*\.spec\.ts/,
    },
  ],
});
