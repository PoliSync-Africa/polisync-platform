const FEEDS = [
  { category: "politics", label: "Politics", query: "Ghana politics" },
  { category: "governance", label: "Governance", query: "Ghana government governance" },
  { category: "economy", label: "Economy", query: "Ghana economy" },
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const stripCdata = (value) => String(value || "").replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
const decodeEntities = (value) => String(value || "")
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

function tag(xml, name) {
  const re = new RegExp(`<${escapeRegExp(name)}[^>]*>([\\s\\S]*?)<\\/${escapeRegExp(name)}>`, "i");
  const match = xml.match(re);
  return decodeEntities(stripCdata(match?.[1] || "").replace(/<[^>]+>/g, "").trim());
}

function items(xml) {
  return Array.from(String(xml || "").matchAll(/<item>([\s\S]*?)<\/item>/gi)).map((match) => {
    const block = match[1];
    const title = tag(block, "title");
    const link = tag(block, "link");
    const published = tag(block, "pubDate");
    const source = tag(block, "source") || "Google News";
    const description = tag(block, "description");
    return { title, link, published, source, description };
  }).filter((item) => item.title && item.link);
}

export async function GET() {
  try {
    const results = await Promise.all(FEEDS.map(async (feed) => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=en-GH&gl=GH&ceid=GH:en`;
      const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
      if (!response.ok) return [];
      const xml = await response.text();
      return items(xml).slice(0, 12).map((item) => ({ ...item, category: feed.category, categoryLabel: feed.label }));
    }));

    const seen = new Set();
    const news = results.flat().filter((item) => {
      const key = `${item.title}|${item.link}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()).slice(0, 30);

    return Response.json({ success: true, data: news, updatedAt: new Date().toISOString(), source: "Google News RSS" });
  } catch (error) {
    return Response.json({ success: false, data: [], message: "News feed is temporarily unavailable." }, { status: 200 });
  }
}
