// app/api/health/route.js or pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({ ok: true });
}
