export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const q = req.query.tag;
    if (!q) return res.status(400).json({ error: "Missing ?tag=#CLANTAG or ?tag=%23CLANTAG" });

    const token = process.env.COC_TOKEN;
    if (!token) return res.status(500).json({ error: "Missing COC_TOKEN env var" });

    const raw = decodeURIComponent(Array.isArray(q) ? q[0] : q);
    const encoded = raw.startsWith("#") ? "%23" + raw.slice(1)
                  : raw.startsWith("%23") ? raw
                  : "%23" + raw;

    const base = "https://cocproxy.royaleapi.dev";
    const url  = `${base}/v1/clans/${encoded}/currentwar`;

    const upstream = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const text = await upstream.text();
    if (!upstream.ok) return res.status(upstream.status).json({ error: "Upstream error", status: upstream.status, body: text });

    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=15");
    res.status(200).send(text); // pass through JSON
  } catch (e) {
    res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
