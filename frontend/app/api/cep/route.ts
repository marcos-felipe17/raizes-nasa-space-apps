import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiBase = process.env.RAIZES_API_URL ?? "http://127.0.0.1:8000";
  const cep = (request.nextUrl.searchParams.get("cep") ?? "").replace(/\D/g, "");
  if (cep.length !== 8) {
    return NextResponse.json({ detail: "O CEP precisa ter 8 números." }, { status: 422 });
  }
  try {
    const upstream = await fetch(`${apiBase}/api/v1/areas/cep/${cep}`, { cache: "no-store" });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch {
    return NextResponse.json({ detail: "Serviço de CEP indisponível agora." }, { status: 503 });
  }
}
