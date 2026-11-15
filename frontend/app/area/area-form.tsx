"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Botao, Chip, Espaco, Progresso } from "../_ui/ui";
import { CHAVES, RegimeHidrico, Solo, TEXTURAS, enviar, gravar, ler, lerArea, lerSolo } from "../_ui/fluxo";

type Localizacao = { place: string; coordinates: { lat: number; lon: number; display_name: string } };
type Perfil = { profile: { soil: Solo; water_regime: RegimeHidrico }; missing_for_analysis: string[] };

export default function AreaForm() {
  const router = useRouter();
  const [municipio, setMunicipio] = useState("");
  const [regime, setRegime] = useState<RegimeHidrico>("rainfed");
  const [textura, setTextura] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const area = lerArea();
    if (area) setMunicipio(area.place);
    const perfil = ler<{ profile?: { water_regime?: string } }>(CHAVES.perfil);
    if (perfil?.profile?.water_regime === "irrigated") setRegime("irrigated");
    const solo = lerSolo();
    if (solo?.status === "known" && TEXTURAS.some((t) => t.valor === solo.classification)) {
      setTextura(solo.classification);
    }
  }, []);

  async function continuar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const lugar = municipio.trim();
    if (lugar.length < 2) { setErro("Informe o município da área."); return; }
    setOcupado(true); setErro("");

    const local = await enviar<Localizacao & { detail?: unknown }>("/api/location", { place: lugar });
    if (!local.ok || !local.dados?.coordinates) {
      setErro(local.status === 404
        ? "Não encontramos esse município. Tente com a sigla do estado, como “Sinop, MT”."
        : "Não foi possível localizar a área agora. Tente novamente.");
      setOcupado(false);
      return;
    }

    const solo: Solo = textura
      ? { status: "known", classification: textura, source: "farmer" }
      : { status: "unknown" };
    const perfil = await enviar<Perfil>("/api/profile", { soil: solo, water_regime: regime });
    if (!perfil.ok || !perfil.dados?.profile) {
      setErro("Não foi possível registrar a água e o solo agora. Tente novamente.");
      setOcupado(false);
      return;
    }

    const { lat, lon, display_name } = local.dados.coordinates;
    gravar(CHAVES.area, { place: lugar, displayName: display_name, latitude: lat, longitude: lon });
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
      </div>

      {erro ? <p className="rz-erro" role="alert">{erro}</p> : null}
      <Espaco />
      <Botao submit disabled={ocupado}>{ocupado ? "Buscando dados…" : "Continuar"}</Botao>
    </form>
  );
}
