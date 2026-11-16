"use client";

import { useCallback, useEffect, useState } from "react";
import { AvisoQ, Botao, Chip, Espaco, LinkAcao, Selo, Voltar } from "../_ui/ui";
import {
  CHAVES,
  enviar,
  ler,
  lerArea,
  lerProposta,
  lerSolo,
  type Area,
  type Proposta,
  type RegimeHidrico,
  type Solo,
} from "../_ui/fluxo";

type CommunityReport = {
  id: string;
  title: string;
  origin_kind: "real_community" | "experimental" | "synthetic_demo";
  origin_label: string;
  place: string;
  latitude: number;
  longitude: number;
  water_regime: RegimeHidrico;
  soil_classification: string | null;
  crops: string[];
  summary: string;
  source_note: string;
};

type MatchedReport = {
  report: CommunityReport;
  distance_km: number | null;
  similarities: string[];
  differences: string[];
  excluded: boolean;
  exclusion_reasons: string[];
};

type ConsultationResult = {
  q_indicator: "unavailable";
  q_reason: string;
  comparable_reports: MatchedReport[];
  excluded_reports: MatchedReport[];
  total_catalog: number;
};

type LocalContext = {
  area: Area | null;
  solo: Solo | null;
  regime: RegimeHidrico | null;
  proposta: Proposta | null;
};

function readContext(): LocalContext {
  const area = lerArea();
  const solo = lerSolo();
  const proposta = lerProposta();
  const perfil = ler<{ profile?: { water_regime?: string } }>(CHAVES.perfil);
  const regimeRaw = perfil?.profile?.water_regime;
  const regime: RegimeHidrico | null =
    regimeRaw === "rainfed" || regimeRaw === "irrigated" ? regimeRaw : null;
  return { area, solo, regime, proposta };
}

export default function ReportsExplorer() {
  const [context, setContext] = useState<LocalContext | null>(null);
  const [regime, setRegime] = useState<RegimeHidrico>("rainfed");
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const consult = useCallback(async (ctx: LocalContext, activeRegime: RegimeHidrico) => {
    setBusy(true);
    setError("");
    const payload = {
      place: ctx.area?.place ?? null,
      latitude: ctx.area?.latitude ?? null,
      longitude: ctx.area?.longitude ?? null,
      water_regime: activeRegime,
      soil: ctx.solo ?? { status: "unknown" },
      proposal: ctx.proposta ?? null,
    };

    const res = await enviar<ConsultationResult>("/api/reports", payload);
    setBusy(false);
    if (!res.ok || !res.dados) {
      setError("Não deu para consultar os relatos agora. Tente de novo.");
      return;
    }
    setResult(res.dados);
  }, []);

  useEffect(() => {
    const ctx = readContext();
    const initialRegime = ctx.regime ?? "rainfed";
    setContext(ctx);
    setRegime(initialRegime);
    void consult(ctx, initialRegime);
  }, [consult]);

  function handleRegimeChange(next: RegimeHidrico) {
    setRegime(next);
    if (context) void consult(context, next);
  }

  const backHref = context?.area && context?.proposta ? "/resultado" : "/etapas";

  return (
    <>
      <div className="rz-topo">
        <Voltar href={backHref} />
        <Selo>Simulação</Selo>
      </div>

      <div className="rz-bloco-titulo">
        {context?.area ? <p className="rz-sobretitulo">{context.area.displayName}</p> : null}
        <h1 className="rz-titulo">Relatos semelhantes</h1>
        <p className="rz-texto">
          Experiências comparadas com a sua área, mostrando semelhanças, diferenças e exclusões.
        </p>
      </div>

      <div className="rz-grupo">
        <p className="rz-rotulo">Regime hídrico da consulta</p>
        <div className="rz-chips rz-chips--iguais">
          <Chip selecionado={regime === "rainfed"} onClick={() => handleRegimeChange("rainfed")}>
            Sequeiro
          </Chip>
          <Chip selecionado={regime === "irrigated"} onClick={() => handleRegimeChange("irrigated")}>
            Irrigado
          </Chip>
        </div>
        {context?.proposta ? (
          <p className="rz-ajuda">
            Rotação comparada: {context.proposta.seasons.map((s) => s.crop).join(" → ")}
          </p>
        ) : (
          <p className="rz-ajuda">
            Sem rotação escolhida — comparando apenas área e regime hídrico.
          </p>
        )}
      </div>

      {busy ? <p className="rz-texto">Consultando relatos…</p> : null}
      {error ? <p className="rz-erro" role="alert">{error}</p> : null}

      {result ? (
        <>
          <AvisoQ />

          <section aria-label="Relatos comparáveis" className="rz-grupo">
            <h2 className="rz-rotulo">
              Comparáveis ({result.comparable_reports.length})
            </h2>
            {result.comparable_reports.length === 0 ? (
              <p className="rz-nota">Nenhum relato comparável para esse contexto.</p>
            ) : (
              <ul className="rz-cartoes">
                {result.comparable_reports.map((item) => (
                  <li key={item.report.id} className="rz-cartao" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                    <div className="rz-cartao-texto">
                      <strong>{item.report.title}</strong>
                      <span className="rz-sobretitulo">
                        {item.report.place} · {item.report.crops.join(" → ")}
                      </span>
                    </div>
                    <p className="rz-nota">{item.report.summary}</p>
                    {item.similarities.length > 0 ? (
                      <div className="rz-nota">
                        <strong className="rz-cor-elegivel">Semelhanças:</strong>{" "}
                        {item.similarities.join(" ")}
                      </div>
                    ) : null}
                    {item.differences.length > 0 ? (
                      <div className="rz-nota">
                        <strong className="rz-cor-inconclusiva">Diferenças:</strong>{" "}
                        {item.differences.join(" ")}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Relatos excluídos" className="rz-grupo">
            <h2 className="rz-rotulo">
              Excluídos ({result.excluded_reports.length})
            </h2>
            {result.excluded_reports.length === 0 ? (
              <p className="rz-nota">Nenhum relato excluído.</p>
            ) : (
              <ul className="rz-cartoes">
                {result.excluded_reports.map((item) => (
                  <li key={item.report.id} className="rz-cartao" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                    <div className="rz-cartao-texto">
                      <strong>{item.report.title}</strong>
                      <span className="rz-sobretitulo">
                        {item.report.place} · {item.report.crops.join(" → ")}
                      </span>
                    </div>
                    <div className="rz-nota">
                      <strong className="rz-cor-excluida">Exclusão:</strong>{" "}
                      {item.exclusion_reasons.join(" ")}
                    </div>
                    {item.similarities.length > 0 ? (
                      <div className="rz-nota">
                        <strong>Semelhanças:</strong> {item.similarities.join(" ")}
                      </div>
                    ) : null}
                    {item.differences.length > 0 ? (
                      <div className="rz-nota">
                        <strong>Diferenças:</strong> {item.differences.join(" ")}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      <Espaco />
      <div className="rz-acoes rz-acoes--justas">
        <Botao tipo="secundario" href={backHref}>
          {backHref === "/resultado" ? "Voltar ao resultado" : "Todas as etapas"}
        </Botao>
        <LinkAcao href="/area">Alterar dados da área</LinkAcao>
      </div>
    </>
  );
}
