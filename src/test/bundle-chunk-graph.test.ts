/**
 * Guards the emitted chunk graph against import cycles.
 *
 * WHY THIS EXISTS
 *   A cycle between emitted chunks broke module initialisation order and shipped
 *   to production. React was still undefined when @floating-ui/react-dom read
 *   `React.useLayoutEffect` at module top level, so the app threw on load:
 *
 *     Cannot read properties of undefined (reading 'useLayoutEffect')
 *
 *   The site answered HTTP 200 the whole time, so every health check passed
 *   while users saw a white screen.
 *
 *   Rollup had reported it on every build:
 *
 *     Circular chunk: react-vendor -> vendor -> react-vendor
 *
 *   but `vite build` exits 0 on warnings, so nothing failed. A warning nobody
 *   is forced to read is not a control. This asserts the property directly on
 *   the build output.
 *
 * WHAT IT CHECKS
 *   1. No cycles anywhere in the emitted chunk import graph.
 *   2. react-vendor imports nothing, so React cannot be initialised late.
 *   3. Exactly one rel=manifest tag, since two competing manifests shipped once.
 *   4. Both frontend manifests reference real PNG files with honest dimensions.
 *   5. Docker receives the public assets referenced by the generated manifest.
 *
 * The suite is skipped when dist/ is absent so `npm run test:run` still works
 * without a prior build; `npm run build:check` builds before testing.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');
const MOBILE_PUBLIC = path.resolve(ROOT, 'apps/mobile/public');
const WEB_APP = path.resolve(ROOT, 'src/App.tsx');
const RSVP_PAGE = path.resolve(ROOT, 'src/components/JoinEventPage.tsx');
const built = fs.existsSync(ASSETS);

interface ManifestIcon {
  src: string;
  sizes: string;
  type?: string;
}

interface WebManifest {
  icons?: ManifestIcon[];
  shortcuts?: Array<{ icons?: ManifestIcon[] }>;
}

function assertManifestIcons(root: string, manifest: WebManifest): void {
  const icons = [
    ...(manifest.icons ?? []),
    ...(manifest.shortcuts ?? []).flatMap((shortcut) => shortcut.icons ?? []),
  ];
  expect(icons.length, 'manifest declares no icons').toBeGreaterThan(0);

  for (const icon of icons) {
    const relativePath = new URL(icon.src, 'https://partyhause.test').pathname.replace(/^\/+/, '');
    const iconPath = path.join(root, relativePath);
    expect(fs.existsSync(iconPath), `missing manifest icon: ${icon.src}`).toBe(true);

    if (icon.type === 'image/png') {
      const png = fs.readFileSync(iconPath);
      expect([...png.subarray(0, 8)], `${icon.src} is not a PNG`).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, `${icon.src} dimensions`).toBe(icon.sizes);
    }
  }
}

/** Relative chunk imports Rollup emits, e.g. `from"./vendor-abc.js"`. */
function readChunkGraph(): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const file of fs.readdirSync(ASSETS).filter((f) => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(ASSETS, file), 'utf8');
    const deps = new Set<string>();
    for (const m of src.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) {
      deps.add(m[1]);
    }
    graph.set(file, deps);
  }
  return graph;
}

/** Every cycle reachable in the graph, each rendered as `a -> b -> a`. */
function findCycles(graph: Map<string, Set<string>>): string[] {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const colour = new Map<string, number>();
  for (const node of graph.keys()) colour.set(node, WHITE);
  const cycles: string[] = [];

  const visit = (node: string, stack: string[]): void => {
    colour.set(node, GREY);
    stack.push(node);
    for (const dep of graph.get(node) ?? []) {
      if (!graph.has(dep)) continue;
      const state = colour.get(dep);
      if (state === GREY) {
        cycles.push([...stack.slice(stack.indexOf(dep)), dep].join(' -> '));
      } else if (state === WHITE) {
        visit(dep, stack);
      }
    }
    stack.pop();
    colour.set(node, BLACK);
  };

  for (const node of graph.keys()) {
    if (colour.get(node) === WHITE) visit(node, []);
  }
  return [...new Set(cycles)];
}

