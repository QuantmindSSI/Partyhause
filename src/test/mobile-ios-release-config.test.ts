import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import createAppConfig from '../../apps/mobile/app.config';

const repositoryRoot = process.cwd();
const mobileRoot = resolve(repositoryRoot, 'apps/mobile');
const config = createAppConfig({ config: {} } as never);
const require = createRequire(import.meta.url);
const strictInstallPaths = [
  '.npmrc',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  'Dockerfile',
  'Dockerfile.api',
  'scripts/build-mobile-pwa.cjs',
  'scripts/build-mobile-pwa.sh',
  'scripts/deploy-mobile-pwa.sh',
] as const;

function configuredPath(path: string): string {
  return resolve(mobileRoot, path.replace(/^\.\//, ''));
}

describe('mobile iOS release configuration', () => {
  it('targets iPhone without protected-resource purpose strings', () => {
    expect(config.ios?.supportsTablet).toBe(false);
    expect(config.platforms).toEqual(['ios']);
    expect(config.ios?.bundleIdentifier).toBe('com.partyhause.mobile');
    expect(config.ios?.buildNumber).toBe('1');
    expect(config.ios?.config?.usesNonExemptEncryption).toBe(false);
    expect(config).not.toHaveProperty('newArchEnabled');
    expect(config.plugins).toContain('@react-native-community/datetimepicker');
    expect(Object.keys(config.ios?.infoPlist ?? {}).filter((key) => /^NS.*UsageDescription$/.test(key)))
      .toEqual([]);
    const buildProperties = config.plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
    );
    expect(Array.isArray(buildProperties)).toBe(true);
    expect((buildProperties as [string, { ios: { deploymentTarget: string } }])[1].ios.deploymentTarget)
      .toBe('17.0');
  });

  it('removes stale sensitive usage descriptions during native prebuild', () => {
    const plugin = require('../../apps/mobile/plugins/with-minimal-ios-permissions.js') as {
      stripSensitiveUsageDescriptions(infoPlist: Record<string, unknown>): Record<string, unknown>;
    };
    const infoPlist = plugin.stripSensitiveUsageDescriptions({
      CFBundleDisplayName: 'PartyHause',
      NSCameraUsageDescription: 'stale',
      NSContactsUsageDescription: 'stale',
      NSMicrophoneUsageDescription: 'stale',
      NSPhotoLibraryUsageDescription: 'stale',
    });

    expect(infoPlist).toEqual({ CFBundleDisplayName: 'PartyHause' });
  });

  it('uses one dynamic Expo configuration', () => {
    expect(existsSync(resolve(mobileRoot, 'app.json'))).toBe(false);
    expect(config.name).toBe('PartyHause');
    expect(config.slug).toBe('partyhause-mobile');
    expect(config.scheme).toBe('partyhause');
    expect(config.description).not.toMatch(/photo|video|social/i);
  });

  it('uses the canonical opaque 1024px PartyHause app icon', async () => {
    const iconPath = configuredPath(config.icon ?? '');
    const canonicalPath = resolve(repositoryRoot, 'public/brand/partyhause-app-icon.svg');
    const metadata = await sharp(iconPath).metadata();
    const [actual, canonical] = await Promise.all([
      sharp(iconPath).raw().toBuffer(),
      sharp(canonicalPath).resize(1024, 1024).removeAlpha().raw().toBuffer(),
    ]);

    expect(metadata.width).toBe(1024);
    expect(metadata.height).toBe(1024);
    expect(metadata.hasAlpha).toBe(false);
    expect(actual.equals(canonical)).toBe(true);
  });

  it('configures branded light and dark splash artwork', async () => {
    const splashPlugin = config.plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
    );
    expect(Array.isArray(splashPlugin)).toBe(true);
    const options = (splashPlugin as [string, {
      image: string;
      backgroundColor: string;
      dark: { image: string; backgroundColor: string };
    }])[1];
    const light = await sharp(configuredPath(options.image)).metadata();
    const dark = await sharp(configuredPath(options.dark.image)).metadata();

    expect(options.backgroundColor).toBe('#FBFAF9');
    expect(options.dark.backgroundColor).toBe('#181311');
    expect(light.width).toBe(512);
    expect(light.height).toBe(512);
    expect(light.hasAlpha).toBe(true);
    expect(dark.width).toBe(512);
    expect(dark.height).toBe(512);
    expect(dark.hasAlpha).toBe(true);
  });

  it('pins the EAS toolchain and excludes permission-bearing packages', () => {
    const eas = JSON.parse(readFileSync(resolve(mobileRoot, 'eas.json'), 'utf8')) as {
      cli: { version: string };
      build: Record<string, { node: string }>;
    };
    const manifest = JSON.parse(readFileSync(resolve(mobileRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      scripts: Record<string, string>;
    };
    const rootManifest = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    const npmConfig = readFileSync(resolve(repositoryRoot, '.npmrc'), 'utf8');
    const babelConfig = readFileSync(resolve(mobileRoot, 'babel.config.js'), 'utf8');
    const peerBypasses = strictInstallPaths.filter((path) =>
      readFileSync(resolve(repositoryRoot, path), 'utf8').includes('legacy-peer-deps'),
    );

    expect(eas.cli.version).toBe('23.2.0');
    expect(Object.values(eas.build).every((profile) => profile.node === '22.22.0')).toBe(true);
    expect(manifest.devDependencies).not.toHaveProperty('eas-cli');
    expect(manifest.scripts['build:ios:production']).toContain('eas-cli@23.2.0');
    expect(manifest.dependencies).not.toHaveProperty('expo-av');
    expect(manifest.dependencies).not.toHaveProperty('expo-contacts');
    expect(manifest.dependencies).not.toHaveProperty('expo-video');
    expect(manifest.dependencies).not.toHaveProperty('@react-navigation/native');
    expect(manifest.dependencies['expo']).toBe('~57.0.20');
    expect(manifest.dependencies['expo-router']).toBe('~57.0.19');
    expect(manifest.dependencies['expo-build-properties']).toBe('~57.0.17');
    expect(manifest.dependencies['expo-secure-store']).toBe('~57.0.3');
    expect(manifest.dependencies['react']).toBe('19.2.3');
    expect(manifest.dependencies['react-native']).toBe('0.86.3');
    expect(manifest.dependencies['react-native-reanimated']).toBe('4.5.1');
    expect(manifest.dependencies['react-native-worklets']).toBe('0.10.1');
    expect(manifest.devDependencies['@react-native/metro-config']).toBe('0.86.3');
    expect(manifest.devDependencies['typescript']).toBe('~6.0.3');
    expect(manifest.dependencies['react']).toBe(rootManifest.dependencies['react']);
    expect(babelConfig).not.toContain('react-native-reanimated/plugin');
    expect(npmConfig).toContain('engine-strict=true');
    expect(npmConfig).not.toContain('legacy-peer-deps');
    expect(peerBypasses).toEqual([]);
  });
});
