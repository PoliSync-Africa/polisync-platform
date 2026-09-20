import { NextResponse } from "next/server";

const API_BASES = [process.env.NEXT_PUBLIC_API_URL, process.env.BACKEND_URL, "https://polisync-platform.onrender.com", "https://polisync-platform-1.onrender.com"]
  .map((value) => String(value || "").replace(/\/+$/, ""))
  .filter((value, index, array) => value && array.indexOf(value) === index);

async function proxy(request, context) {
  const params = await context.params;
  const parts = Array.isArray(params?.path) ? params.path : [];
  const upstreamPath = `/api/electoral-geography/${parts.map((part) => encodeURIComponent(part)).join("/")}`;
  const incomingUrl = new URL(request.url);
  const headers = { Accept: "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  let lastError = null;

  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${upstreamPath}${incomingUrl.search}`, { method: request.method, headers, cache: "no-store" });
      const body = await response.text();
      if (response.ok || response.status < 500) {
        return new NextResponse(body, { status: response.status, headers: { "content-type": response.headers.get("content-type") || "application/json; charset=utf-8", "cache-control": "no-store, max-age=0" } });
      }
      lastError = new Error(`Electoral geography service returned ${response.status}.`);
    } catch (error) { lastError = error; }
  }

  console.error("Electoral geography proxy failed:", lastError);
  return NextResponse.json({ success: false, code: "ELECTORAL_GEOGRAPHY_PROXY_FAILED", message: "Unable to reach electoral geography service." }, { status: 502, headers: { "cache-control": "no-store, max-age=0" } });
}

export async function GET(request, context) { return proxy(request, context); }
