import { NextResponse } from "next/server";

const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

export async function GET(request, context) {
  return proxy(request, context);
}

export async function POST(request, context) {
  return proxy(request, context);
}

async function proxy(request, context) {
  const params = await context.params;
  const action = String(params?.action || "").trim();
  if (!action || !/^[a-z0-9-]+$/i.test(action)) {
    return NextResponse.json({ success: false, message: "Invalid integrity endpoint." }, { status: 400 });
  }

  const target = `${API_BASE}/api/electoral-geography/integrity/${action}`;
  const headers = { Accept: "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  if (["POST", "PUT", "PATCH"].includes(request.method)) headers["Content-Type"] = "application/json";

  let body;
  if (!["GET", "HEAD"].includes(request.method)) body = await request.text();

  try {
    const response = await fetch(target, { method: request.method, headers, body: body || undefined, cache: "no-store" });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") || "application/json" } });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unable to reach the electoral data integrity service." }, { status: 502 });
  }
}
