import { NextResponse } from "next/server";

const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

async function proxy(request, context) {
  try {
    const params = await context.params;
    const parts = Array.isArray(params?.path) ? params.path : [];
    const upstreamPath = `/api/electoral-geography/${parts.map((part) => encodeURIComponent(part)).join("/")}`;
    const incomingUrl = new URL(request.url);
    const target = `${API_BASE}${upstreamPath}${incomingUrl.search}`;
    const headers = { Accept: "application/json" };
    const authorization = request.headers.get("authorization");
    if (authorization) headers.Authorization = authorization;

    const response = await fetch(target, {
      method: request.method,
      headers,
      cache: "no-store",
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "cache-control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Electoral geography proxy failed:", error);
    return NextResponse.json(
      { success: false, code: "ELECTORAL_GEOGRAPHY_PROXY_FAILED", message: "Unable to reach electoral geography service." },
      { status: 502, headers: { "cache-control": "no-store, max-age=0" } }
    );
  }
}

export async function GET(request, context) {
  return proxy(request, context);
}