describe.skipIf(!built)('emitted bundle chunk graph', () => {
  it('contains no import cycles between chunks', () => {
    const cycles = findCycles(readChunkGraph());
    expect(cycles, `Circular chunks break module init order:\n${cycles.join('\n')}`)
      .toEqual([]);
  });

  it('keeps react-vendor free of outgoing chunk imports', () => {
    const graph = readChunkGraph();
    const reactVendor = [...graph.keys()].find((f) => f.startsWith('react-vendor'));
    expect(reactVendor, 'no react-vendor chunk was emitted').toBeDefined();
    // A leaf chunk cannot be initialised after something that depends on it.
    expect([...(graph.get(reactVendor!) ?? [])]).toEqual([]);
  });

  it('does not co-locate other packages with React', () => {
    const graph = readChunkGraph();
    const reactVendor = [...graph.keys()].find((f) => f.startsWith('react-vendor'))!;
    const src = fs.readFileSync(path.join(ASSETS, reactVendor), 'utf8');
    // @floating-ui/react-dom matched a loose `/react-dom/` rule and was the
    // package that actually threw. Its marker must not appear here.
    expect(src).not.toContain('@floating-ui');
  });

  it('keeps generic invitation and social join APIs out of the RSVP chunk', () => {
    const file = fs.readdirSync(ASSETS).find((name) => name.startsWith('JoinEventPage-') && name.endsWith('.js'));
    expect(file, 'no JoinEventPage chunk was emitted').toBeDefined();
    const source = fs.readFileSync(path.join(ASSETS, file!), 'utf8');
    expect(source).toContain('/api/rsvp/resolve');
    expect(source).not.toMatch(/\/api\/(?:invites|send-email|partycrew)|also_add_to_crew/);
  });
});

describe.skipIf(!built)('emitted index.html', () => {
  it('links exactly one web app manifest', () => {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
    const links = withoutComments.match(/rel="manifest"/g) ?? [];
    expect(links).toHaveLength(1);
  });

  it('ships the manifest the document points at', () => {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
    const href = withoutComments.match(/rel="manifest"\s+href="([^"]+)"/)?.[1];
    expect(href, 'no manifest href found').toBeDefined();
    // A missing file falls through nginx's SPA rewrite and is parsed as HTML,
    // which is the "Manifest: Line 1, column 1, Syntax error" console failure.
    expect(fs.existsSync(path.join(DIST, href!.replace(/^\//, '')))).toBe(true);
  });

  it('ships every image declared by the web app manifest', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(DIST, 'manifest.webmanifest'), 'utf8'),
    ) as WebManifest;
    assertManifestIcons(DIST, manifest);
  });
});

describe('mobile PWA manifest', () => {
  it('references valid, correctly sized icon files', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(MOBILE_PUBLIC, 'manifest.json'), 'utf8'),
    ) as WebManifest;
    assertManifestIcons(MOBILE_PUBLIC, manifest);
  });
});

/**
 * nginx location matching, implemented against the documented algorithm so the
 * assertions below test resolved behaviour rather than the text of the config.
 *
 * Order, per nginx's `location` documentation:
 *   1. an exact `=` match wins outright
 *   2. otherwise take the longest matching prefix; if it carries `^~`, stop
 *   3. otherwise try regex locations in declaration order, first match wins
 *   4. if no regex matched, fall back to the prefix found in step 2
 *
 * Only that last-resort fallback serves index.html, which is why a file-shaped
 * path reaching it is the bug this guards.
 */
type NginxLocation = {
  modifier: '=' | '^~' | '~' | '~*' | '';
  pattern: string;
  body: string;
};

function parseNginxLocations(conf: string): NginxLocation[] {
  // Comments are blanked rather than deleted so braces inside prose cannot
  // unbalance the depth counter below.
  const source = conf
    .split(/\r?\n/)
    .map((line) => (line.trim().startsWith('#') ? '' : line))
    .join('\n');

  const locations: NginxLocation[] = [];
  const header = /location\s+(=|\^~|~\*|~)?\s*(\S+?)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = header.exec(source)) !== null) {
    let depth = 1;
    let cursor = header.lastIndex;
    while (cursor < source.length && depth > 0) {
      if (source[cursor] === '{') depth += 1;
      else if (source[cursor] === '}') depth -= 1;
      cursor += 1;
    }
    locations.push({
      modifier: (match[1] ?? '') as NginxLocation['modifier'],
      pattern: match[2],
      body: source.slice(header.lastIndex, cursor - 1),
    });
  }
  return locations;
}

