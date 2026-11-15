import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const apiBase = process.env.RAIZES_API_URL ?? "http://127.0.0.1:8000";
  try {
    const upstream = await fetch(`${apiBase}/api/scenarios/${encodeURIComponent(id)}`, { cache: "no-store" });
    const result: unknown = await upstream.json();
    return NextResponse.json(result, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "API indisponível" }, { status: 503 });
  }
}
