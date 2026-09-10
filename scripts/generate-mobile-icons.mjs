#!/usr/bin/env node
/**
 * Rasterise the PartyHause brand vectors into the launch assets Expo ships.
 *
 * Why this exists: `apps/mobile/assets/images/` held the stock Expo template
 * art (a blue chevron with the layout guides still visible, and a grey
 * concentric-circle splash). The brand it should have been carrying has lived
 * in `public/brand/*.svg` since 2026-08-30. An App Store submission carrying
 * template icons is rejected under guideline 4.3.
 *
 * Why vectors rather than the brand sheet PNG: a crop of the app-icon tile out
 * of `Partyhause.png` yields 132x132 real pixels for a slot that demands
 * 1024x1024, and carries the sheet's page background and pre-applied corner
 * rounding into an asset iOS masks itself. Rendering from source is both
 * sharper and correct.
 *
 * Usage:  node scripts/generate-mobile-icons.mjs [--check]
 *   (no flag)  write the assets
 *   --check    verify on-disk assets match what this script would produce,
 *              exit 1 on mismatch. Intended for CI.
 *
 * Dependencies: `sharp`, already declared in devDependencies for the PWA icon
 * pipeline. No new package is introduced.
 * Complexity: O(n) in the number of assets; each render is bounded by target
 * pixel area. Blocking I/O throughout, which is correct for a build script.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRAND_DIR = join(REPO_ROOT, 'public', 'brand');
const OUT_DIR = join(REPO_ROOT, 'apps', 'mobile', 'assets', 'images');

/** Brand tokens. Mirrors docs/BRAND.md section 4; do not diverge. */
const BRAND = {
  coral500: '#FF5233',
  magenta500: '#EC4699',
  neutral900: '#26201D',
  white: '#FFFFFF',
};

/**
 * Android adaptive icons are 108dp with only the central 72dp guaranteed
 * visible under every OEM mask. 72/108 = 2/3.
 */
const ANDROID_SAFE_ZONE_RATIO = 2 / 3;

/**
 * BRAND.md section 3.4 fixes clear space at 14.6% of the mark's height per
 * side. A mark of height M therefore occupies M * (1 + 2 * 0.146) once its
 * clear space is honoured, and that total is what must fit the safe zone.
 */
const CLEAR_SPACE_RATIO = 0.146;

/**
 * Largest mark height that fits `canvas`'s Android safe zone with brand clear
 * space intact.
 *
 * @param {number} canvas Square canvas edge in pixels. Must be > 0.
 * @returns {number} Mark edge in pixels, floored to an integer.
 */
function markEdgeWithinSafeZone(canvas) {
  if (!Number.isFinite(canvas) || canvas <= 0) {
    throw new Error(`canvas must be a positive number, received ${canvas}`);
  }
  const safeZone = canvas * ANDROID_SAFE_ZONE_RATIO;
  return Math.floor(safeZone / (1 + 2 * CLEAR_SPACE_RATIO));
}

/**
 * Largest mark height that fits `canvas` with brand clear space intact.
 *
 * Splash screens are not masked, so the Android safe zone does not apply and
 * insetting by it would shrink the logo for no reason: `imageWidth: 200` in
 * app.config.ts scales the whole canvas, so padding baked into the asset comes
 * straight off the rendered logo.
 *
 * @param {number} canvas Square canvas edge in pixels. Must be > 0.
 * @returns {number} Mark edge in pixels, floored to an integer.
 */
function markEdgeWithClearSpace(canvas) {
  if (!Number.isFinite(canvas) || canvas <= 0) {
    throw new Error(`canvas must be a positive number, received ${canvas}`);
  }
  return Math.floor(canvas / (1 + 2 * CLEAR_SPACE_RATIO));
}

/**
 * Load a brand SVG and pin its intrinsic size, so the renderer rasterises at
 * the target resolution rather than at the viewBox's implied 72dpi and then
 * upscaling. `currentColor` has no cascade outside a document, so any source
 * using it must be given a concrete colour here.
 *
 * @param {string} name File name inside public/brand, without extension.
 * @param {number} edge Target square edge in pixels.
 * @param {string|null} currentColor Replacement for `currentColor`, or null.
 * @returns {Promise<Buffer>} SVG markup ready to hand to sharp.
 * @throws {Error} If the file is absent or contains an unresolved currentColor.
 */
async function loadVector(name, edge, currentColor = null) {
  const path = join(BRAND_DIR, `${name}.svg`);
  if (!existsSync(path)) {
    throw new Error(`brand vector missing: ${path}`);
  }
  let svg = await readFile(path, 'utf8');

  if (svg.includes('currentColor')) {
    if (currentColor === null) {
      throw new Error(
        `${name}.svg uses currentColor but no replacement was supplied; ` +
          'it would render black by accident rather than by decision',
      );
    }
    svg = svg.replaceAll('currentColor', currentColor);
  }

  // Replace any existing width/height, then declare ours on the root element.
  svg = svg.replace(/<svg([^>]*?)>/, (_match, attrs) => {
    const cleaned = attrs
      .replace(/\swidth="[^"]*"/g, '')
      .replace(/\sheight="[^"]*"/g, '');
    return `<svg${cleaned} width="${edge}" height="${edge}">`;
  });

  return Buffer.from(svg, 'utf8');
}

