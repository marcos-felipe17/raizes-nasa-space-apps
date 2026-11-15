import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiBase = process.env.RAIZES_API_URL ?? "http://127.0.0.1:8000";

  try {
    const payload: unknown = await request.json();
    const upstream = await fetch(`${apiBase}/api/v1/areas/soil/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const result: unknown = await upstream.json();
    return NextResponse.json(result, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível validar o solo agora. Tente novamente." },
      { status: 503 },
    );
  }
}
