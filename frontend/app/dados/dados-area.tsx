"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Botao, Espaco, ItemDado, Progresso } from "../_ui/ui";
import { Area, Solo, lerArea, lerSolo, listar } from "../_ui/fluxo";

const SEM_CLIMA = "Não deu para consultar a NASA agora. Volte ao passo 1 e tente de novo.";

export default function DadosArea() {
  const [area, setArea] = useState<Area | null>(null);
  const [solo, setSolo] = useState<Solo | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => { setArea(lerArea()); setSolo(lerSolo()); setPronto(true); }, []);

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

  const clima = area?.clima ?? null;
  const chuva = clima?.chuvaAno != null
    ? `Cerca de ${clima.chuvaAno.toLocaleString("pt-BR")} mm por ano${
      clima.mesesChuvosos.length ? `. Chove mais em ${listar(clima.mesesChuvosos)}` : ""} · NASA`
    : SEM_CLIMA;
  const temperatura = clima?.temperatura != null
    ? `Média de ${clima.temperatura} °C no ano · NASA`
    : SEM_CLIMA;
  const soloConhecido = solo?.status === "known";

  return (
    <>
      <Progresso passo={2} />
      <div className="rz-bloco-titulo">
        <h1 className="rz-titulo">O que já sabemos da sua área</h1>
        {area ? <p className="rz-sobretitulo">{area.displayName}</p> : null}
      </div>
      <ul className="rz-lista">
        <ItemDado titulo="Chuva na região" encontrado={clima?.chuvaAno != null} origem={pronto ? chuva : ""} />
        <ItemDado titulo="Temperatura" encontrado={clima?.temperatura != null} origem={pronto ? temperatura : ""} />
        <ItemDado
          titulo="Regras de plantio da região" encontrado={false}
          origem="Ainda não temos para esta região."
        />
        <ItemDado
          titulo="Tipo de solo" encontrado={soloConhecido}
          origem={soloConhecido && solo?.status === "known"
            ? `${solo.classification} · você informou`
            : "Você ainda não informou."}
          acao={soloConhecido ? undefined : <Link href="/area" className="rz-informar">Informar</Link>}
        />
      </ul>
      <Espaco />
      <div className="rz-acoes">
        <Botao href="/plantar">Continuar</Botao>
        <p className="rz-rodape">
          Os números da NASA são a média da região, não da sua roça.
        </p>
      </div>
    </>
  );
}
