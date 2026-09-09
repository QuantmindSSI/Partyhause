'use strict';

const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '../apps/mobile/dist');
const EXCLUDED_ENDPOINTS = [
  '/api/events',
  '/api/guests',
  '/api/invite-templates',
  '/api/invites',
  '/api/email-logs',
  '/api/feed',
  '/api/notifications',
  '/api/partycrew',
  '/api/polls',
  '/api/send-email',
  '/api/storage',
  '/api/timeline',
];

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(target));
    else files.push(target);
  }
  return files;
}

function main() {
  const bundles = listFiles(DIST).filter((file) => file.endsWith('.hbc') || file.endsWith('.js'));
  if (bundles.length === 0) {
    throw new Error('No exported iOS JavaScript or Hermes bundle was found');
  }

  const violations = [];
  for (const file of bundles) {
    const content = fs.readFileSync(file);
    for (const endpoint of EXCLUDED_ENDPOINTS) {
      if (content.includes(Buffer.from(endpoint))) {
        violations.push(`${path.relative(DIST, file)} contains ${endpoint}`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Excluded API capabilities found in iOS export:\n${violations.join('\n')}`);
  }
  console.log(`PASS: ${bundles.length} iOS bundle file(s) exclude removed API capabilities`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
