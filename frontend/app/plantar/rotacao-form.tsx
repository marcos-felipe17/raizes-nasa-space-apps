"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Botao, Chip, Espaco, Progresso } from "../_ui/ui";
import {
  CHAVES, CULTURAS, CULTURAS_EXTRAS, SafraEscolhida, enviar, gravar, lerArea, lerSafras, lerSolo,
  montarProposta, regimeGuardado, texturaZarc,
} from "../_ui/fluxo";
import { CoberturaZarc, JanelaCultura, MESES_LONGOS, PARTES, decendio, descreverJanela, partesDoDecendio } from "../_ui/zarc";

type Rascunho = { crop: string; mes: number | null; parte: number };

const MAX_SAFRAS = 4;
const NOVA: Rascunho = { crop: "", mes: null, parte: 0 };

/** Começo da época indicada; se houver safra anterior, o primeiro decêndio indicado depois dela. */
function primeiraEpoca(janela: JanelaCultura | undefined, depoisDe: number | null): number | null {
  // Prefere os decêndios de menor risco (20%); senão, a época indicada para todos os solos e ciclos.
  const opcoes = janela?.lowest_risk.length ? janela.lowest_risk
    : janela?.indicated_always.length ? janela.indicated_always : janela?.indicated_sometimes ?? [];
  if (!opcoes.length) return null;
  const conjunto = new Set(opcoes);
  // Sem referência, começa onde a janela começa de fato (a janela pode virar o ano).
  const alvo = depoisDe ?? (opcoes.find((valor) => !conjunto.has(valor === 1 ? 36 : valor - 1)) ?? opcoes[0]);
  return [...opcoes].sort((a, b) => ((a - alvo + 36) % 36) - ((b - alvo + 36) % 36))[0];
}

