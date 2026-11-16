"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Botao, Espaco, ItemDado, LinkAcao, Voltar } from "../_ui/ui";
import { Area, EstadoApi, Proposta, Solo, enviar, lerArea, lerProposta, lerSolo, rotuloRotacao } from "../_ui/fluxo";

type Regra = { outcome: "violated" | "passed"; source: string; source_urls: string[] };
type Verificacao = { status: EstadoApi; checked_rules: Regra[] };

function nomeDaFonte(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "fonte"; }
}

export default function Pendencias() {
  const [area, setArea] = useState<Area | null>(null);
  const [solo, setSolo] = useState<Solo | null>(null);
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [regra, setRegra] = useState<Regra | null>(null);

  useEffect(() => {
    const guardada = lerProposta();
    setArea(lerArea()); setSolo(lerSolo()); setProposta(guardada);
    if (!guardada) return;
    enviar<Verificacao>("/api/restrictions", { proposal: guardada }).then((resposta) => {
      const primeira = resposta.ok ? resposta.dados?.checked_rules?.[0] : null;
      if (primeira && Array.isArray(primeira.source_urls)) setRegra(primeira);
    });
  }, []);

  const soloConhecido = solo?.status === "known";
  const temClima = area?.clima?.chuvaAno != null || area?.clima?.temperatura != null;
  const mesmaCultura = regra?.outcome === "violated";
  const temAlgo = Boolean(area || soloConhecido || (regra && !mesmaCultura));

  return (
    <>
      <div className="rz-topo"><Voltar href="/resultado/detalhe" /></div>
      <div className="rz-bloco-titulo">
        {proposta ? <p className="rz-sobretitulo">{rotuloRotacao(proposta.seasons)}</p> : null}
        <h1 className="rz-titulo">O que falta para concluir</h1>
      </div>

      {temAlgo ? (
      <section className="rz-grupo">
        <h2 className="rz-rotulo">Já temos</h2>
        <ul className="rz-lista">
          {area ? <ItemDado titulo="Onde fica a área" encontrado origem={area.displayName} /> : null}
          {temClima ? <ItemDado titulo="Chuva e temperatura" encontrado origem="Média da região · NASA" /> : null}
          {soloConhecido && solo?.status === "known"
            ? <ItemDado titulo="Tipo de solo" encontrado origem={`${solo.classification} · você informou`} />
            : null}
          {regra && !mesmaCultura
            ? <ItemDado titulo="Culturas diferentes nas duas safras" encontrado origem="É o que uma rotação pede." />
            : null}
        </ul>
      </section>
      ) : null}

      <section className="rz-grupo">
        <h2 className="rz-rotulo">Ainda falta</h2>
        <ul className="rz-lista">
          {!area ? (
            <ItemDado
              titulo="Onde fica a área" encontrado={false} origem="Você ainda não informou."
              acao={<Link href="/area" className="rz-informar">Informar</Link>}
            />
          ) : null}
          {mesmaCultura ? (
            <ItemDado
              titulo="Culturas diferentes" encontrado={false} origem="Você escolheu a mesma nas duas safras."
              acao={<Link href="/plantar" className="rz-informar">Trocar</Link>}
            />
          ) : null}
          {!soloConhecido ? (
            <ItemDado
              titulo="Tipo de solo" encontrado={false} origem="Sem ele, não dá para usar regras que dependem do solo."
              acao={<Link href="/area" className="rz-informar">Informar</Link>}
            />
          ) : null}
          <ItemDado
            titulo="Regras de plantio da região" encontrado={false}
            origem="Ainda não temos. Essa parte depende de nós, não de você."
          />
          <ItemDado
            titulo="Relatos de agricultores" encontrado={false}
            origem="Ainda não há relatos reais para comparar."
          />
        </ul>
      </section>

      {regra ? (
        <p className="rz-nota">
          Regra usada: rotação é plantar culturas diferentes em sequência. Fontes: {regra.source}.{" "}
          {regra.source_urls.map((url, indice) => (
            <span key={url}>
              {indice > 0 ? " · " : ""}
              <a href={url} target="_blank" rel="noreferrer">{nomeDaFonte(url)}</a>
            </span>
          ))}
        </p>
      ) : null}

      <Espaco />
      <div className="rz-acoes rz-acoes--justas">
        <Botao href="/plantar">Testar outra rotação</Botao>
        <LinkAcao href="/">Voltar ao início</LinkAcao>
      </div>
    </>
  );
}
