export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { tag } = req.query;
    if (!tag) return res.status(400).json({ error: "Missing ?tag=%23CLANTAG" });

    const token = process.env.COC_TOKEN;
    if (!token) return res.status(500).json({ error: "Missing COC_TOKEN env var" });

    const normalized = decodeURIComponent(tag).replace(/^#/, "%23");
    const base = "https://cocproxy.royaleapi.dev"; // or "https://api.clashofclans.com" if you have fixed egress IPs
    const url = `${base}/v1/clans/${encodeURIComponent(normalized)}`;

    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: "Upstream error", status: upstream.status, body: text });
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    const json = await upstream.json();
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
