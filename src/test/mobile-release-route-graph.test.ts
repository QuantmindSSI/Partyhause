import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();
const appRoot = resolve(repositoryRoot, 'apps/mobile/app');
const mobileRoot = resolve(repositoryRoot, 'apps/mobile');
const sourceRoots = ['app', 'components', 'hooks', 'lib', 'providers'].map((path) =>
  resolve(mobileRoot, path),
);

const IMPLEMENTED_ROUTE_FILES = [
  '(tabs)/index.tsx',
  '(tabs)/account.tsx',
  'account/delete.tsx',
  'events/[id]/guests.tsx',
  'events/[id]/index.tsx',
  'events/[id]/invitations.tsx',
  'events/create/index.tsx',
] as const;

const FORBIDDEN_DESTINATIONS = [
  '/partycrew',
  '/feed/',
  '/profile/',
  '/explore',
  '/games',
  '/planning',
] as const;

function listFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) {
      files.push(...listFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function routeFiles(): string[] {
  return listFiles(appRoot)
    .filter((path) => path.endsWith('.tsx') && !path.endsWith('/_layout.tsx'))
    .map((path) => relative(appRoot, path))
    .sort();
}

describe('mobile route boundary', () => {
  it('contains only the currently implemented route files', () => {
    expect(routeFiles()).toEqual([...IMPLEMENTED_ROUTE_FILES].sort());
  });

  it('does not retain social route source files', () => {
    expect(existsSync(resolve(appRoot, '(tabs)/partycrew.tsx'))).toBe(false);
    expect(existsSync(resolve(appRoot, 'feed/[postId]/comments.tsx'))).toBe(false);
    expect(existsSync(resolve(appRoot, 'profile/[id].tsx'))).toBe(false);
  });

  it('does not navigate to excluded destinations', () => {
    const sourceFiles = sourceRoots.flatMap(listFiles).filter(
      (path) => /\.(ts|tsx)$/.test(path) && !path.includes('/_deferred/'),
    );
    const violations: string[] = [];

    for (const path of sourceFiles) {
      const source = readFileSync(path, 'utf8');
      for (const destination of FORBIDDEN_DESTINATIONS) {
        if (source.includes(destination)) {
          violations.push(`${relative(repositoryRoot, path)} -> ${destination}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('does not declare deleted child screens', () => {
    const tabs = readFileSync(resolve(appRoot, '(tabs)/_layout.tsx'), 'utf8');
    const event = readFileSync(resolve(appRoot, 'events/[id]/_layout.tsx'), 'utf8');

    expect(tabs).not.toContain('name="partycrew"');
    expect(event).not.toContain('name="games"');
    expect(event).not.toContain('name="planning"');
  });

  it('keeps the event, guest, and invitation slice inside the approved screens', () => {
    const eventForm = readFileSync(resolve(appRoot, 'events/create/index.tsx'), 'utf8');
    const eventDetail = readFileSync(resolve(appRoot, 'events/[id]/index.tsx'), 'utf8');
    const guests = readFileSync(resolve(appRoot, 'events/[id]/guests.tsx'), 'utf8');
    const invitations = readFileSync(resolve(appRoot, 'events/[id]/invitations.tsx'), 'utf8');

    expect(eventForm).toContain('api.events.create');
    expect(eventForm).toContain('api.events.update');
    expect(eventForm).toContain('eventId');
    expect(eventDetail).toContain('api.events.publish');
    expect(eventDetail).toContain('api.events.cancel');
    expect(eventDetail).toContain('api.events.remove');
    expect(guests).toContain('api.guests.create');
    expect(guests).toContain('api.guests.update');
    expect(guests).toContain('api.guests.remove');
    expect(guests).toContain('api.guests.checkIn');
    expect(guests).toContain('api.guests.correctCheckIn');
    expect(eventDetail).toContain(`/events/\${event.id}/invitations`);
    expect(invitations).toContain('api.invitations.getForEvent');
    expect(invitations).toContain('api.invitations.send');
    expect(invitations).toContain('No guests are selected automatically');
    expect(invitations).not.toMatch(/invite-templates|send-email|email-logs|QRCode|customHtml/i);
  });

  it('keeps one flat invitation route and no legacy invitation route tree', () => {
    expect(existsSync(resolve(appRoot, 'events/[id]/invitations.tsx'))).toBe(true);
    const legacyDirectory = resolve(appRoot, 'events/[id]/invites');
    expect(existsSync(legacyDirectory) ? listFiles(legacyDirectory) : []).toEqual([]);
    const event = readFileSync(resolve(appRoot, 'events/[id]/_layout.tsx'), 'utf8');
    expect(event).toContain('name="invitations"');
    expect(event).not.toContain('name="invites"');
  });

  it('does not retain obsolete local event or guest model adapters', () => {
    expect(existsSync(resolve(mobileRoot, 'lib/mappers.ts'))).toBe(false);
    expect(existsSync(resolve(mobileRoot, 'types/event.ts'))).toBe(false);
    expect(existsSync(resolve(mobileRoot, 'types/guest.ts'))).toBe(false);
  });

  it('mounts the root navigator before applying the authenticated route guard', () => {
    const root = readFileSync(resolve(appRoot, '_layout.tsx'), 'utf8');

    expect(root).toContain('<Stack.Protected guard={privateRoutesAllowed}>');
    expect(root).toContain('<AppStack privateRoutesAllowed={status === \'authenticated\'} />');
    expect(root).not.toContain('<Redirect');
  });

  it('keeps account deletion reachable and requires password plus exact confirmation', () => {
    const dashboard = readFileSync(resolve(mobileRoot, 'components/screens/DashboardScreen.tsx'), 'utf8');
    const account = readFileSync(resolve(appRoot, '(tabs)/account.tsx'), 'utf8');
    const deletion = readFileSync(resolve(appRoot, 'account/delete.tsx'), 'utf8');

    expect(dashboard).toContain("router.push('/account'");
    expect(account).toContain("router.push('/account/delete'");
    expect(account).toContain('LEGAL_URLS.privacy');
    expect(account).toContain('LEGAL_URLS.terms');
    expect(account).toContain('LEGAL_URLS.support');
    expect(deletion).toContain('api.account.createDeletionIntent(password)');
    expect(deletion).toContain("confirmation !== 'DELETE'");
    expect(deletion).toContain('finishAccountDeletion(receipt)');
  });
});
