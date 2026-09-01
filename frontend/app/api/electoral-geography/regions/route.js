export async function GET(request) {
  const apiBase = String(process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "").replace(/\/+$/, "");
  if (!apiBase) {
    return Response.json({ success: false, message: "Production API URL is not configured." }, { status: 500 });
  }

  try {
    const authorization = request.headers.get("authorization") || "";
    const response = await fetch(`${apiBase}/api/electoral-geography/regions`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      cache: "no-store",
    });

    const text = await response.text();
    let payload;
    try { payload = text ? JSON.parse(text) : {}; }
    catch { payload = { success: false, message: text || "Unable to load regions." }; }

    return Response.json(payload, { status: response.status });
  } catch (error) {
    return Response.json({ success: false, message: error?.message || "Unable to connect to the electoral geography service." }, { status: 502 });
  }
}
