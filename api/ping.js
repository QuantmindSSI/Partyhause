// Minimal health/ping endpoint (no dependencies)
// Project uses ESM (see package.json "type": "module"), so export as default.
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}
