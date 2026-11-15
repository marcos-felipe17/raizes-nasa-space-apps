import type { Metadata } from "next";
import { Botao, Espaco, LinkAcao, Marca, Tela } from "./_ui/ui";

export const metadata: Metadata = {
  title: "Raízes",
  description: "Planeje a próxima safra com dados de satélite da NASA e o que você sabe da sua terra.",
};

export default function InicioPage() {
  return (
    <Tela>
      <Marca tamanho="g" />
      <Espaco />
      <div className="rz-mensagem">
        <h1 className="rz-titulo rz-titulo--capa">Planeje a próxima safra com o céu a seu favor.</h1>
        <p className="rz-texto">
          Junte o que você sabe da sua terra com dados de satélite da NASA e veja quais rotações fazem sentido.
        </p>
      </div>
      <Espaco />
      <div className="rz-acoes">
        <Botao href="/area">Analisar minha área</Botao>
        <LinkAcao href="/exemplo">Ver um exemplo</LinkAcao>
      </div>
      <p className="rz-rodape">Feito em Recife · NASA Space Apps 2026</p>
    </Tela>
  );
}
