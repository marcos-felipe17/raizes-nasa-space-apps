"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Botao, Espaco, ItemDado, Progresso } from "../_ui/ui";
import { Area, Solo, enviar, lerArea, lerSolo } from "../_ui/fluxo";

type Item = { key: string; status: "available" | "missing" | "unverified" };
type Cobertura = { items: Item[] };

const SEM_DADO = {
  missing: "A NASA não tem esse dado para este ponto.",
  unverified: "Não deu para consultar agora. Tente de novo mais tarde.",
  carregando: "Consultando a NASA…",
};

export default function DadosArea() {
  const [area, setArea] = useState<Area | null>(null);
  const [solo, setSolo] = useState<Solo | null>(null);
  const [pronto, setPronto] = useState(false);
  const [itens, setItens] = useState<Item[] | null>(null);

  useEffect(() => {
    const guardada = lerArea();
    const soloGuardado = lerSolo();
    setArea(guardada); setSolo(soloGuardado); setPronto(true);
    if (!guardada) return;
    enviar<Cobertura>("/api/data-coverage", {
      latitude: guardada.latitude, longitude: guardada.longitude,
      soil_known: soloGuardado?.status === "known", water_regime_known: true,
    }).then((resposta) => {
      setItens(resposta.ok && Array.isArray(resposta.dados?.items) ? resposta.dados.items : []);
    });
  }, []);

  if (pronto && !area) {
    return (
      <>
        <Progresso passo={2} />
        <h1 className="rz-titulo">O que já sabemos da sua área</h1>
        <p className="rz-texto">Primeiro diga onde fica a área, para buscarmos os dados da região.</p>
        <Espaco />
        <Botao href="/area">Informar a área</Botao>
      </>
    );
  }

  function clima(chave: string): { encontrado: boolean; origem: string } {
    if (itens === null) return { encontrado: false, origem: SEM_DADO.carregando };
    const status = itens.find((item) => item.key === chave)?.status ?? "unverified";
    return status === "available"
      ? { encontrado: true, origem: "NASA POWER · média histórica da região" }
      : { encontrado: false, origem: SEM_DADO[status] };
  }

  const chuva = clima("precipitation");
  const temperatura = clima("temperature");
  const soloConhecido = solo?.status === "known";

  return (
    <>
      <Progresso passo={2} />
      <div className="rz-bloco-titulo">
        <h1 className="rz-titulo">O que já sabemos da sua área</h1>
        {area ? <p className="rz-sobretitulo">{area.displayName}</p> : null}
      </div>
      <ul className="rz-lista">
        <ItemDado titulo="Chuva na região" encontrado={chuva.encontrado} origem={chuva.origem} />
        <ItemDado titulo="Temperatura" encontrado={temperatura.encontrado} origem={temperatura.origem} />
        <ItemDado
          titulo="Regras de plantio da região" encontrado={false}
          origem="Ainda não temos regras conferidas para esta região."
        />
        <ItemDado
          titulo="Tipo de solo" encontrado={soloConhecido}
          origem={soloConhecido && solo?.status === "known"
            ? `${solo.classification} · você informou`
            : "Não encontramos. Você pode informar."}
          acao={soloConhecido ? undefined : <Link href="/area" className="rz-informar">Informar</Link>}
        />
      </ul>
      <Espaco />
      <div className="rz-acoes">
        <Botao href="/plantar">Continuar assim mesmo</Botao>
        <p className="rz-rodape">
          {soloConhecido
            ? "Sem regras da região, as rotações podem ficar inconclusivas."
            : "Sem o solo e sem regras da região, as rotações podem ficar inconclusivas."}
        </p>
      </div>
    </>
  );
}
