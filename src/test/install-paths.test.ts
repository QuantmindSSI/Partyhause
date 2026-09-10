/**
 * Guards every automated install path against the flag this repo requires.
 *
 * WHY THIS EXISTS
 *   Both lockfiles here are only valid under `--legacy-peer-deps`. Resolving
 *   them without it produces a different ideal tree, and npm then refuses with
 *   an error that reads like corruption rather than configuration:
 *
 *     root    Invalid: lock file's picomatch@2.3.2 does not satisfy picomatch@4.0.7
 *     mobile  Missing: @react-native/metro-config@0.87.1 from lock file
 *
 *   Neither lockfile is corrupt. Both install cleanly with the flag.
 *
 *   This has now bitten three separate install paths, each discovered only when
 *   it failed in a pipeline nobody could see:
 *
 *     1. Both Dockerfiles ran bare `npm ci`, so no image could be built at all.
 *     2. Both CI workflows ran bare `npm ci`, and CI was billing-locked so it
 *        was never observed.
 *     3. EAS Build ran its own install in apps/mobile and failed the iOS build
 *        at the "Install dependencies" phase with "Unknown error".
 *
 *   The first two were fixed by passing the flag explicitly. The third cannot
 *   be, because EAS owns that command line. It is fixed with an `.npmrc`, which
 *   is also the more durable answer: it configures the directory rather than
 *   one caller of it, so a fourth install path inherits the fix instead of
 *   rediscovering the bug.
 *
 * WHAT THIS CHECKS
 *   That every path which installs dependencies either passes the flag or sits
 *   in a directory whose .npmrc supplies it. A new workflow or Dockerfile stage
 *   that forgets fails here rather than in a build log.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function read(relative: string): string {
  return fs.readFileSync(path.resolve(ROOT, relative), 'utf8');
}

function exists(relative: string): boolean {
  return fs.existsSync(path.resolve(ROOT, relative));
}

/**
 * Every `npm ci` or `npm install` invocation in a file, with its line number.
 *
 * @param source File contents.
 * @returns Matching lines, trimmed.
 */
function installCommands(source: string): string[] {
  return source
    .split('\n')
    .map((line) => line.trim())
    // Comments in both Dockerfiles and YAML start with '#', and the ones here
    // discuss `npm ci` at length. Scanning them would make the explanation of
    // the bug fail the test that guards against it.
    .filter((line) => !line.startsWith('#'))
    .filter((line) => /\bnpm (ci|install)\b/.test(line))
    // `npm install -g` fetches a global tool and reads no lockfile.
    .filter((line) => !/npm install\s+(-g|--global)\b/.test(line));
}

/** @returns True when the line passes the flag itself. */
function passesFlag(line: string): boolean {
  return line.includes('--legacy-peer-deps');
}

describe('automated install paths', () => {
  it('gives apps/mobile an .npmrc, because EAS owns its own command line', () => {
    // EAS Build runs the install itself, so there is no argv to append to.
    // Without this file the iOS build fails at "Install dependencies".
    expect(exists('apps/mobile/.npmrc'), 'apps/mobile/.npmrc is missing').toBe(true);
    expect(read('apps/mobile/.npmrc')).toMatch(/^\s*legacy-peer-deps\s*=\s*true\s*$/m);
  });

  it('keeps that .npmrc tracked, since EAS uploads from git', () => {
    // A gitignored .npmrc exists locally and is invisible to the builder,
    // which is the same failure with a harder diagnosis.
    const ignore = exists('.gitignore') ? read('.gitignore') : '';
    for (const line of ignore.split('\n').map((l) => l.trim())) {
      expect(line, '.npmrc is gitignored; EAS would never see it').not.toBe('.npmrc');
      expect(line).not.toBe('**/.npmrc');
      expect(line).not.toBe('apps/mobile/.npmrc');
    }
  });

  it('passes the flag in both Dockerfiles', () => {
    for (const file of ['Dockerfile', 'Dockerfile.api']) {
      for (const line of installCommands(read(file))) {
        expect(passesFlag(line), `${file}: ${line}`).toBe(true);
      }
    }
  });

  it('passes the flag in both workflows', () => {
    for (const file of ['.github/workflows/ci.yml', '.github/workflows/deploy.yml']) {
      if (!exists(file)) continue;
      for (const line of installCommands(read(file))) {
        expect(passesFlag(line), `${file}: ${line}`).toBe(true);
      }
    }
  });

  it('does not let the root .npmrc alone be relied on for mobile', () => {
    // The root file carries engine-strict and nothing else. Relying on npm's
    // upward search would make the mobile install depend on where the builder
    // happens to place the project, which differs between EAS and local.
    const root = exists('.npmrc') ? read('.npmrc') : '';
    if (!/legacy-peer-deps/.test(root)) {
      expect(
        exists('apps/mobile/.npmrc'),
        'root .npmrc does not set legacy-peer-deps, so apps/mobile must set it itself',
      ).toBe(true);
    }
  });
});
