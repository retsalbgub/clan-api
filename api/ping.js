export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log("HIT /api/ping", new Date().toISOString());
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}
