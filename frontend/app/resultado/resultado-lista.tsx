"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvisoQ, Botao, Espaco, Estado, LinkAcao, Marca } from "../_ui/ui";
import { Area, CHAVES, enviar, lerArea, lerSafras, lerSolo, listar, regimeGuardado, texturaZarc } from "../_ui/fluxo";
import {
  CoberturaZarc, ESTADO_VISUAL, ROTULO_ZARC, ResultadoZarc, culturasNaEpoca, explicacaoSafra,
  nomeDecendio, resumoSafra,
} from "../_ui/zarc";

const TITULO: Record<ResultadoZarc["status"], string> = {
  eligible: "Todas as safras dentro da época",
  inconclusive: "Falta pouco para fechar",
  excluded: "Alguma safra fica fora da regra",
  no_coverage: "Parte da rotação não tem regra oficial",
};

export default function ResultadoLista() {
  const [area, setArea] = useState<Area | null>(null);
  const [resultado, setResultado] = useState<ResultadoZarc | null>(null);
  const [cobertura, setCobertura] = useState<CoberturaZarc | null>(null);
  const [situacao, setSituacao] = useState<"carregando" | "sem-dados" | "erro" | "pronto">("carregando");

  useEffect(() => {
    const guardada = lerArea();
    const safras = lerSafras();
    setArea(guardada);
    if (!guardada || !safras) { setSituacao("sem-dados"); return; }
    const local = { uf: guardada.uf, municipality: guardada.municipio, ibge_code: guardada.ibge };
    const contexto = { water_regime: regimeGuardado(), soil_texture: texturaZarc(lerSolo()) };
    Promise.all([
      enviar<ResultadoZarc>("/api/zarc-evaluate", { ...local, ...contexto, seasons: safras }),
      enviar<CoberturaZarc>("/api/zarc-coverage", { ...local, ...contexto }),
    ]).then(([avaliacao, janelas]) => {
      if (!avaliacao.ok || !avaliacao.dados?.seasons) { setSituacao("erro"); return; }
      setResultado(avaliacao.dados);
      try { window.sessionStorage.setItem(CHAVES.resultado, JSON.stringify(avaliacao.dados)); }
      catch { /* o resumo volta a consultar */ }
      if (janelas.ok && janelas.dados) setCobertura(janelas.dados);
      setSituacao("pronto");
    });
  }, []);

  const portarias = resultado ? [...new Set(resultado.seasons.flatMap((s) => s.ordinances))] : [];

  return (
    <>
      <div className="rz-topo"><Marca /></div>
      <div className="rz-bloco-titulo">
        {area ? <p className="rz-sobretitulo">{area.displayName}</p> : null}
        <h1 className="rz-titulo">
          {!resultado ? "Sua rotação"
            : !resultado.municipality ? "Sem regra oficial para essa região"
              : TITULO[resultado.status]}
        </h1>
      </div>

      {situacao === "carregando" ? <p className="rz-texto">Conferindo cada safra no zoneamento…</p> : null}
      {situacao === "sem-dados" ? (
        <p className="rz-texto">Diga onde fica a área e escolha as safras para ver o resultado.</p>
      ) : null}
      {situacao === "erro" ? (
        <p className="rz-erro" role="alert">Não deu para avaliar agora. Tente de novo.</p>
      ) : null}

      {resultado ? (
        <ul className="rz-safras">
          {resultado.seasons.map((safra, indice) => {
            const estado = ESTADO_VISUAL[safra.status];
            const outras = safra.status !== "eligible" && cobertura
              ? culturasNaEpoca(cobertura.windows, safra.planting_decendio, safra.crop)
              : [];
            return (
              <li key={indice} className="rz-safra">
                <Estado estado={estado} />
                <div className="rz-safra-texto">
                  <strong>{indice + 1}ª · {safra.crop} <span className="rz-cor-indisponivel">no {nomeDecendio(safra.planting_decendio)}</span></strong>
                  <span className={`rz-cor-${estado}`}>{ROTULO_ZARC[safra.status]} · {resumoSafra(safra)}</span>
                  <small>{explicacaoSafra(safra)}</small>
                  {outras.length ? <small>Nessa época, o ZARC indica aqui: {listar(outras)}.</small> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {resultado ? (
        <p className="rz-fonte">
          Fonte: Zoneamento Agrícola de Risco Climático (ZARC), MAPA, safra {resultado.source.crop_year}
          {portarias.length ? ` · ${portarias.join("; ")}` : ""}.{" "}
          <a href={resultado.source.url} target="_blank" rel="noreferrer">Tabela oficial</a>.
          {" "}O risco é a chance de perda por clima na época de plantio, não uma nota da rotação.
        </p>
      ) : null}

      <Espaco />
      <AvisoQ />
      <div className="rz-acoes rz-acoes--justas">
        {situacao === "pronto" && resultado?.status !== "eligible"
          ? <Botao href="/pendencias">Ver o que falta</Botao>
          : null}
        <Botao tipo={situacao === "pronto" && resultado?.status !== "eligible" ? "secundario" : "primario"}
          href={situacao === "sem-dados" ? "/area" : "/plantar"}>
          {situacao === "sem-dados" ? "Começar" : "Mudar as safras"}
        </Botao>
        {situacao === "pronto" ? <LinkAcao href="/relatos">Consultar relatos semelhantes</LinkAcao> : null}
      </div>
      <p className="rz-nota">
        Resultado exploratório, sem revisão agronômica. Não é recomendação de plantio. <Link href="/exemplo">Ver um exemplo</Link>.
      </p>
    </>
  );
}
