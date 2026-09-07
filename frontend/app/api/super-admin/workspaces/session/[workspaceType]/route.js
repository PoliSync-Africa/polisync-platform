import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
  const { workspaceType } = await params;
  const incoming = new URL(request.url);
  const upstream = new URL(`${base}/api/super-admin/workspaces/session/${encodeURIComponent(workspaceType)}`);
  const organizationId = incoming.searchParams.get("organizationId");
  if (organizationId) upstream.searchParams.set("organizationId", organizationId);
  const authorization = request.headers.get("authorization") || "";

  try {
    const response = await fetch(upstream, {
      headers: { Accept: "application/json", ...(authorization ? { Authorization: authorization } : {}) },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ success: false, message: "Workspace service is temporarily unavailable." }, { status: 503 });
  }
}
