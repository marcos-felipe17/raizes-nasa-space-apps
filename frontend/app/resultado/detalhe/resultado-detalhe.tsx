"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Botao, Espaco, LinkAcao, Veredito, Voltar } from "../../_ui/ui";
import { CHAVES, EstadoApi, OpcaoComparada, Safra, enviar, lerProposta, rotuloRotacao } from "../../_ui/fluxo";

type Verificacao = { status: EstadoApi; reason: string };

function opcaoGuardada(indice: number): Safra[] | null {
  try {
    const bruto = window.sessionStorage.getItem(CHAVES.resultado);
    const opcoes = bruto ? (JSON.parse(bruto) as OpcaoComparada[]) : null;
    return Array.isArray(opcoes) && opcoes[indice]?.seasons?.length === 2 ? opcoes[indice].seasons : null;
  } catch {
    return null;
  }
}

export default function ResultadoDetalhe() {
  const indice = Number(useSearchParams().get("i") ?? "0") || 0;
  const [safras, setSafras] = useState<Safra[] | null>(null);
  const [verificacao, setVerificacao] = useState<Verificacao | null>(null);
  const [situacao, setSituacao] = useState<"carregando" | "sem-dados" | "erro" | "pronto">("carregando");

  useEffect(() => {
    const escolhidas = opcaoGuardada(indice) ?? lerProposta()?.seasons ?? null;
    setSafras(escolhidas);
    if (!escolhidas) { setSituacao("sem-dados"); return; }
    enviar<Verificacao>("/api/restrictions", { proposal: { seasons: escolhidas } }).then((resposta) => {
      const dados = resposta.dados;
      if (!resposta.ok || !dados || (dados.status !== "excluded" && dados.status !== "inconclusive")) {
        setSituacao("erro");
        return;
      }
      setVerificacao(dados);
      setSituacao("pronto");
    });
  }, [indice]);

  const excluida = verificacao?.status === "excluded";

  return (
    <>
      <div className="rz-topo"><Voltar href="/resultado" /></div>
      <Espaco />
      {situacao === "carregando" ? <p className="rz-texto" style={{ textAlign: "center" }}>Avaliando a rotação…</p> : null}
      {situacao === "sem-dados" ? (
        <p className="rz-texto" style={{ textAlign: "center" }}>Escolha uma rotação para ver o resultado.</p>
      ) : null}
      {situacao === "erro" ? (
        <p className="rz-erro" role="alert" style={{ textAlign: "center" }}>
          Não foi possível avaliar agora. Tente novamente.
        </p>
      ) : null}
      {verificacao && safras ? (
        <Veredito
          rotacao={rotuloRotacao(safras)}
          estado={excluida ? "excluida" : "inconclusiva"}
          motivo={verificacao.reason}
        />
      ) : null}
      <Espaco />
      <div className="rz-acoes rz-acoes--justas">
        {situacao === "sem-dados" ? <Botao href="/plantar">Escolher rotação</Botao> : null}
        {situacao === "pronto" && excluida ? <Botao href="/plantar">Escolher outra rotação</Botao> : null}
        {situacao === "pronto" && !excluida ? <Botao href="/restricoes">Ver a regra e as fontes</Botao> : null}
        {situacao === "pronto" && excluida
          ? <LinkAcao href="/restricoes">Ver a regra e as fontes</LinkAcao>
          : <LinkAcao href="/dados">Ver o que já sabemos</LinkAcao>}
      </div>
      <p className="rz-rodape">Chuva e temperatura: NASA POWER · Regras da região: ainda não conferidas</p>
    </>
  );
}
