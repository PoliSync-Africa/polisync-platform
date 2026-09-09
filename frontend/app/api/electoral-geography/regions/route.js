const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

export async function GET(request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const response = await fetch(`${API_BASE}/api/electoral-geography/regions`, {
      method: "GET",
      headers: { Accept: "application/json", ...(authorization ? { Authorization: authorization } : {}) },
      cache: "no-store",
    });
    const text = await response.text();
    let payload;
    try { payload = text ? JSON.parse(text) : {}; }
    catch { payload = { success: false, message: text || "Unable to load regions." }; }
    return Response.json(payload, { status: response.status, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return Response.json({ success: false, message: error?.message || "Unable to connect to the electoral geography service." }, { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
