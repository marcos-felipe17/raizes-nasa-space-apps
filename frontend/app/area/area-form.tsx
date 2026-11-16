"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Botao, Chip, Espaco, Progresso } from "../_ui/ui";
import { CHAVES, RegimeHidrico, Solo, TEXTURAS, enviar, gravar, lerArea, lerSolo, regimeGuardado, resumirClima } from "../_ui/fluxo";

type Localizacao = {
  place: string;
  coordinates: { lat: number; lon: number; display_name: string; municipality?: string | null; uf?: string | null };
  climate?: Parameters<typeof resumirClima>[0];
};
type Perfil = { profile: { soil: Solo; water_regime: RegimeHidrico }; missing_for_analysis: string[] };
type Cep = { municipality: string; uf: string; ibge_code: string };

function formatarCep(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);
  return numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
}

export default function AreaForm() {
  const router = useRouter();
  const [cep, setCep] = useState("");
  const [cepInfo, setCepInfo] = useState<Cep | null>(null);
  const [cepAviso, setCepAviso] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [regime, setRegime] = useState<RegimeHidrico>("rainfed");
  const [textura, setTextura] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const area = lerArea();
    if (area) setMunicipio(area.place);
    setRegime(regimeGuardado());
    const solo = lerSolo();
    if (solo?.status === "known" && TEXTURAS.some((t) => t.valor === solo.classification)) {
      setTextura(solo.classification);
    }
  }, []);

  async function buscarCep(valor: string) {
    const formatado = formatarCep(valor);
    setCep(formatado); setCepInfo(null); setCepAviso("");
    if (formatado.replace(/\D/g, "").length !== 8) return;
    setCepAviso("Buscando o CEP…");
    try {
      const resposta = await fetch(`/api/cep?cep=${formatado.replace(/\D/g, "")}`);
      const dados = (await resposta.json().catch(() => null)) as Cep | null;
      if (resposta.ok && dados?.municipality) {
        setCepInfo(dados);
        setMunicipio(`${dados.municipality}, ${dados.uf}`);
        setCepAviso(`${dados.municipality}, ${dados.uf}`);
      } else {
        setCepAviso(resposta.status === 404 ? "Não achamos esse CEP. Escreva o município abaixo." : "Não deu para buscar o CEP. Escreva o município abaixo.");
      }
    } catch {
      setCepAviso("Não deu para buscar o CEP. Escreva o município abaixo.");
    }
  }

  async function continuar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const lugar = municipio.trim();
    if (lugar.length < 2) { setErro("Escreva o nome do município ou o CEP."); return; }
    setOcupado(true); setErro("");

    const local = await enviar<Localizacao>("/api/location", { place: lugar });
    if (!local.ok || !local.dados?.coordinates) {
      setErro(local.status === 404
        ? "Não achamos esse município. Tente com a sigla do estado, como “Sinop, MT”."
        : "Não deu para buscar a área agora. Tente de novo.");
      setOcupado(false);
      return;
    }

    const solo: Solo = textura
      ? { status: "known", classification: textura, source: "farmer" }
      : { status: "unknown" };
    const perfil = await enviar<Perfil>("/api/profile", { soil: solo, water_regime: regime });
    if (!perfil.ok || !perfil.dados?.profile) {
      setErro("Não deu para guardar a água e o solo agora. Tente de novo.");
      setOcupado(false);
      return;
    }

    const { lat, lon, display_name, municipality, uf } = local.dados.coordinates;
    const usaCep = cepInfo && lugar === `${cepInfo.municipality}, ${cepInfo.uf}`;
    gravar(CHAVES.area, {
      place: lugar, displayName: display_name, latitude: lat, longitude: lon,
      clima: resumirClima(local.dados.climate),
      municipio: usaCep ? cepInfo.municipality : municipality ?? null,
      uf: usaCep ? cepInfo.uf : uf ?? null,
      ibge: usaCep ? cepInfo.ibge_code : null,
    });
    gravar(CHAVES.ponto, { latitude: lat, longitude: lon });
    gravar(CHAVES.perfil, perfil.dados);
    gravar(CHAVES.solo, { soil: perfil.dados.profile.soil, missing_for_analysis: perfil.dados.missing_for_analysis });
    router.push("/dados");
  }

  return (
    <form onSubmit={continuar} style={{ display: "contents" }} noValidate>
      <Progresso passo={1} />
      <h1 className="rz-titulo">Onde fica sua área?</h1>

      <div className="rz-campo">
        <label className="rz-rotulo" htmlFor="cep">CEP <span className="rz-opcional">(opcional)</span></label>
        <input
          id="cep" className="rz-entrada" value={cep} inputMode="numeric" autoComplete="postal-code"
          placeholder="00000-000" aria-describedby="cep-ajuda" onChange={(e) => buscarCep(e.target.value)}
        />
        <p className="rz-ajuda" id="cep-ajuda" aria-live="polite">{cepAviso || "Com o CEP a gente acha o município sozinho."}</p>
      </div>

      <div className="rz-campo">
        <label className="rz-rotulo" htmlFor="municipio">Município</label>
        <input
          id="municipio" className="rz-entrada" value={municipio} autoComplete="off"
          placeholder="Ex.: Caruaru, PE" maxLength={200} aria-describedby="municipio-ajuda"
          onChange={(e) => setMunicipio(e.target.value)}
        />
        <p className="rz-ajuda" id="municipio-ajuda">Só a região aproximada. Ninguém vê sua localização exata.</p>
      </div>

      <fieldset className="rz-campo">
        <legend className="rz-rotulo" style={{ marginBottom: 8 }}>De onde vem a água?</legend>
        <div className="rz-chips rz-chips--iguais">
          <Chip selecionado={regime === "rainfed"} onClick={() => setRegime("rainfed")}>Só chuva</Chip>
          <Chip selecionado={regime === "irrigated"} onClick={() => setRegime("irrigated")}>Irrigação</Chip>
        </div>
      </fieldset>

      <div className="rz-campo">
        <label className="rz-rotulo" htmlFor="solo">Tipo de solo</label>
        <select id="solo" className="rz-selecao" value={textura} onChange={(e) => setTextura(e.target.value)}>
          {TEXTURAS.map((t) => <option key={t.rotulo} value={t.valor}>{t.rotulo}</option>)}
        </select>
        <p className="rz-ajuda">Arenoso esfarela na mão; argiloso gruda e forma bolinha quando molhado.</p>
      </div>

      {erro ? <p className="rz-erro" role="alert">{erro}</p> : null}
      <Espaco />
      <Botao submit disabled={ocupado}>{ocupado ? "Buscando dados…" : "Continuar"}</Botao>
    </form>
  );
}
