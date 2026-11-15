import { NextResponse } from "next/server";

export async function GET() {
  const apiBase = process.env.RAIZES_API_URL ?? "http://127.0.0.1:8000";
  try {
    const upstream = await fetch(`${apiBase}/api/scenarios`, { cache: "no-store" });
    const result: unknown = await upstream.json();
    return NextResponse.json(result, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "API indisponível" }, { status: 503 });
  }
}
