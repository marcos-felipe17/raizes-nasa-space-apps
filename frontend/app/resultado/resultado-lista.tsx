"use client";

import { useEffect, useState } from "react";
import { AvisoQ, Botao, CartaoRotacao, Espaco, Marca } from "../_ui/ui";
import {
  Area, CHAVES, OpcaoComparada, detalheCurto, enviar, ler, lerArea, lerProposta, rotuloRotacao,
} from "../_ui/fluxo";

type Comparacao = { status: "ready" | "limited"; reason: string; options: OpcaoComparada[] };
type Culturas = { candidate_crops?: { status: string; crops?: string[] } };

export default function ResultadoLista() {
  const [area, setArea] = useState<Area | null>(null);
  const [comparacao, setComparacao] = useState<Comparacao | null>(null);
  const [situacao, setSituacao] = useState<"carregando" | "sem-dados" | "erro" | "pronto">("carregando");

  useEffect(() => {
    const guardada = lerArea();
    const proposta = lerProposta();
    setArea(guardada);
    if (!guardada || !proposta) { setSituacao("sem-dados"); return; }
    const culturas = ler<Culturas>(CHAVES.culturas)?.candidate_crops ?? { status: "unknown" };
    enviar<Comparacao>("/api/comparison", {
      latitude: guardada.latitude, longitude: guardada.longitude,
      proposal: proposta, candidate_crops: culturas,
    }).then((resposta) => {
      if (!resposta.ok || !Array.isArray(resposta.dados?.options)) { setSituacao("erro"); return; }
      setComparacao(resposta.dados);
      try { window.sessionStorage.setItem(CHAVES.resultado, JSON.stringify(resposta.dados.options)); }
      catch { /* o detalhe volta a consultar a proposta */ }
      setSituacao("pronto");
    });
  }, []);

  const total = comparacao?.options.length ?? 0;

  return (
    <>
      <div className="rz-topo"><Marca /></div>
      <div className="rz-bloco-titulo">
        {area ? <p className="rz-sobretitulo">{area.displayName}</p> : null}
        <h1 className="rz-titulo">
          {situacao === "pronto"
            ? (total === 1 ? "Uma rotação avaliada" : `${total} rotações avaliadas`)
            : "Rotações avaliadas"}
        </h1>
      </div>

      {situacao === "carregando" ? <p className="rz-texto">Avaliando as rotações…</p> : null}
      {situacao === "sem-dados" ? (
        <p className="rz-texto">Diga onde fica a área e escolha uma rotação para ver o resultado.</p>
      ) : null}
      {situacao === "erro" ? (
        <p className="rz-erro" role="alert">Não deu para avaliar agora. Tente de novo.</p>
      ) : null}

      {comparacao ? (
        <>
          <ul className="rz-cartoes">
            {comparacao.options.map((opcao, indice) => (
              <CartaoRotacao
                key={indice} href={`/resultado/detalhe?i=${indice}`}
                rotacao={rotuloRotacao(opcao.seasons)}
                estado={opcao.state === "excluded" ? "excluida" : "inconclusiva"}
                detalhe={detalheCurto(opcao.state)}
              />
            ))}
          </ul>
          {comparacao.status === "limited" ? (
            <p className="rz-nota">
              Ainda não temos outras opções para sugerir nesta região.
            </p>
          ) : null}
        </>
      ) : null}

      <Espaco />
      <AvisoQ />
      <Botao tipo="secundario" href={situacao === "sem-dados" ? "/area" : "/plantar"}>Nova análise</Botao>
    </>
  );
}
