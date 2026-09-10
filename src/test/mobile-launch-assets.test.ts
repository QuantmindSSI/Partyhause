/**
 * Guards the iOS and Android launch assets against regressing to template art.
 *
 * WHY THIS EXISTS
 *   `apps/mobile/assets/images/` shipped the stock Expo template art for the
 *   entire life of the mobile app: `icon.png` was a blue chevron with the
 *   layout construction guides still visible, and `splash-icon.png` was grey
 *   concentric circles on a grid. Neither had anything to do with PartyHause.
 *
 *   The brand they should have been carrying had existed as vector in
 *   `public/brand/*.svg` since 2026-08-30, and `docs/BRAND.md` specified every
 *   token. Nothing connected the two, and nothing failed, because an icon is
 *   never imported by any module: a bundler cannot tell you the picture is
 *   wrong. App Review can, under guideline 4.3.
 *
 *   A dimension check alone would not have caught it. The template icon was a
 *   correct 1024x1024 with no alpha; it was compliant in every respect except
 *   the only one that mattered. So this file checks provenance, not just shape.
 *
 * WHAT IT CHECKS
 *   1. Every image `app.config.ts` names exists on disk.
 *   2. The iOS icon is 1024x1024 and carries no alpha channel, which Apple
 *      rejects.
 *   3. The Android adaptive layers are square and agree on size.
 *   4. A distinct dark splash asset is wired. The standard mark's body is
 *      neutral-900 #26201D against a #000000 dark background, so sharing one
 *      image ships a roof with no visible house beneath it.
 *   5. The adaptive icon's fallback colour is a real brand token, not the
 *      template's #E6F4FE.
 *   6. The brand vectors the generator reads from are all still present.
 *
 *   Byte-level drift between the vectors and the PNGs is not asserted here.
 *   That is `npm run icons:mobile:check`, which runs inside `build:check`;
 *   re-rendering seven images would make this suite slow for no extra signal.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MOBILE_IMAGES = path.resolve(ROOT, 'apps/mobile/assets/images');
const APP_CONFIG = path.resolve(ROOT, 'apps/mobile/app.config.ts');
const BRAND_DIR = path.resolve(ROOT, 'public/brand');

/** PNG colour types that carry an alpha channel. See PNG spec 11.2.2. */
const COLOUR_TYPE_GREY_ALPHA = 4;
const COLOUR_TYPE_RGBA = 6;

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

interface PngHeader {
  width: number;
  height: number;
  hasAlpha: boolean;
}

/**
 * Read a PNG's IHDR without decoding pixels.
 *
 * @param file Absolute path to a PNG.
 * @returns Dimensions and whether an alpha channel is declared.
 * @throws If the file is absent or is not a PNG.
 */
function readPngHeader(file: string): PngHeader {
  if (!fs.existsSync(file)) {
    throw new Error(`missing asset: ${path.relative(ROOT, file)}`);
  }
  const bytes = fs.readFileSync(file);
  expect([...bytes.subarray(0, 8)], `${path.basename(file)} is not a PNG`).toEqual(PNG_SIGNATURE);

  const colourType = bytes.readUInt8(25);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    hasAlpha: colourType === COLOUR_TYPE_GREY_ALPHA || colourType === COLOUR_TYPE_RGBA,
  };
}

/** @returns The raw text of apps/mobile/app.config.ts. */
function appConfigSource(): string {
  return fs.readFileSync(APP_CONFIG, 'utf8');
}

/**
 * Every `./assets/images/...png` path the Expo config references.
 *
 * Read from source rather than by evaluating the config: the config is a
 * TypeScript module expecting Expo's ConfigContext, and the assertion here is
 * about which files are named, which the text answers directly.
 *
 * @returns Absolute paths, de-duplicated.
 */
function referencedImages(): string[] {
  const matches = appConfigSource().matchAll(/"\.\/assets\/(images\/[\w.-]+\.png)"/g);
  const seen = new Set<string>();
  for (const match of matches) seen.add(match[1]);
  return [...seen].map((rel) => path.resolve(ROOT, 'apps/mobile/assets', rel));
}

