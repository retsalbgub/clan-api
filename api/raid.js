export default async function handler(req, res) {
  // Allow browser requests (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const q = req.query.tag;
    const limit = Math.max(1, Math.min(3, parseInt(req.query.limit || "1", 10)));
    if (!q)
      return res
        .status(400)
        .json({ error: "Missing ?tag=#CLANTAG or ?tag=%23CLANTAG" });

    const token = process.env.COC_TOKEN;
    if (!token)
      return res.status(500).json({ error: "Missing COC_TOKEN env var" });

    // Normalize tag so only one %23
    const raw = decodeURIComponent(Array.isArray(q) ? q[0] : q);
    const encoded = raw.startsWith("#")
      ? "%23" + raw.slice(1)
      : raw.startsWith("%23")
      ? raw
      : "%23" + raw;

    const base = "https://cocproxy.royaleapi.dev"; // proxy for Clash of Clans API
    const url = `${base}/v1/clans/${encoded}/capitalraidseasons?limit=${limit}`;

    // Call upstream API
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({
          error: "Upstream error",
          status: upstream.status,
          body: text,
        });
    }

    // Pass through raw JSON from upstream
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=30"
    );
    res.status(200).send(text); // already valid JSON string
  } catch (e) {
    res
      .status(500)
      .json({ error: e?.message || "Unknown error while fetching raid data" });
  }
}
