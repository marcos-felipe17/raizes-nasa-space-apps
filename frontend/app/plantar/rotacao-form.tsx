"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Botao, Chip, Espaco, LinkAcao, Progresso } from "../_ui/ui";
import { CHAVES, CULTURAS, Proposta, enviar, gravar, lerProposta, montarProposta } from "../_ui/fluxo";

type Validacao = { proposal: Proposta; analysis_performed: false };

export default function RotacaoForm() {
  const router = useRouter();
  const [primeira, setPrimeira] = useState("");
  const [segunda, setSegunda] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const proposta = lerProposta();
    if (!proposta) return;
    const [a, b] = proposta.seasons.map((s) => s.crop);
    if (CULTURAS.includes(a)) setPrimeira(a);
    if (CULTURAS.includes(b)) setSegunda(b);
  }, []);

  const completa = Boolean(primeira && segunda);

  async function seguir(destino: string) {
    if (!completa) return;
    setOcupado(true); setErro("");
    const resposta = await enviar<Validacao>("/api/rotation-proposal", montarProposta(primeira, segunda));
    if (!resposta.ok || !resposta.dados?.proposal) {
      setErro("Não foi possível registrar a rotação agora. Tente novamente.");
      setOcupado(false);
      return;
    }
    gravar(CHAVES.proposta, resposta.dados);
    gravar(CHAVES.culturas, {
      candidate_crops: { status: "known", crops: Array.from(new Set([primeira, segunda])) },
      eligibility_evaluated: false,
      missing_for_analysis: [],
    });
    try { window.sessionStorage.removeItem(CHAVES.resultado); } catch { /* sem sessão, nada a limpar */ }
    router.push(destino);
  }

  return (
    <>
      <Progresso passo={3} />
      <h1 className="rz-titulo">O que você quer plantar?</h1>

      <fieldset className="rz-grupo">
        <legend className="rz-rotulo" style={{ marginBottom: 10 }}>1ª safra</legend>
        <div className="rz-chips">
          {CULTURAS.map((cultura) => (
            <Chip key={cultura} selecionado={primeira === cultura} onClick={() => setPrimeira(cultura)}>{cultura}</Chip>
          ))}
        </div>
      </fieldset>

      <div className="rz-divisor" aria-hidden="true">
        <img src="/raizes/seta-baixo.svg" alt="" width={18} height={18} />
      </div>

      <fieldset className="rz-grupo">
        <legend className="rz-rotulo" style={{ marginBottom: 10 }}>2ª safra</legend>
        <div className="rz-chips">
          {CULTURAS.map((cultura) => (
            <Chip key={cultura} selecionado={segunda === cultura} onClick={() => setSegunda(cultura)}>{cultura}</Chip>
          ))}
        </div>
      </fieldset>

      {erro ? <p className="rz-erro" role="alert">{erro}</p> : null}
      <Espaco />
      <div className="rz-acoes rz-acoes--justas">
        <Botao onClick={() => seguir("/resultado/detalhe")} disabled={!completa || ocupado}>
          {completa ? `Analisar ${primeira} → ${segunda}` : "Escolha as duas safras"}
        </Botao>
        <LinkAcao onClick={() => seguir("/resultado")} disabled={!completa || ocupado}>
          Comparar com outras opções
        </LinkAcao>
      </div>
    </>
  );
}
