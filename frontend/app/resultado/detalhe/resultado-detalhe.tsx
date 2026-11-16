"use client";

import { useEffect, useState } from "react";
import { Botao, Espaco, Estado, LinkAcao, Voltar } from "../../_ui/ui";
import { CHAVES } from "../../_ui/fluxo";
import { ESTADO_VISUAL, ROTULO_ZARC, ResultadoZarc, explicacaoSafra } from "../../_ui/zarc";

/** Resumo do último resultado: o estado da rotação e a safra que decide esse estado. */
export default function ResultadoDetalhe() {
  const [resultado, setResultado] = useState<ResultadoZarc | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.sessionStorage.getItem(CHAVES.resultado);
      const dados = bruto ? (JSON.parse(bruto) as ResultadoZarc) : null;
      if (dados && Array.isArray(dados.seasons)) setResultado(dados);
    } catch { /* sem resultado guardado */ }
    setPronto(true);
  }, []);

  const decisiva = resultado?.seasons.find((safra) => safra.status === resultado.status) ?? resultado?.seasons[0];

  return (
    <>
      <div className="rz-topo"><Voltar href="/resultado" /></div>
      <Espaco />
      {pronto && !resultado ? (
        <p className="rz-texto" style={{ textAlign: "center" }}>Escolha as safras para ver o resultado.</p>
      ) : null}
      {resultado && decisiva ? (
        <section className="rz-veredito" aria-live="polite">
          <p className="rz-veredito-rotacao">{resultado.seasons.map((s) => s.crop).join(" → ")}</p>
          <Estado estado={ESTADO_VISUAL[resultado.status]} grande />
          <h1 className="rz-veredito-titulo" data-estado={ESTADO_VISUAL[resultado.status]}>{ROTULO_ZARC[resultado.status]}</h1>
          <p className="rz-veredito-motivo">{decisiva.crop}: {explicacaoSafra(decisiva)}</p>
        </section>
      ) : null}
      <Espaco />
      <div className="rz-acoes rz-acoes--justas">
        <Botao href={resultado ? "/pendencias" : "/plantar"}>{resultado ? "Ver o que falta" : "Escolher safras"}</Botao>
        <LinkAcao href="/resultado">Ver todas as safras</LinkAcao>
      </div>
      <p className="rz-rodape">Chuva e temperatura: NASA · Época de plantio: ZARC/MAPA</p>
    </>
  );
}
