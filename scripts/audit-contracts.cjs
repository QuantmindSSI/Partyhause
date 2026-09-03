/**
 * Server/client response-contract checker.
 *
 * WHY THIS EXISTS
 *   A wrong response-shape assumption compiles perfectly. TypeScript cannot
 *   help: `t.request<Guest[]>('/api/guests')` type checks even when the route
 *   returns `{ guests, stats }`. The mistake only appears at runtime, as
 *   `data.map is not a function`.
 *
 *   That class of bug was introduced three separate times in this codebase
 *   while migrating the mobile app, each time by reading the route by hand and
 *   getting it wrong. Reading is not verification.
 *
 * WHAT IT DOES
 *   Server side: walks server/routes/*.ts, resolves router.<verb>() paths
 *   against the app.use() mounts in server/index.ts, and collects the property
 *   names of every 2xx `res.json({...})` object literal per route.
 *
 *   Client side: walks packages/core/src/resources/*.ts for the three call
 *   forms the client uses, recording which envelope key each expects:
 *     unwrapList<T>(t.request(PATH, {method}), 'KEY')  -> expects KEY, a list
 *     unwrapOne<T>(t.request(PATH, {method}), 'KEY')   -> expects KEY
 *     t.request<T>(PATH, {method})                     -> expects a bare body
 *
 *   Then it diffs. A client expecting a key the route never returns is an
 *   error. A client expecting a bare body from a route that returns a single
 *   wrapped key is an error too, since that is the exact shape of the bug.
 *
 * EXIT CODES
 *   0 contracts agree, 1 mismatches found, 2 tool failure.
 */

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTTP_VERBS = new Set(['get', 'post', 'put', 'patch', 'delete']);
/** Keys present in error payloads; never part of a success contract. */
const ERROR_KEYS = new Set(['error', 'message']);

/**
 * Scalar status keys. A route answering `{ success: true }` consumed as a bare
 * `{ success: boolean }` is correct: the envelope IS the payload. Only a
 * container key (a resource name wrapping the real data) makes a bare read a
 * bug, because that is the case where callers reach for `.map` or a field that
 * lives one level down.
 */
// Keys that are part of a payload rather than a container around one. A
// response of `{ user, message }` is not an envelope wrapping `user`: the
// message is a sibling field the client is meant to read, exactly like
// `token` in `{ user, token }`. Without this, adding a human-readable message
// to any response makes the auditor demand the client unwrap it.
const SCALAR_KEYS = new Set([
  'success', 'count', 'updated', 'token', 'status', 'has_more', 'total', 'message',
]);

function parse(file) {
  return ts.createSourceFile(
    file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS,
  );
}

function listFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(full, out);
    else if (/\.ts$/.test(e.name)) out.push(full);
  }
  return out;
}

/** Static text of a node, with template holes folded to a placeholder. */
function staticText(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let s = node.head.text;
    for (const span of node.templateSpans) s += '{}' + span.literal.text;
    return s;
  }
  return null;
}

/** Normalise a path so client and server forms compare equal. */
function normalise(p) {
  if (!p) return null;
  let s = p.split('?')[0];
  s = s.replace(/\{\}/g, ':p').replace(/:[A-Za-z_][A-Za-z0-9_]*\??/g, ':p');
  s = s.replace(/\/+/g, '/').replace(/\/$/, '');
  return s || '/';
}

