"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Climate = {
  status: "ok" | "unavailable";
  temperature_2m_c: Record<string, number | null> | null;
  precipitation_mm_dia: Record<string, number | null> | null;
  reason: string | null;
  provenance: string;
};

type LocationResult = {
  place: string;
  coordinates: { lat: number; lon: number; display_name: string };
  climate: Climate;
  geocoding_provenance: string;
  note: string;
};

export default function LocationForm() {
  const [place, setPlace] = useState("");
  const [result, setResult] = useState<LocationResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const detail = (body as { detail?: unknown }).detail;
        setError(typeof detail === "string" ? detail : "Não foi possível localizar a área.");
        return;
      }
      const resolved = body as LocationResult;
      setResult(resolved);
      try {
        // Ponto inicial da tela de cobertura (UC-08); o agricultor ainda confirma lá.
        window.localStorage.setItem(
          "raizes:coverage-point:v1",
          JSON.stringify({ latitude: resolved.coordinates.lat, longitude: resolved.coordinates.lon }),
        );
      } catch {
        // Sem armazenamento local, as coordenadas podem ser digitadas na cobertura.
      }
    } catch {
      setError("Não foi possível localizar a área agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const annualTemp = result?.climate.temperature_2m_c?.ANN;
  const annualRain = result?.climate.precipitation_mm_dia?.ANN;

  return (
    <section aria-label="Localização da área">
      <form onSubmit={handleSubmit}>
        <label htmlFor="place">Município e UF</label>
        <input
          id="place"
          name="place"
          value={place}
          onChange={(event) => setPlace(event.target.value)}
          placeholder="Ex.: Petrolina, PE"
          required
          minLength={2}
          maxLength={200}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Buscando..." : "Localizar"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {result && (
        <article aria-live="polite">
          <h2>{result.coordinates.display_name}</h2>
          <p>
            Coordenadas aproximadas: {result.coordinates.lat.toFixed(4)},{" "}
            {result.coordinates.lon.toFixed(4)} · fonte: {result.geocoding_provenance}
          </p>
          {result.climate.status === "ok" ? (
            <p>
              Média anual: temperatura {annualTemp ?? "indisponível"} °C · chuva{" "}
              {annualRain ?? "indisponível"} mm/dia · fonte: {result.climate.provenance}
            </p>
          ) : (
            <p>Contexto climático indisponível: {result.climate.reason}</p>
          )}
          <p><small>{result.note}</small></p>
          <p className="page-link"><Link href="/cobertura">Verificar cobertura dos dados neste ponto →</Link></p>
        </article>
      )}
    </section>
  );
}