/**
 * Full-bleed brand gradient as an SVG buffer.
 *
 * BRAND.md specifies `linear-gradient(135deg, #FF5233 0%, #EC4699 100%)`.
 * CSS 135deg runs top-left to bottom-right, which in objectBoundingBox terms
 * is (0,0) to (1,1).
 *
 * @param {number} edge Square edge in pixels.
 * @returns {Buffer} SVG markup.
 */
function gradientVector(edge) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${edge}" height="${edge}" viewBox="0 0 ${edge} ${edge}">` +
      '<defs><linearGradient id="phg" x1="0" y1="0" x2="1" y2="1">' +
      `<stop offset="0" stop-color="${BRAND.coral500}"/>` +
      `<stop offset="1" stop-color="${BRAND.magenta500}"/>` +
      '</linearGradient></defs>' +
      `<rect width="${edge}" height="${edge}" fill="url(#phg)"/></svg>`,
    'utf8',
  );
}

/**
 * Render an SVG buffer to PNG at an exact square size.
 *
 * @param {Buffer} svg SVG markup with pinned width/height.
 * @param {number} edge Target edge in pixels.
 * @param {string|null} flattenTo Background colour to composite onto, removing
 *   the alpha channel. iOS app icons must not carry alpha. Null keeps alpha.
 * @returns {Promise<Buffer>} PNG bytes.
 */
