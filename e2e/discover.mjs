/**
 * Discovery pass, not a test.
 *
 * Reports what the running UI actually exposes at a given route: headings, the
 * accessible name of every control, and every form field. Selectors for the
 * real end-to-end flow are derived from this output rather than guessed, which
 * is the difference between a test that exercises the app and one that fails
 * on a class name nobody changed.
 *
 * Usage: node e2e/discover.mjs <path> [<path> ...]
 */

import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const paths = process.argv.slice(2);

if (paths.length === 0) {
  console.error('usage: node e2e/discover.mjs <path> [<path> ...]');
  process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

for (const path of paths) {
  consoleErrors.length = 0;
  const response = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });

  // The app is a SPA behind a lazy-loaded route tree; give the chunk a moment
  // to resolve before reading the accessibility tree, or every page reports as
  // an empty shell.
  await page.waitForTimeout(1200);

  const found = await page.evaluate(() => {
    const text = (el) => (el.innerText ?? el.textContent ?? '').trim().replace(/\s+/g, ' ');
    const visible = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    return {
      title: document.title,
      headings: [...document.querySelectorAll('h1,h2,h3')]
        .filter(visible)
        .map((h) => `${h.tagName}: ${text(h)}`)
        .slice(0, 12),
      controls: [...document.querySelectorAll('button,a[href],[role="button"],[role="tab"]')]
        .filter(visible)
        .map((el) => {
          const label = text(el) || el.getAttribute('aria-label') || el.getAttribute('title') || '';
          const href = el.getAttribute('href');
          return `${el.tagName}${href ? `[href=${href}]` : ''}: ${label.slice(0, 60)}`;
        })
        .filter((entry) => !entry.endsWith(': '))
        .slice(0, 30),
      fields: [...document.querySelectorAll('input,textarea,select')]
        .filter(visible)
        .map((el) => {
          const id = el.getAttribute('id');
          const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
          return [
            el.tagName.toLowerCase(),
            el.getAttribute('type') ?? '',
            el.getAttribute('name') ?? '',
            el.getAttribute('placeholder') ?? '',
            label ? text(label) : '',
          ]
            .filter(Boolean)
            .join(' | ');
        })
        .slice(0, 20),
    };
  });

  console.log(`\n=== ${path}  [HTTP ${response?.status() ?? '?'}]  "${found.title}" ===`);
  console.log('  headings:');
  for (const heading of found.headings) console.log(`    ${heading}`);
  console.log('  controls:');
  for (const control of found.controls) console.log(`    ${control}`);
  console.log('  fields:');
  for (const field of found.fields) console.log(`    ${field}`);
  if (consoleErrors.length > 0) {
    console.log('  console errors:');
    for (const error of consoleErrors.slice(0, 5)) console.log(`    ${error.slice(0, 160)}`);
  }
}

await browser.close();