// ------------------------- SERVER -------------------------
function collectServer() {
  const mounts = new Map();
  const imports = new Map();
  const indexPath = path.join(ROOT, 'server/index.ts');
  const idx = parse(indexPath);
  (function visit(n) {
    if (ts.isImportDeclaration(n) && n.importClause?.name && ts.isStringLiteral(n.moduleSpecifier)) {
      imports.set(n.importClause.name.text, n.moduleSpecifier.text);
    }
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
        && n.expression.name.text === 'use' && n.arguments.length >= 2) {
      const prefix = staticText(n.arguments[0]);
      const target = n.arguments[1];
      if (prefix && ts.isIdentifier(target)) mounts.set(target.text, prefix);
    }
    ts.forEachChild(n, visit);
  })(idx);

  const fileToPrefix = new Map();
  for (const [ident, spec] of imports) {
    const prefix = mounts.get(ident);
    if (prefix) fileToPrefix.set(path.join(ROOT, 'server', spec.replace(/^\.\//, '') + '.ts'), prefix);
  }

  const routes = new Map(); // "VERB path" -> Set(keys)

  // Routes declared inline on the app in server/index.ts, for example
  // app.post('/api/send-email', ...), which are not mounted through a router.
  (function visitInline(n) {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
      const verb = n.expression.name.text.toLowerCase();
      const obj = n.expression.expression;
      if (HTTP_VERBS.has(verb) && ts.isIdentifier(obj) && obj.text === 'app') {
        const p = normalise(staticText(n.arguments[0]));
        if (p && p.startsWith('/api')) {
          const keys = new Set();
          for (const handler of n.arguments.slice(1)) collectJsonKeys(handler, keys, idx);
          routes.set(`${verb.toUpperCase()} ${p}`, keys);
        }
      }
    }
    ts.forEachChild(n, visitInline);
  })(idx);

  for (const [file, prefix] of fileToPrefix) {
    if (!fs.existsSync(file)) continue;
    const sf = parse(file);
    (function visit(n) {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
        const verb = n.expression.name.text.toLowerCase();
        const obj = n.expression.expression;
        if (HTTP_VERBS.has(verb) && ts.isIdentifier(obj) && /router/i.test(obj.text)) {
          const sub = staticText(n.arguments[0]);
          if (sub !== null) {
            const keys = new Set();
            for (const handler of n.arguments.slice(1)) collectJsonKeys(handler, keys, sf);
            // An optional trailing param (`/:id?`) serves both the collection
            // and the item path, so register both forms.
            const variants = /\/:[A-Za-z_][A-Za-z0-9_]*\?$/.test(sub)
              ? [sub.replace(/\/:[A-Za-z_][A-Za-z0-9_]*\?$/, ''), sub]
              : [sub];
            for (const v of variants) {
              const full = normalise(prefix + (v === '/' || v === '' ? '' : v));
              const key = `${verb.toUpperCase()} ${full}`;
              const merged = routes.get(key) || new Set();
              for (const k of keys) merged.add(k);
              routes.set(key, merged);
            }
          }
        }
      }
      ts.forEachChild(n, visit);
    })(sf);
  }
  return routes;
}

/** Record property names of 2xx res.json({...}) literals inside a handler. */
function collectJsonKeys(node, out, sf) {
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
        && n.expression.name.text === 'json') {
      let status = 200;
      const recv = n.expression.expression;
      if (ts.isCallExpression(recv) && ts.isPropertyAccessExpression(recv.expression)
          && recv.expression.name.text === 'status') {
        const arg = recv.arguments[0];
        if (arg && ts.isNumericLiteral(arg)) status = Number(arg.text);
      }
      const arg = n.arguments[0];
      if (status >= 200 && status < 300 && arg && ts.isObjectLiteralExpression(arg)) {
        const names = [];
        let hasSpread = false;
        for (const prop of arg.properties) {
          if (ts.isSpreadAssignment(prop)) { hasSpread = true; continue; }
          const nm = prop.name && ts.isIdentifier(prop.name) ? prop.name.text
            : prop.name && ts.isStringLiteral(prop.name) ? prop.name.text : null;
          if (nm) names.push(nm);
        }
          // A body of ONLY error/message is a failure payload mislabelled 2xx,
          // and carries no contract worth checking. But when `message`
          // accompanies real payload, as in `{ user, message }`, it is a
          // sibling field the client reads, not noise. Dropping it there made
          // the response look like a single-key envelope and produced a false
          // mismatch against a client that correctly reads the body directly.
          const nonError = names.filter((x) => !ERROR_KEYS.has(x));
          const meaningful = nonError.length ? names : [];
        if (meaningful.length || hasSpread) {
          for (const m of meaningful) out.add(m);
          if (hasSpread) out.add('<spread>');
        }
      }
    }
    ts.forEachChild(n, visit);
  })(node);
}