/** Step 1: an exact `=` match short-circuits the whole algorithm. */
function findExactMatch(
  locations: readonly NginxLocation[],
  uri: string,
): NginxLocation | undefined {
  return locations.find((loc) => loc.modifier === '=' && loc.pattern === uri);
}

/** Step 2: the longest matching prefix, whether or not it carries `^~`. */
function findLongestPrefixMatch(
  locations: readonly NginxLocation[],
  uri: string,
): NginxLocation | undefined {
  let best: NginxLocation | undefined;
  for (const loc of locations) {
    const isPrefix = loc.modifier === '^~' || loc.modifier === '';
    if (!isPrefix || !uri.startsWith(loc.pattern)) continue;
    if (!best || loc.pattern.length > best.pattern.length) best = loc;
  }
  return best;
}

/** Step 3: regex locations are tried in declaration order and the first wins. */
function findFirstRegexMatch(
  locations: readonly NginxLocation[],
  uri: string,
): NginxLocation | undefined {
  return locations.find((loc) => {
    if (loc.modifier !== '~' && loc.modifier !== '~*') return false;
    return new RegExp(loc.pattern, loc.modifier === '~*' ? 'i' : '').test(uri);
  });
}

function resolveNginxLocation(
  locations: readonly NginxLocation[],
  uri: string,
): NginxLocation | undefined {
  const exact = findExactMatch(locations, uri);
  if (exact) return exact;

  const prefix = findLongestPrefixMatch(locations, uri);
  if (prefix?.modifier === '^~') return prefix;

  // Step 4: no regex matched, so the prefix from step 2 is the last resort.
  return findFirstRegexMatch(locations, uri) ?? prefix;
}

