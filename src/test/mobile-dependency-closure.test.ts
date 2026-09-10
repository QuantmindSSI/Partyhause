/**
 * Every package the mobile app imports must be declared by the mobile app.
 *
 * WHY THIS EXISTS
 *   `components/invites/InvitePreview.tsx` imported `date-fns`, which was never
 *   a dependency of apps/mobile. It resolved for months because apps/mobile was
 *   hoisted into the npm workspace, so Metro found the *web* app's copy at the
 *   repository root.
 *
 *   Giving mobile its own node_modules removed that copy, and the first real
 *   iOS build failed at the bundle phase:
 *
 *     Unable to resolve module date-fns from components/invites/InvitePreview.tsx
 *
 *   Nothing caught it earlier, and nothing could have. TypeScript resolved the
 *   import through the hoisted copy. The local bundler resolved it through
 *   `metro.config.js`, which lists the workspace root as a fallback
 *   `nodeModulesPaths` entry so edits to packages/core are picked up. Only a
 *   builder that installs *just* apps/mobile sees the truth, and that is EAS,
 *   which is the most expensive place to find out.
 *
 *   So this asserts the property directly, from source, against the manifest.
 *
 * WHY "DECLARED" AND NOT "RESOLVES"
 *   Vitest runs at the repository root, where the web app's node_modules is
 *   present and would satisfy `require.resolve` for exactly the packages this
 *   is meant to catch. Resolvability here proves nothing. Declaration does.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';

const ROOT = process.cwd();
const MOBILE = path.resolve(ROOT, 'apps/mobile');

/** Source trees Metro reaches from the expo-router entry point. */
const SOURCE_DIRS = ['app', 'components', 'hooks', 'lib', 'providers', 'utils', 'constants', 'types'];

/**
 * Specifiers that are real at runtime without appearing in package.json.
 *
 * `@/` is the app's own alias. `expo/...` subpaths come from `expo` itself,
 * which is declared. Nothing else earns a place here: an entry is a statement
 * that a package ships inside another, and that is exactly the assumption that
 * broke.
 */
const ALWAYS_AVAILABLE = new Set(['expo', 'react', 'react-native']);

const NODE_BUILTINS = new Set(builtinModules);

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** @returns Every source file Metro could pull in, as absolute paths. */
function sourceFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) found.push(full);
    }
  };
  for (const dir of SOURCE_DIRS) walk(path.join(MOBILE, dir));
  return found;
}

/**
 * Reduce an import specifier to the package that must be installed.
 *
 * `date-fns/locale` -> `date-fns`; `@expo/vector-icons/MaterialIcons` ->
 * `@expo/vector-icons`.
 *
 * @param specifier The raw string from the import or require.
 * @returns The package name, or null when it is not a package at all.
 */
function packageName(specifier: string): string | null {
  if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('@/')) {
    return null;
  }
  if (specifier.startsWith('node:')) return null;

  const parts = specifier.split('/');
  const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  return NODE_BUILTINS.has(name) ? null : name;
}

describe('mobile dependency closure', () => {
  it('declares every package it imports', () => {
    const manifest = readJson(path.join(MOBILE, 'package.json'));
    const declared = new Set([
      ...Object.keys((manifest.dependencies as Record<string, string>) ?? {}),
      ...Object.keys((manifest.devDependencies as Record<string, string>) ?? {}),
      ...ALWAYS_AVAILABLE,
    ]);

    const undeclared = new Map<string, string[]>();

    for (const file of sourceFiles()) {
      const source = fs.readFileSync(file, 'utf8');
      // Covers `from 'x'`, `require('x')` and `import('x')`.
      for (const match of source.matchAll(/(?:from\s+|require\(|import\()\s*['"]([^'"]+)['"]/g)) {
        const name = packageName(match[1]);
        if (name === null || declared.has(name)) continue;

        const users = undeclared.get(name) ?? [];
        users.push(path.relative(ROOT, file));
        undeclared.set(name, users);
      }
    }

    const report = [...undeclared.entries()]
      .map(([name, users]) => `  ${name} <- ${users.slice(0, 3).join(', ')}`)
      .join('\n');

    expect(
      [...undeclared.keys()],
      `apps/mobile imports packages it does not declare. These resolve locally through the web app's node_modules and will fail an EAS build:\n${report}`,
    ).toEqual([]);
  });

  it('keeps the workspace-root fallback out of the dependency story', () => {
    // metro.config.js lists the workspace root as a second nodeModulesPaths
    // entry so edits to packages/core rebuild. That fallback is why an
    // undeclared import can resolve locally and fail on EAS, so the file must
    // keep saying so rather than letting the next reader assume it is a
    // supported way to acquire dependencies.
    const metro = fs.readFileSync(path.join(MOBILE, 'metro.config.js'), 'utf8');
    expect(metro).toContain('nodeModulesPaths');
    expect(metro).toContain('packages/core');
  });

  it('does not reintroduce date-fns as a mobile dependency', () => {
    // The single call it served is now Intl, verified byte-identical. Adding
    // it back would mean carrying it against a second React major for one
    // format string.
    const manifest = readJson(path.join(MOBILE, 'package.json'));
    const declared = {
      ...((manifest.dependencies as Record<string, string>) ?? {}),
      ...((manifest.devDependencies as Record<string, string>) ?? {}),
    };
    expect(declared['date-fns']).toBeUndefined();
  });
});
