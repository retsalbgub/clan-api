export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const q = req.query.tag;
    if (!q) return res.status(400).json({ error: "Missing ?tag=%23CLANTAG or ?tag=#CLANTAG" });

    const token = process.env.COC_TOKEN;
    if (!token) return res.status(500).json({ error: "Missing COC_TOKEN env var" });

    // Accept "#TAG" or "%23TAG" and normalize to ONE %23
    const raw = decodeURIComponent(Array.isArray(q) ? q[0] : q); // e.g. "#2PG0VJYLR"
    const encoded = raw.startsWith("#") ? "%23" + raw.slice(1)
                  : raw.startsWith("%23") ? raw
                  : "%23" + raw;

    const base = "https://cocproxy.royaleapi.dev"; // or "https://api.clashofclans.com" with fixed egress IPs
    const url  = `${base}/v1/clans/${encoded}`;    // IMPORTANT: no encodeURIComponent here

    console.log("Fetching:", url);

    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!upstream.ok) {
      const body = await upstream.text();
      return res.status(upstream.status).json({ error: "Upstream error", status: upstream.status, body, debug: { raw, encoded, url } });
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
    const json = await upstream.json();
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
