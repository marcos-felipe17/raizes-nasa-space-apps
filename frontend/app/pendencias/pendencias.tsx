"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Botao, Espaco, ItemDado, LinkAcao, Voltar } from "../_ui/ui";
import { Area, Solo, enviar, lerArea, lerSafras, lerSolo, regimeGuardado, texturaZarc } from "../_ui/fluxo";
import { ResultadoZarc, descreverJanela } from "../_ui/zarc";

export default function Pendencias() {
  const [area, setArea] = useState<Area | null>(null);
  const [solo, setSolo] = useState<Solo | null>(null);
  const [resultado, setResultado] = useState<ResultadoZarc | null>(null);

  useEffect(() => {
    const guardada = lerArea();
    const soloGuardado = lerSolo();
    const safras = lerSafras();
    setArea(guardada); setSolo(soloGuardado);
    if (!guardada || !safras) return;
    enviar<ResultadoZarc>("/api/zarc-evaluate", {
      uf: guardada.uf, municipality: guardada.municipio, ibge_code: guardada.ibge,
      water_regime: regimeGuardado(), soil_texture: texturaZarc(soloGuardado), seasons: safras,
    }).then((resposta) => { if (resposta.ok && resposta.dados?.seasons) setResultado(resposta.dados); });
  }, []);

  const safras = resultado?.seasons ?? [];
  const soloConhecido = solo?.status === "known";
  const temClima = area?.clima?.chuvaAno != null || area?.clima?.temperatura != null;
  const cobre = Boolean(resultado?.municipality);
  const dependeSolo = safras.some((s) => s.depends_on.includes("soil"));
  const dependeCiclo = safras.some((s) => s.depends_on.includes("cycle"));
  const foraDaEpoca = safras.filter((s) => s.reason === "out_of_window");
  const semCobertura = safras.filter((s) => s.reason === "crop_not_zoned" || s.reason === "regime_not_zoned");
  const repetida = safras.find((s) => s.reason === "same_crop_in_sequence");
  const dentro = safras.filter((s) => s.status === "eligible");

  return (
    <>
      <div className="rz-topo"><Voltar href="/resultado" /></div>
      <div className="rz-bloco-titulo">
        {safras.length ? <p className="rz-sobretitulo">{safras.map((s) => s.crop).join(" → ")}</p> : null}
        <h1 className="rz-titulo">O que falta para concluir</h1>
      </div>

      <section className="rz-grupo">
        <h2 className="rz-rotulo">Já temos</h2>
        <ul className="rz-lista">
          {area ? <ItemDado titulo="Onde fica a área" encontrado origem={area.displayName} /> : null}
          {temClima ? <ItemDado titulo="Chuva e temperatura" encontrado origem="Média da região · NASA" /> : null}
          {cobre ? <ItemDado titulo="Regras de plantio" encontrado origem={`ZARC/MAPA, safra ${resultado?.source.crop_year}`} /> : null}
          {soloConhecido && solo?.status === "known"
            ? <ItemDado titulo="Tipo de solo" encontrado origem={`${solo.classification} · você informou`} />
            : null}
          {dentro.map((s) => (
            <ItemDado key={`ok-${s.crop}-${s.planting_decendio}`} titulo={`${s.crop} dentro da época`} encontrado
              origem={s.risk_min === s.risk_max ? `Risco climático de ${s.risk_min}%` : `Risco de ${s.risk_min}% a ${s.risk_max}%`} />
          ))}
        </ul>
      </section>

      <section className="rz-grupo">
        <h2 className="rz-rotulo">Ainda falta</h2>
        <ul className="rz-lista">
          {!area ? (
            <ItemDado titulo="Onde fica a área" encontrado={false} origem="Você ainda não informou."
              acao={<Link href="/area" className="rz-informar">Informar</Link>} />
          ) : null}
          {area && !lerSafras() ? (
            <ItemDado titulo="As safras" encontrado={false} origem="Escolha o que e quando vai plantar."
              acao={<Link href="/plantar" className="rz-informar">Escolher</Link>} />
          ) : null}
          {repetida ? (
            <ItemDado titulo="Culturas diferentes em seguida" encontrado={false}
              origem={`${repetida.crop} aparece duas vezes seguidas.`}
              acao={<Link href="/plantar" className="rz-informar">Trocar</Link>} />
          ) : null}
          {foraDaEpoca.map((s) => (
            <ItemDado key={`fora-${s.crop}`} titulo={`Época de ${s.crop}`} encontrado={false}
              origem={`Indicada aqui: ${descreverJanela(s.indicated_always.length ? s.indicated_always : s.indicated_sometimes) || "nenhuma"}.`}
              acao={<Link href="/plantar" className="rz-informar">Mudar</Link>} />
          ))}
          {dependeSolo && !soloConhecido ? (
            <ItemDado titulo="Tipo de solo" encontrado={false} origem="O resultado muda conforme o solo."
              acao={<Link href="/area" className="rz-informar">Informar</Link>} />
          ) : null}
          {dependeSolo && soloConhecido && !resultado?.soil_used ? (
            <ItemDado titulo="Classe de água do solo" encontrado={false}
              origem="Aqui o ZARC usa classes que só uma análise de solo mostra (AD1 a AD6)." />
          ) : null}
          {dependeCiclo ? (
            <ItemDado titulo="Ciclo da semente" encontrado={false}
              origem="Precoce, médio ou tardio: vem na embalagem. Ainda não perguntamos isso no app." />
          ) : null}
          {semCobertura.map((s) => (
            <ItemDado key={`sem-${s.crop}`} titulo={`Regra para ${s.crop}`} encontrado={false}
              origem={s.reason === "crop_not_zoned" ? "O ZARC não tem essa cultura aqui." : "Só há regra para o outro tipo de água."} />
          ))}
          {area && resultado && !cobre ? (
            <ItemDado titulo="Regras de plantio" encontrado={false} origem="Esse município não está no ZARC." />
          ) : null}
          <ItemDado titulo="Relatos de agricultores" encontrado={false} origem="Ainda não há relatos reais para comparar." />
        </ul>
      </section>

      <Espaco />
      <div className="rz-acoes rz-acoes--justas">
        <Botao href="/plantar">Mudar as safras</Botao>
        <LinkAcao href="/">Voltar ao início</LinkAcao>
      </div>
    </>
  );
}
