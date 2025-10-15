export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const q = req.query.tag;
    if (!q) return res.status(400).json({ error: "Missing ?tag=%23CLANTAG or ?tag=#CLANTAG" });

    const token = process.env.COC_TOKEN;
    if (!token) return res.status(500).json({ error: "Missing COC_TOKEN env var" });

    // Accept both "#TAG" and "%23TAG" and normalize to ONE %23 in the path
    const raw = decodeURIComponent(Array.isArray(q) ? q[0] : q); // e.g. "#2PG0VJYLR"
    let encoded; // e.g. "%232PG0VJYLR"
    if (raw.startsWith("#")) encoded = "%23" + raw.slice(1);
    else if (raw.startsWith("%23")) encoded = raw;
    else encoded = "%23" + raw;

    const base = "https://cocproxy.royaleapi.dev"; // or "https://api.clashofclans.com" if you have fixed egress IPs
    const url = `${base}/v1/clans/${encoded}`;      // IMPORTANT: no encodeURIComponent here

    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!upstream.ok) {
      const body = await upstream.text();
      return res.status(upstream.status).json({ error: "Upstream error", status: upstream.status, body });
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    const json = await upstream.json();
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}

