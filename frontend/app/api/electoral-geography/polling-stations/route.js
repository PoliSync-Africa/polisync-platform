const API_BASES = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.BACKEND_URL,
  "https://polisync-platform.onrender.com",
  "https://polisync-platform-1.onrender.com",
]
  .map((value) => String(value || "").replace(/\/+$/, ""))
  .filter((value, index, array) => value && array.indexOf(value) === index);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request) {
  const incoming = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  let lastError = null;

  for (const base of API_BASES) {
    const target = `${base}/api/electoral-geography/polling-stations${incoming.search}`;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(target, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(authorization ? { Authorization: authorization } : {}),
          },
          cache: "no-store",
        });

        const text = await response.text();
        let payload;
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = { success: false, message: text || "Unable to load polling stations." };
        }

        if (response.ok || response.status < 500) {
          return Response.json(payload, {
            status: response.status,
            headers: { "Cache-Control": "no-store, max-age=0" },
          });
        }

        lastError = new Error(payload?.message || `Polling station service returned ${response.status}.`);
      } catch (error) {
        lastError = error;
      }
      await sleep(500 * (attempt + 1));
    }
  }

  return Response.json(
    {
      success: false,
      message: lastError?.message || "Unable to connect to the polling stations service.",
    },
    { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
