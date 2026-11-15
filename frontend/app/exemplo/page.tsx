import type { Metadata } from "next";
import { AvisoQ, Botao, CartaoRotacao, Espaco, Marca, Selo, Tela } from "../_ui/ui";
import { AREA_EXEMPLO, ChaveExemplo, ROTACOES_EXEMPLO } from "./exemplo";

export const metadata: Metadata = {
  title: "Raízes | Exemplo",
  description: "Exemplo fictício de rotações avaliadas, para mostrar os estados possíveis.",
};

export default function ExemploPage() {
  const chaves = Object.keys(ROTACOES_EXEMPLO) as ChaveExemplo[];
  return (
    <Tela>
      <div className="rz-topo"><Marca /><Selo>Exemplo fictício</Selo></div>
      <div className="rz-bloco-titulo">
        <p className="rz-sobretitulo">{AREA_EXEMPLO}</p>
        <h1 className="rz-titulo">{chaves.length} rotações avaliadas</h1>
      </div>
      <ul className="rz-cartoes">
        {chaves.map((chave) => {
          const item = ROTACOES_EXEMPLO[chave];
          return (
            <CartaoRotacao
              key={chave} href={`/exemplo/${chave}`} rotacao={item.rotacao}
              estado={item.estado} detalhe={item.detalhe} indice={item.indice}
            />
          );
        })}
      </ul>
      <Espaco />
      <AvisoQ />
      <Botao tipo="secundario" href="/area">Nova análise</Botao>
    </Tela>
  );
}