describe('web container nginx routing', () => {
  const conf = fs.readFileSync(path.join(ROOT, 'nginx.conf'), 'utf8');
  const locations = parseNginxLocations(conf);

  const resolve = (uri: string): NginxLocation => {
    const loc = resolveNginxLocation(locations, uri);
    expect(loc, `no location matched ${uri}`).toBeDefined();
    return loc!;
  };
  const rejectsMissingFile = (loc: NginxLocation) => /try_files\s+\$uri\s+=404/.test(loc.body);

  it('parses every location block in the config', () => {
    // Cheap canary: a parser that silently matched nothing would make every
    // other assertion in this suite vacuously pass.
    expect(locations.length).toBeGreaterThan(5);
    expect(locations.some((loc) => loc.modifier === '' && loc.pattern === '/')).toBe(true);
  });

  // A missing file answered with index.html and HTTP 200 is the failure mode
  // that shipped a stale service worker and a manifest syntax error. Every
  // file-shaped path must reach a location that can return 404.
  it.each([
    '/definitely-not-a-real-asset.js',
    '/vendor.mjs',
    '/styles.css',
    '/data.json',
    '/bundle.js.map',
    '/assets/nope-abc123.js',
    '/assets/nope-abc123.css',
    '/missing-icon.png',
    '/missing-font.woff2',
    '/robots.txt',
    '/manifest.webmanifest',
    '/sw.js',
    '/registerSW.js',
    '/privacy.html',
    '/index.html',
    '/.well-known/apple-app-site-association',
  ])('answers 404 rather than the SPA shell for %s', (uri) => {
    expect(rejectsMissingFile(resolve(uri))).toBe(true);
  });

  // The mirror of the rule above: client-side routes carry no file extension
  // and must still receive the shell, or deep links 404.
  //
  // /join/:token is deliberately excluded here and asserted separately below.
  // It is served by its own location block with a different try_files form,
  // because the token sits in the path and the response must not be logged,
  // stored or referred onward.
  it.each(['/', '/profile/42', '/events/7/partyboard'])(
    'still serves the SPA shell for the client-side route %s',
    (uri) => {
      const loc = resolve(uri);
      expect(rejectsMissingFile(loc)).toBe(false);
      expect(loc.body).toMatch(/try_files\s+\$uri\s+\$uri\/\s+\/index\.html/);
    },
  );

  // An RSVP link is a bearer credential in a URL. Anyone holding the path can
  // answer for that guest, so the shell has to be served without writing the
  // path to the access log, without letting a shared cache keep the response,
  // and without handing the URL to whatever the guest clicks next.
  it('serves the SPA shell for /join/:token without logging or leaking the token', () => {
    const loc = resolve('/join/some-token');
    expect(rejectsMissingFile(loc)).toBe(false);
    expect(loc.body).toMatch(/try_files\s+\/index\.html\s+=404/);
    expect(loc.body).toMatch(/access_log\s+off/);
    expect(loc.body).toMatch(/Cache-Control\s+"no-store"/);
    expect(loc.body).toMatch(/Referrer-Policy\s+"no-referrer"/);
    expect(loc.body).toMatch(/X-Robots-Tag\s+"noindex/);
  });

  // The unfingerprinted-code regex was added after the fact. nginx gives exact
  // and `^~` matches priority over any regex, and takes the first regex in
  // declaration order, so these must keep the policy they were written with.
  it.each([
    ['/assets/index-C3RRcVXm.js', 'immutable'],
    ['/assets/index-C3RRcVXm.css', 'immutable'],
    ['/workbox-9c191d2f.js', 'immutable'],
  ])('keeps %s on the year-long immutable policy', (uri, expected) => {
    expect(resolve(uri).body).toContain(expected);
  });

  it.each(['/sw.js', '/registerSW.js', '/manifest.webmanifest', '/index.html'])(
    'keeps %s on no-cache so a stale client can recover',
    (uri) => {
      expect(resolve(uri).body).toMatch(/Cache-Control\s+"no-cache"/);
    },
  );

  it('keeps robots.txt on its own one-hour policy', () => {
    expect(resolve('/robots.txt').body).toContain('max-age=3600');
  });
});

describe('web container PWA assets', () => {
  it('keeps the Vite public directory in the Docker build context', () => {
    const ignoredPaths = fs.readFileSync(path.join(ROOT, '.dockerignore'), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== '' && !line.startsWith('#'));
    const excludesPublic = ignoredPaths.some((entry) => {
      const normalized = entry.replace(/^\/+/, '');
      return normalized === 'public' || normalized.startsWith('public/');
    });
    expect(excludesPublic, 'public PWA assets are excluded from the Docker image').toBe(false);
  });
});

describe.skipIf(!built)('legal document cache boundary', () => {
  it('does not include mutable legal or support pages in the service-worker precache', () => {
    const worker = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
    expect(worker).not.toContain('url:"privacy.html"');
    expect(worker).not.toContain('url:"terms.html"');
    expect(worker).not.toContain('url:"support.html"');
  });
});

describe('browser RSVP route boundary', () => {
  it('ships only the token route and removes raw event and guest identifiers', () => {
    const app = fs.readFileSync(WEB_APP, 'utf8');
    expect(app).toContain('<Route path="/join/:token"');
    expect(app).not.toContain('/event/:eventId/guest/:guestId');
  });

  it('keeps social join, native promotion, and generic invitation APIs out of RSVP', () => {
    const page = fs.readFileSync(RSVP_PAGE, 'utf8');
    expect(page).not.toMatch(/supabase|partycrew|also_add_to_crew|api\/invites|qr code|install/i);
    expect(page).toContain('/privacy.html');
    expect(page).toContain('/support.html');
  });

  it('sets a no-referrer policy before the RSVP route loads', () => {
    const html = fs.readFileSync(path.resolve(ROOT, 'index.html'), 'utf8');
    const nginx = fs.readFileSync(path.resolve(ROOT, 'nginx.conf'), 'utf8');
    expect(html).toContain('<meta name="referrer" content="no-referrer"');
    expect(nginx).toMatch(/location \^~ \/join\/ \{[\s\S]*Cache-Control "no-store"[\s\S]*Referrer-Policy "no-referrer"/);
    expect(nginx).toMatch(/location \^~ \/join\/ \{[\s\S]*access_log off[\s\S]*X-Robots-Tag "noindex, nofollow, noarchive"/);
  });
});
