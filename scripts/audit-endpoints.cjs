/**
 * Semantic endpoint extractor built on the TypeScript compiler API.
 *
 * Regex cannot answer this question correctly. Endpoints are assembled from
 * template literals (`${API_URL}/api/events`), mounted under prefixes declared
 * elsewhere (`app.use('/api/guests', guestsRouter)`), and reached through
 * wrapper helpers. This walks real AST nodes instead.
 *
 * Three passes:
 *   SERVER  router.<verb>('<path>') + app.use('<prefix>', <router>)
 *           resolved to the concrete mounted route table.
 *   CLIENT  fetch()/apiUrl()/buildApiUrl() call sites, with template
 *           expressions folded to their static skeleton so
 *           `${base}/api/guests?eventId=${id}` becomes `/api/guests`.
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTTP_VERBS = new Set(['get', 'post', 'put', 'patch', 'delete', 'all']);

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function parse(file) {
  return ts.createSourceFile(
    file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true,
    /\.tsx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

/**
 * Fold a node to the static path skeleton it contributes.
 * Template holes become {} so shapes stay comparable across call sites.
 */
function staticText(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let s = node.head.text;
    for (const span of node.templateSpans) s += '{}' + span.literal.text;
    return s;
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = staticText(node.left), r = staticText(node.right);
    if (l === null && r === null) return null;
    return (l ?? '{}') + (r ?? '{}');
  }
  if (ts.isIdentifier(node)) return '{}';
  return null;
}

/** Reduce a raw URL-ish string to a comparable API path. */
function normalisePath(raw) {
  if (!raw) return null;
  let s = raw;
  s = s.replace(/^\{\}/, '');                 // leading ${base}
  s = s.replace(/^https?:\/\/[^/]+/, '');     // absolute origin
  s = s.split('?')[0];                        // drop query
  s = s.replace(/\{\}/g, ':param');           // interpolations -> params
  if (!s.startsWith('/')) return null;
  s = s.replace(/\/+$/, '') || '/';
  if (!s.startsWith('/api')) return null;
  return s;
}

// ---------------- SERVER ----------------
function extractServer() {
  const routerFiles = walkFiles(path.join(ROOT, 'server/routes'));
  const perFile = new Map();
  for (const f of routerFiles) {
    const sf = parse(f);
    const routes = [];
    (function visit(n) {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
        const obj = n.expression.expression;
        const verb = n.expression.name.text.toLowerCase();
        if (HTTP_VERBS.has(verb) && ts.isIdentifier(obj) && /router/i.test(obj.text)) {
          const p = staticText(n.arguments[0]);
          if (p !== null) {
            const line = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
            const guarded = n.arguments.slice(1).some(a =>
              /requireAuth|optionalAuth/.test(a.getText(sf)));
            routes.push({ verb: verb.toUpperCase(), sub: p, line, guarded });
          }
        }
      }
      ts.forEachChild(n, visit);
    })(sf);
    perFile.set(path.relative(ROOT, f), routes);
  }

  // Resolve mount prefixes from server/index.ts
  const idx = parse(path.join(ROOT, 'server/index.ts'));
  const mounts = new Map(); // routerIdentifier -> prefix
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
        && n.expression.name.text === 'use' && n.arguments.length >= 2) {
      const prefix = staticText(n.arguments[0]);
      const target = n.arguments[1];
      if (prefix && ts.isIdentifier(target)) mounts.set(target.text, prefix);
    }
    ts.forEachChild(n, visit);
  })(idx);

  const importMap = new Map(); // identifier -> route file
  (function visit(n) {
    if (ts.isImportDeclaration(n) && n.importClause && n.importClause.name
        && ts.isStringLiteral(n.moduleSpecifier)) {
      importMap.set(n.importClause.name.text, n.moduleSpecifier.text);
    }
    ts.forEachChild(n, visit);
  })(idx);

  // Inline app.<verb> routes declared directly in index.ts
  const inline = [];
  (function visit(n) {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
      const obj = n.expression.expression, verb = n.expression.name.text.toLowerCase();
      if (HTTP_VERBS.has(verb) && ts.isIdentifier(obj) && obj.text === 'app') {
        const p = normalisePath(staticText(n.arguments[0]));
        if (p) inline.push({ verb: verb.toUpperCase(), path: p, file: 'server/index.ts' });
      }
    }
    ts.forEachChild(n, visit);
  })(idx);

  const table = [...inline];
  for (const [ident, spec] of importMap) {
    const prefix = mounts.get(ident);
    if (!prefix) continue;
    const rel = 'server/' + spec.replace(/^\.\//, '') + '.ts';
    const routes = perFile.get(rel);
    if (!routes) continue;
    for (const r of routes) {
      const joined = (prefix + (r.sub === '/' ? '' : r.sub)).replace(/\/+/g, '/');
      table.push({ verb: r.verb, path: joined.replace(/\/$/, '') || prefix, file: rel, guarded: r.guarded });
    }
  }
  return table;
}

// ---------------- CLIENTS ----------------
function extractClient(dirs) {
  const calls = [];
  for (const d of dirs) {
    for (const f of walkFiles(path.join(ROOT, d))) {
      const sf = parse(f);
      const rel = path.relative(ROOT, f);
      (function visit(n) {
        if (ts.isCallExpression(n)) {
          const callee = n.expression;
          const name = ts.isIdentifier(callee) ? callee.text
            : ts.isPropertyAccessExpression(callee) ? callee.name.text : '';
          const isFetch = name === 'fetch';
          // Typed helpers exported by src/lib/api-client.ts carry the verb in
          // the function name; apps/mobile/lib/api.ts uses apiUrl().
          const helperVerb = { apiGet:'GET', apiPost:'POST', apiPut:'PUT', apiDelete:'DELETE' }[name];
          const isHelper = Boolean(helperVerb) || /^(apiUrl|buildApiUrl|apiFetch|request)$/.test(name);
          if (isFetch || isHelper) {
            const p = normalisePath(staticText(n.arguments[0]));
            if (p) {
              let verb = helperVerb || 'GET';
              const opts = n.arguments[1];
              if (opts && ts.isObjectLiteralExpression(opts)) {
                for (const prop of opts.properties) {
                  if (ts.isPropertyAssignment(prop) && prop.name.getText(sf) === 'method') {
                    const m = staticText(prop.initializer);
                    if (m) verb = m.toUpperCase();
                  }
                }
              }
              calls.push({ verb, path: p, file: rel,
                line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1 });
            }
          }
        }
        ts.forEachChild(n, visit);
      })(sf);
    }
  }
  return calls;
}

const server = extractServer();
const web = extractClient(['src']);
const mobile = extractClient(['apps/mobile']);
const core = extractClient(['packages/core/src']);
console.log(JSON.stringify({ server, web, mobile, core }, null, 2));
