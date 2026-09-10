import { defineConfig, devices } from '@playwright/test';

/**
 * Browser end-to-end configuration.
 *
 * The API and the web dev server are NOT started here. They need a scratch
 * PostgreSQL database, a JWT secret and an invitation secret, and starting
 * them from a test config would hide the fact that this suite writes to a real
 * database. `e2e/README.md` gives the two commands; the suite fails with a
 * readable message if either is missing.
 *
 * `workers: 1` and `fullyParallel: false` are deliberate. The flow is one
 * continuous story: an account is created, confirmed, signs in, creates an
 * event, invites a committee, and a second anonymous browser answers the
 * invitation. Running those steps concurrently would race on the same rows.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  outputDir: './e2e/.artifacts',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1440, height: 1000 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