describe('mobile launch assets', () => {
  it('every image referenced by app.config.ts exists', () => {
    const referenced = referencedImages();
    expect(referenced.length, 'app.config.ts references no images').toBeGreaterThanOrEqual(6);

    for (const file of referenced) {
      expect(fs.existsSync(file), `missing: ${path.relative(ROOT, file)}`).toBe(true);
    }
  });

  it('the iOS app icon is 1024x1024 with no alpha channel', () => {
    // Apple rejects icons containing an alpha channel, and applies the corner
    // mask itself, so the source must be an opaque square.
    const header = readPngHeader(path.join(MOBILE_IMAGES, 'icon.png'));
    expect(header.width).toBe(1024);
    expect(header.height).toBe(1024);
    expect(header.hasAlpha, 'iOS icons must not carry alpha').toBe(false);
  });

  it('the Android adaptive layers are square and the same size', () => {
    const foreground = readPngHeader(path.join(MOBILE_IMAGES, 'android-icon-foreground.png'));
    const background = readPngHeader(path.join(MOBILE_IMAGES, 'android-icon-background.png'));
    const monochrome = readPngHeader(path.join(MOBILE_IMAGES, 'android-icon-monochrome.png'));

    for (const [name, header] of [
      ['foreground', foreground],
      ['background', background],
      ['monochrome', monochrome],
    ] as const) {
      expect(header.width, `${name} is not square`).toBe(header.height);
    }

    expect(foreground.width).toBe(background.width);
    expect(foreground.width).toBe(monochrome.width);

    // The foreground and monochrome are masked by the OEM, so they must keep
    // an alpha channel; the background is composited beneath and must not.
    expect(foreground.hasAlpha, 'adaptive foreground needs alpha').toBe(true);
    expect(monochrome.hasAlpha, 'monochrome layer needs alpha').toBe(true);
    expect(background.hasAlpha, 'adaptive background should be opaque').toBe(false);
  });

  it('wires a distinct dark splash asset', () => {
    const source = appConfigSource();

    // The dark block must name its own image. Without one, Expo reuses the
    // light asset, whose #26201D body vanishes against the #000000 background.
    const darkBlock = source.match(/dark:\s*\{[\s\S]*?\}/);
    expect(darkBlock, 'app.config.ts declares no dark splash block').not.toBeNull();
    expect(darkBlock?.[0], 'dark splash has no image of its own').toContain(
      'splash-icon-dark.png',
    );

    const light = path.join(MOBILE_IMAGES, 'splash-icon.png');
    const dark = path.join(MOBILE_IMAGES, 'splash-icon-dark.png');
    readPngHeader(light);
    readPngHeader(dark);

    expect(
      fs.readFileSync(light).equals(fs.readFileSync(dark)),
      'light and dark splash are the same file, so one of the two backgrounds hides the mark',
    ).toBe(false);
  });

  it('uses a brand token for the adaptive icon background colour', () => {
    // docs/BRAND.md section 4. The Expo template shipped #E6F4FE, which is not
    // in the palette and is what this replaced.
    const BRAND_COLOURS = ['#FF5233', '#EA361A', '#C02A16', '#972317', '#EC4699', '#B62066', '#26201D', '#FBFAF9'];

    const match = appConfigSource().match(/adaptiveIcon:\s*\{[\s\S]*?backgroundColor:\s*"(#[0-9A-Fa-f]{6})"/);
    expect(match, 'adaptiveIcon declares no backgroundColor').not.toBeNull();

    const colour = match![1].toUpperCase();
    expect(colour, `${colour} is not a docs/BRAND.md token`).toBeOneOf(BRAND_COLOURS);
    expect(colour, 'the Expo template background colour is still set').not.toBe('#E6F4FE');
  });

  it('retains the brand vectors the generator renders from', () => {
    // scripts/generate-mobile-icons.mjs reads these. Deleting one turns a
    // regenerate into a hard failure, which is correct, but it should fail
    // here first with a clearer message.
    const required = [
      'partyhause-app-icon.svg',
      'partyhause-mark.svg',
      'partyhause-mark-inverse.svg',
      'partyhause-mark-mono.svg',
      'partyhause-favicon.svg',
    ];

    for (const name of required) {
      const file = path.join(BRAND_DIR, name);
      expect(fs.existsSync(file), `brand vector missing: public/brand/${name}`).toBe(true);
      expect(fs.readFileSync(file, 'utf8')).toContain('<svg');
    }
  });
});