export default function RotacaoForm() {
  const router = useRouter();
  const [safras, setSafras] = useState<Rascunho[]>([{ ...NOVA }, { ...NOVA }]);
  const [cobertura, setCobertura] = useState<CoberturaZarc | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const guardadas = lerSafras();
    if (guardadas) {
      setSafras(guardadas.map((safra) => {
        const { mes, parte } = partesDoDecendio(safra.planting_decendio);
        return { crop: safra.crop, mes, parte };
      }));
    }
    const area = lerArea();
    if (!area) return;
    enviar<CoberturaZarc>("/api/zarc-coverage", {
      uf: area.uf, municipality: area.municipio, ibge_code: area.ibge,
      water_regime: regimeGuardado(), soil_texture: texturaZarc(lerSolo()),
    }).then((resposta) => { if (resposta.ok && resposta.dados) setCobertura(resposta.dados); });
  }, []);

  const culturas = useMemo(() => {
    if (!cobertura?.covered) return CULTURAS;
    const zoneadas = cobertura.windows.filter((janela) => janela.regime_zoned).map((janela) => janela.crop);
    return [...zoneadas, ...CULTURAS_EXTRAS.filter((extra) => !zoneadas.includes(extra))];
  }, [cobertura]);

  const janelaDe = (cultura: string) => cobertura?.windows.find((janela) => janela.crop === cultura);

  function atualizar(indice: number, mudanca: Partial<Rascunho>) {
    setSafras((atuais) => atuais.map((safra, i) => {
      if (i !== indice) return safra;
      const nova = { ...safra, ...mudanca };
      // Ao escolher a cultura, sugere a primeira época indicada pelo ZARC depois da safra anterior.
      if (mudanca.crop && safra.mes === null) {
        const anterior = atuais[i - 1];
        // Considera cerca de 100 dias (10 decêndios) de ciclo da safra anterior até a colheita.
        const fim = anterior && anterior.mes !== null ? decendio(anterior.mes, anterior.parte) + 10 : null;
        const sugestao = primeiraEpoca(janelaDe(mudanca.crop), fim !== null ? ((fim - 1) % 36) + 1 : null);
        if (sugestao !== null) Object.assign(nova, partesDoDecendio(sugestao));
      }
      return nova;
    }));
  }

  const completas = safras.every((safra) => safra.crop && safra.mes !== null);
  const rotulo = safras.map((safra) => safra.crop || "?").join(" → ");

  async function analisar() {
    if (!completas) return;
    setOcupado(true); setErro("");
    const escolhidas: SafraEscolhida[] = safras.map((safra) => ({
      crop: safra.crop, planting_decendio: decendio(safra.mes as number, safra.parte),
    }));
    gravar(CHAVES.safras, escolhidas);
    // Mantém a proposta de duas safras usada pelas telas de etapa e de relatos.
    const proposta = montarProposta(escolhidas[0].crop, escolhidas[1]?.crop ?? escolhidas[0].crop);
    const validada = await enviar<{ proposal: unknown }>("/api/rotation-proposal", proposta);
    if (validada.ok && validada.dados) gravar(CHAVES.proposta, validada.dados);
    gravar(CHAVES.culturas, {
      candidate_crops: { status: "known", crops: Array.from(new Set(escolhidas.map((s) => s.crop))) },
      eligibility_evaluated: false, missing_for_analysis: [],
    });
    router.push("/resultado");
  }

  return (
    <>
      <Progresso passo={3} />
      <div className="rz-bloco-titulo">
        <h1 className="rz-titulo">O que você quer plantar?</h1>
        {cobertura?.covered ? (
          <p className="rz-sobretitulo">Culturas com época oficial em {cobertura.municipality} aparecem primeiro.</p>
        ) : null}
      </div>

      {safras.map((safra, indice) => {
        const janela = safra.crop ? janelaDe(safra.crop) : undefined;
        const epoca = janela ? descreverJanela(janela.indicated_always.length ? janela.indicated_always : janela.indicated_sometimes) : "";
        return (
          <div key={indice} style={{ display: "contents" }}>
            {indice > 0 ? (
              <div className="rz-divisor" aria-hidden="true">
                <img src="/raizes/seta-baixo.svg" alt="" width={18} height={18} />
              </div>
            ) : null}
            <fieldset className="rz-grupo">
              <legend className="rz-rotulo rz-legenda">
                <span>{indice + 1}ª safra</span>
                {indice >= 2 ? (
                  <button type="button" className="rz-remover" onClick={() => setSafras((a) => a.filter((_, i) => i !== indice))}>
                    Remover
                  </button>
                ) : null}
              </legend>
              <div className="rz-chips">
                {culturas.map((cultura) => (
                  <Chip key={cultura} selecionado={safra.crop === cultura} onClick={() => atualizar(indice, { crop: cultura })}>
                    {cultura}
                  </Chip>
                ))}
              </div>
              {safra.crop ? (
                <div className="rz-epoca">
                  <label className="rz-ajuda" htmlFor={`mes-${indice}`}>Quando planta?</label>
                  <div className="rz-epoca-linha">
                    <select
                      id={`mes-${indice}`} className="rz-selecao rz-selecao--curta"
                      value={safra.parte} aria-label="Parte do mês"
                      onChange={(e) => atualizar(indice, { parte: Number(e.target.value) })}
                    >
                      {PARTES.map((parte, i) => <option key={parte} value={i}>{parte} de</option>)}
                    </select>
                    <select
                      className="rz-selecao" value={safra.mes ?? ""} aria-label="Mês do plantio"
                      onChange={(e) => atualizar(indice, { mes: e.target.value === "" ? null : Number(e.target.value) })}
                    >
                      <option value="">Escolha o mês</option>
                      {MESES_LONGOS.map((mes, i) => <option key={mes} value={i}>{mes}</option>)}
                    </select>
                  </div>
                  <p className="rz-ajuda">
                    {epoca ? `Época indicada pelo ZARC aqui: ${epoca}.` : janela
                      ? "Sem época indicada para esse tipo de água."
                      : cobertura?.covered ? "Sem época oficial para essa cultura aqui." : ""}
                  </p>
                </div>
              ) : null}
            </fieldset>
          </div>
        );
      })}

      {safras.length < MAX_SAFRAS ? (
        <button type="button" className="rz-adicionar" onClick={() => setSafras((a) => [...a, { ...NOVA }])}>
          + Adicionar safra
        </button>
      ) : null}

      {erro ? <p className="rz-erro" role="alert">{erro}</p> : null}
      <Espaco />
      <div className="rz-acoes rz-acoes--justas">
        <Botao onClick={analisar} disabled={!completas || ocupado}>
          {completas ? `Analisar ${rotulo}` : "Escolha a cultura e o mês de cada safra"}
        </Botao>
      </div>
    </>
  );
}
