import { NextResponse } from "next/server";

const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

export async function POST(request) {
  const target = `${API_BASE}/api/electoral-geography/integrity/sync`;
  const headers = { Accept: "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;

  try {
    const response = await fetch(target, {
      method: "POST",
      headers,
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Electoral data synchronization proxy failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reach the electoral data synchronization service." },
      { status: 502 }
    );
  }
}
