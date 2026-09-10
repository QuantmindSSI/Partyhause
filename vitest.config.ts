/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Vitest owns `src/`, Playwright owns `e2e/`. Stated explicitly because the
    // two runners claim overlapping filenames: vitest's default `include` is
    // `**/*.{test,spec}.?(c|m)[jt]s?(x)`, which swallows `e2e/*.spec.ts` and
    // then fails to collect it with "Playwright Test did not expect
    // test.describe() to be called here". That is a confusing way to learn the
    // suites are not separated, and it turned `npm run test:run` red without a
    // single assertion having failed.
    //
    // `include` alone is what fixes it; `exclude` restates the boundary from
    // the other side so that a future suite added outside `src/` fails by being
    // ignored rather than by poisoning this run. Both are kept deliberately.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    // Vitest's per-test budget, raised from its 5000ms default.
    //
    // src/test/setup.ts sets testing-library's asyncUtilTimeout to 5000ms so a
    // `waitFor` can outlast a slow React.lazy chunk. That only works if the test
    // itself is allowed to run longer than the wait it contains. Left at the
    // default the two were equal, so the test died at 5000ms and reported
    // "Test timed out" before the wait it was blocked on could ever resolve.
    //
    // 15000 leaves the wait a clear margin inside the budget. A passing test
    // finishes as soon as its condition is met, so this changes nothing on the
    // happy path and only affects how long a real failure takes to surface.
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'dist/',
        'coverage/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    target: 'node14',
  },
})
