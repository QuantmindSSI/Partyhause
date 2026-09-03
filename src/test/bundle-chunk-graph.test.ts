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
 *
 * The suite is skipped when dist/ is absent so `npm run test:run` still works
 * without a prior build; `npm run build:check` builds before testing.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const ASSETS = path.join(DIST, 'assets');
const built = fs.existsSync(ASSETS);

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
});
