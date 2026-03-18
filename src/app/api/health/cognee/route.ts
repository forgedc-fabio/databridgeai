import { NextResponse } from "next/server";

const COGNEE_URL = process.env.COGNEE_API_URL;

export async function GET() {
  if (!COGNEE_URL) {
    return NextResponse.json(
      { status: "unreachable", message: "COGNEE_API_URL not configured" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${COGNEE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      return NextResponse.json({ status: "healthy" });
    }
    return NextResponse.json({ status: "degraded" }, { status: 502 });
  } catch {
    return NextResponse.json({ status: "unreachable" }, { status: 503 });
  }
}
