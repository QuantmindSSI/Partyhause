/**
 * Guards the identity an EAS build resolves the project by.
 *
 * WHY THIS EXISTS
 *   `eas init` wrote `extra.eas.projectId` and `owner` into
 *   `apps/mobile/app.json`. The shipped config is `app.config.ts`, which
 *   spreads app.json and then overrides `name`, `slug`, `scheme`, `ios`,
 *   `android` and `plugins`. The project id therefore reaches a build only
 *   because nothing in that file happens to set `extra`.
 *
 *   That is an accident of ordering, not a design. `eas.json` declares
 *   `appVersionSource: "remote"`, which asks Expo's servers for the build
 *   number and cannot resolve without a project id, so the failure mode is a
 *   build that cannot start rather than one that starts wrong. The two files
 *   disagreeing is already a documented hazard in this repository: app.json
 *   says `"slug": "mobile"` while app.config.ts says `partyhause-mobile`, and
 *   the plugin list is replaced wholesale.
 *
 *   These assertions are static, against the two files, rather than against
 *   `npx expo config`. Shelling out to the Expo CLI inside a unit test is slow
 *   and needs a full mobile install, and the property worth pinning is
 *   structural: does the id exist, and can the override clobber it.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_JSON = path.resolve(ROOT, 'apps/mobile/app.json');
const APP_CONFIG = path.resolve(ROOT, 'apps/mobile/app.config.ts');
const EAS_JSON = path.resolve(ROOT, 'apps/mobile/eas.json');

/** Canonical EAS project id form. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only the fields these assertions read. */
interface ExpoManifest {
  slug?: string;
  owner?: string;
  extra?: { eas?: { projectId?: string } };
}

interface EasConfig {
  cli?: { appVersionSource?: string };
  submit?: { production?: { ios?: Record<string, unknown> } };
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function appJson(): ExpoManifest {
  return readJson<{ expo: ExpoManifest }>(APP_JSON).expo;
}

/** app.config.ts source with comments stripped, so prose cannot satisfy a match. */
function configCode(): string {
  return fs
    .readFileSync(APP_CONFIG, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && !trimmed.startsWith('*');
    })
    .join('\n');
}

describe('EAS build identity', () => {
  it('carries a project id', () => {
    const id = appJson().extra?.eas?.projectId;
    expect(id, 'no extra.eas.projectId; run `npm run eas:init` in apps/mobile').toBeDefined();
    expect(String(id)).toMatch(UUID_RE);
  });

  it('names an owner account', () => {
    // Without this, EAS resolves the project against whichever account is
    // logged in, which differs between a laptop and CI.
    expect(appJson().owner, 'no owner in app.json').toBeTruthy();
  });

  it('does not let app.config.ts clobber extra', () => {
    // THE point of this file. `extra` reaches the build through the
    // `...config` spread. A literal `extra: { ... }` in app.config.ts would
    // replace it and drop the project id, and the only symptom would be a
    // build that will not start.
    const code = configCode();

    expect(code, 'app.config.ts must spread app.json').toContain('...config');

    // Permitted: `extra: { ...config.extra, ... }`. Prohibited: a literal.
    const literalExtra = /(^|[^.\w])extra\s*:\s*\{(?![^}]*\.\.\.config\.extra)/m;
    expect(
      literalExtra.test(code),
      'app.config.ts sets a literal `extra`, which drops extra.eas.projectId from app.json. Spread `...config.extra` first.',
    ).toBe(false);
  });

  it('keeps appVersionSource and the project id consistent', () => {
    // `remote` asks Expo's servers for the build number, which requires the
    // project to exist. Declaring it without an id is a build that cannot run.
    const eas = readJson<EasConfig>(EAS_JSON);
    if (eas.cli?.appVersionSource === 'remote') {
      expect(
        appJson().extra?.eas?.projectId,
        'appVersionSource is "remote" but no projectId exists',
      ).toBeDefined();
    }
  });

  it('resolves one slug, not two', () => {
    // app.json says "mobile" and app.config.ts overrides to
    // "partyhause-mobile". The override wins, and EAS registered the project
    // under it, so this pins the winning value rather than the stale one.
    expect(configCode()).toContain('slug: "partyhause-mobile"');
  });

  it('ships no placeholder submission credentials', () => {
    // A placeholder here is worse than an omission: `eas submit` reads it and
    // fails against Apple with an authentication error that reads like a
    // credential problem rather than a configuration one.
    const ios = readJson<EasConfig>(EAS_JSON).submit?.production?.ios ?? {};
    for (const [key, value] of Object.entries(ios)) {
      expect(String(value), `${key} looks like a placeholder`).not.toMatch(
        /REPLACE|TEAMID|example\.com|your-|XXXX/i,
      );
    }
    // The Team ID is real and must stay in step with the association file.
    expect(String(ios.appleTeamId)).toMatch(/^[A-Z0-9]{10}$/);
  });
});