async function renderPng(svg, edge, flattenTo = null) {
  let pipeline = sharp(svg, { density: 384 }).resize(edge, edge, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (flattenTo !== null) {
    pipeline = pipeline.flatten({ background: flattenTo });
  }
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Centre a rendered mark on a transparent square canvas, honouring the Android
 * safe zone. Used for the adaptive foreground and monochrome layers, which are
 * masked by the OEM and must not run to the canvas edge.
 *
 * @param {Buffer} markSvg Mark SVG, already sized to `markEdge`.
 * @param {number} canvasEdge Output canvas edge in pixels.
 * @param {number} markEdge Mark edge in pixels. Must be <= canvasEdge.
 * @returns {Promise<Buffer>} PNG bytes with alpha.
 */
async function centreOnCanvas(markSvg, canvasEdge, markEdge) {
  if (markEdge > canvasEdge) {
    throw new Error(`mark ${markEdge}px cannot fit canvas ${canvasEdge}px`);
  }
  const mark = await renderPng(markSvg, markEdge);
  const offset = Math.round((canvasEdge - markEdge) / 2);
  return sharp({
    create: {
      width: canvasEdge,
      height: canvasEdge,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const ICON_EDGE = 1024;
const SPLASH_EDGE = 1024;
const FAVICON_EDGE = 48;
const ADAPTIVE_MARK_EDGE = markEdgeWithinSafeZone(ICON_EDGE);
const SPLASH_MARK_EDGE = markEdgeWithClearSpace(SPLASH_EDGE);

/**
 * The asset manifest. Every entry states the invariant it must satisfy so a
 * regression is caught by --check rather than by App Review.
 *
 * @type {Array<{file: string, edge: number, alpha: boolean, why: string,
 *               build: () => Promise<Buffer>}>}
 */
const ASSETS = [
  {
    file: 'icon.png',
    edge: ICON_EDGE,
    alpha: false,
    why: 'iOS app icon. Apple rejects alpha; the corner mask is applied by iOS, so the source is square.',
    build: async () =>
      renderPng(await loadVector('partyhause-app-icon', ICON_EDGE), ICON_EDGE, BRAND.coral500),
  },
  {
    file: 'splash-icon.png',
    edge: SPLASH_EDGE,
    alpha: true,
    why: 'Light splash. Full-colour mark on the #ffffff background set in app.config.ts.',
    build: async () =>
      centreOnCanvas(
        await loadVector('partyhause-mark', SPLASH_MARK_EDGE),
        SPLASH_EDGE,
        SPLASH_MARK_EDGE,
      ),
  },
  {
    file: 'splash-icon-dark.png',
    edge: SPLASH_EDGE,
    alpha: true,
    why: 'Dark splash. The standard mark body is #26201D and would be invisible on the #000000 dark background, so this uses the inverse mark.',
    build: async () =>
      centreOnCanvas(
        await loadVector('partyhause-mark-inverse', SPLASH_MARK_EDGE),
        SPLASH_EDGE,
        SPLASH_MARK_EDGE,
      ),
  },
  {
    file: 'android-icon-background.png',
    edge: ICON_EDGE,
    alpha: false,
    why: 'Adaptive background layer. Brand gradient, full bleed, opaque.',
    build: async () => renderPng(gradientVector(ICON_EDGE), ICON_EDGE, BRAND.coral500),
  },
  {
    file: 'android-icon-foreground.png',
    edge: ICON_EDGE,
    alpha: true,
    why: 'Adaptive foreground. All-white mark so it reads against the gradient background; held inside the 2/3 safe zone with brand clear space.',
    build: async () =>
      centreOnCanvas(
        await loadVector('partyhause-mark-mono', ADAPTIVE_MARK_EDGE, BRAND.white),
        ICON_EDGE,
        ADAPTIVE_MARK_EDGE,
      ),
  },
  {
    file: 'android-icon-monochrome.png',
    edge: ICON_EDGE,
    alpha: true,
    why: 'Android 13 themed icon. The system tints from the alpha channel, so the fill colour only needs to be opaque and uniform.',
    build: async () =>
      centreOnCanvas(
        await loadVector('partyhause-mark-mono', ADAPTIVE_MARK_EDGE, BRAND.neutral900),
        ICON_EDGE,
        ADAPTIVE_MARK_EDGE,
      ),
  },
  {
    file: 'favicon.png',
    edge: FAVICON_EDGE,
    alpha: true,
    why: 'Expo web export favicon. Uses the favicon vector, which drops the confetti so the mark survives at 48px.',
    build: async () => renderPng(await loadVector('partyhause-favicon', FAVICON_EDGE), FAVICON_EDGE),
  },
];

/**
 * Assert a produced buffer satisfies the manifest entry that declared it.
 *
 * @param {{file: string, edge: number, alpha: boolean}} asset
 * @param {Buffer} png
 * @throws {Error} On any dimension or alpha-channel violation.
 */
async function verify(asset, png) {
  const meta = await sharp(png).metadata();
  if (meta.width !== asset.edge || meta.height !== asset.edge) {
    throw new Error(
      `${asset.file}: expected ${asset.edge}x${asset.edge}, produced ${meta.width}x${meta.height}`,
    );
  }
  if (meta.hasAlpha !== asset.alpha) {
    throw new Error(
      `${asset.file}: expected hasAlpha=${asset.alpha}, produced hasAlpha=${meta.hasAlpha}`,
    );
  }
}

/**
 * @param {Buffer} buf
 * @returns {string} Short content digest, for --check reporting.
 */
function digest(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 12);
}

async function main() {
  const checkOnly = process.argv.includes('--check');

  if (!existsSync(BRAND_DIR)) {
    console.error(`FATAL: brand vectors not found at ${BRAND_DIR}`);
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });

  console.log(
    `${checkOnly ? 'Checking' : 'Generating'} ${ASSETS.length} mobile assets ` +
      `from ${BRAND_DIR}\n` +
      `Adaptive mark: ${ADAPTIVE_MARK_EDGE}px on ${ICON_EDGE}px ` +
      `(${((ADAPTIVE_MARK_EDGE / ICON_EDGE) * 100).toFixed(1)}%, safe zone ` +
      `${(ANDROID_SAFE_ZONE_RATIO * 100).toFixed(1)}%)\n` +
      `Splash mark:   ${SPLASH_MARK_EDGE}px on ${SPLASH_EDGE}px ` +
      `(${((SPLASH_MARK_EDGE / SPLASH_EDGE) * 100).toFixed(1)}%, clear space only)\n`,
  );

  const drifted = [];

  for (const asset of ASSETS) {
    const png = await asset.build();
    await verify(asset, png);

    const target = join(OUT_DIR, asset.file);

    if (checkOnly) {
      if (!existsSync(target)) {
        drifted.push(`${asset.file}: absent from disk`);
        console.log(`  MISSING  ${asset.file}`);
        continue;
      }
      const onDisk = await readFile(target);
      const same = onDisk.equals(png);
      if (!same) {
        drifted.push(`${asset.file}: on-disk ${digest(onDisk)} != generated ${digest(png)}`);
      }
      console.log(`  ${same ? 'OK      ' : 'DRIFTED '} ${asset.file}`);
      continue;
    }

    await writeFile(target, png);
    console.log(
      `  wrote ${asset.file.padEnd(30)} ${asset.edge}x${asset.edge}  ` +
        `alpha=${asset.alpha ? 'yes' : 'no '}  ${(png.length / 1024).toFixed(1)} KB`,
    );
  }

  if (checkOnly && drifted.length > 0) {
    console.error('\nFAIL: mobile launch assets do not match the brand vectors.');
    for (const line of drifted) console.error(`  ${line}`);
    console.error('\nRun: node scripts/generate-mobile-icons.mjs');
    process.exit(1);
  }

  console.log(checkOnly ? '\nAll assets match the brand vectors.' : '\nDone.');
}

main().catch((error) => {
  console.error(`FATAL: ${error.message}`);
  process.exit(1);
});
