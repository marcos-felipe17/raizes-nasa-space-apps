import type { Metadata } from "next";
import Link from "next/link";
import { Botao, Espaco, ItemDado, Selo, Tela, Voltar } from "../../_ui/ui";

export const metadata: Metadata = {
  title: "Raízes | Exemplo de dados da área",
  description: "Exemplo fictício dos dados encontrados e das lacunas de uma área.",
};

export default function ExemploDadosPage() {
  return (
    <Tela>
      <div className="rz-topo"><Voltar href="/exemplo" /><Selo>Exemplo fictício</Selo></div>
      <h1 className="rz-titulo">O que já sabemos da sua área</h1>
      <ul className="rz-lista">
        <ItemDado titulo="Chuva dos últimos anos" encontrado origem="NASA · satélite" />
        <ItemDado titulo="Temperatura" encontrado origem="NASA · satélite" />
        <ItemDado titulo="Regras de plantio da região" encontrado origem="Base regional" />
        <ItemDado
          titulo="Tipo de solo" encontrado={false} origem="Não encontramos. Você pode informar."
          acao={<Link href="/area" className="rz-informar">Informar</Link>}
        />
      </ul>
      <Espaco />
      <div className="rz-acoes">
        <Botao href="/exemplo">Voltar ao exemplo</Botao>
        <p className="rz-rodape">Sem o solo, algumas rotações podem ficar inconclusivas.</p>
      </div>
    </Tela>
  );
}
