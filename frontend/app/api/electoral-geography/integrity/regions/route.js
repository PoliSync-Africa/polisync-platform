import { NextResponse } from "next/server";

const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

export async function GET(request) {
  const target = `${API_BASE}/api/electoral-geography/integrity/regions`;
  const headers = { Accept: "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;

  try {
    const response = await fetch(target, {
      method: "GET",
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
    console.error("Regional electoral health proxy failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reach the regional electoral health service." },
      { status: 502 }
    );
  }
}