// ------------------------- CLIENT -------------------------
function collectClient() {
  const expectations = [];
  for (const file of listFiles(path.join(ROOT, 'packages/core/src/resources'))) {
    const sf = parse(file);
    const rel = path.relative(ROOT, file);
    (function visit(n) {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)
          && (n.expression.text === 'unwrapList' || n.expression.text === 'unwrapOne')) {
        const inner = n.arguments[0];
        const keyArg = n.arguments[1];
        const spec = requestSpec(inner);
        if (spec && keyArg && ts.isStringLiteral(keyArg)) {
          expectations.push({
            ...spec, expects: keyArg.text,
            kind: n.expression.text === 'unwrapList' ? 'list' : 'one',
            file: rel, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1,
          });
        }
      } else {
        const spec = requestSpec(n);
        if (spec) {
          const parent = n.parent;
          const wrapped = parent && ts.isCallExpression(parent) && ts.isIdentifier(parent.expression)
            && /^unwrap(List|One)$/.test(parent.expression.text);
          if (!wrapped) {
            expectations.push({
              ...spec, expects: null, kind: 'bare',
              file: rel, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1,
            });
          }
        }
      }
      ts.forEachChild(n, visit);
    })(sf);
  }
  return expectations;
}

/** Extract {verb, path} from a `t.request(PATH, { method })` call. */
function requestSpec(n) {
  if (!n || !ts.isCallExpression(n)) return null;
  if (!ts.isPropertyAccessExpression(n.expression)) return null;
  if (n.expression.name.text !== 'request') return null;
  const p = normalise(staticText(n.arguments[0]));
  if (!p) return null;
  let verb = 'GET';
  const opts = n.arguments[1];
  if (opts && ts.isObjectLiteralExpression(opts)) {
    for (const prop of opts.properties) {
      if (ts.isPropertyAssignment(prop) && prop.name.getText() === 'method') {
        const m = staticText(prop.initializer);
        if (m) verb = m.toUpperCase();
      }
    }
  }
  return { verb, path: p };
}

// ------------------------- DIFF -------------------------
function main() {
  let server, client;
  try {
    server = collectServer();
    client = collectClient();
  } catch (err) {
    console.error('contract audit failed:', err.message);
    process.exit(2);
  }

  const problems = [];
  for (const exp of client) {
    const key = `${exp.verb} ${exp.path}`;
    const keys = server.get(key);
    if (!keys) {
      problems.push({ ...exp, why: 'no server route matches this verb and path' });
      continue;
    }
    if (keys.has('<spread>') ) continue; // unknowable statically; treat as compatible
    if (exp.kind === 'bare') {
      // Only a container key makes a bare read wrong. `{ success: true }` read
      // as `{ success: boolean }` is correct, the envelope is the payload.
      const containers = [...keys].filter((k) => !SCALAR_KEYS.has(k) && k !== '<spread>');
      if (containers.length === 1 && keys.size === containers.length) {
        problems.push({
          ...exp,
          why: `route wraps its payload in { ${containers[0]} } but the client reads the body directly`,
        });
      }
      continue;
    }
    if (!keys.has(exp.expects)) {
      problems.push({
        ...exp,
        why: `expects "${exp.expects}" but route returns { ${[...keys].join(', ') || 'nothing statically visible'} }`,
      });
    }
  }

  console.log(`server routes with a visible 2xx body: ${[...server].filter(([, v]) => v.size).length}`);
  console.log(`client expectations checked:           ${client.length}`);
  console.log('');
  if (!problems.length) {
    console.log('PASS: every client expectation matches its route');
    process.exit(0);
  }
  console.log(`FAIL: ${problems.length} contract mismatch(es)`);
  for (const p of problems) {
    console.log(`  ${p.verb} ${p.path}`);
    console.log(`      ${p.why}`);
    console.log(`      ${p.file}:${p.line}`);
  }
  process.exit(1);
}

main();
