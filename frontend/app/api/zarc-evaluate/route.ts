import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiBase = process.env.RAIZES_API_URL ?? "http://127.0.0.1:8000";
  try {
    const payload: unknown = await request.json();
    const upstream = await fetch(`${apiBase}/api/v1/zarc/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "Não deu para avaliar agora." }, { status: 503 });
  }
}
