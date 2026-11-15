import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Botao, Espaco, LinkAcao, Marca, Selo, Tela, Veredito, Voltar } from "../../_ui/ui";
import { AREA_EXEMPLO, ChaveExemplo, ROTACOES_EXEMPLO } from "../exemplo";

export const metadata: Metadata = {
  title: "Raízes | Exemplo de rotação",
  description: "Exemplo fictício do resultado de uma rotação.",
};

export function generateStaticParams() {
  return Object.keys(ROTACOES_EXEMPLO).map((rotacao) => ({ rotacao }));
}

export default async function ExemploRotacaoPage({ params }: { params: Promise<{ rotacao: string }> }) {
  const { rotacao } = await params;
  if (!(rotacao in ROTACOES_EXEMPLO)) notFound();
  const item = ROTACOES_EXEMPLO[rotacao as ChaveExemplo];

  if (item.estado === "elegivel") {
    return (
      <Tela>
        <div className="rz-topo"><Marca /><Selo>Exemplo fictício</Selo></div>
        <div className="rz-bloco-titulo rz-bloco-titulo--detalhe">
          <p className="rz-sobretitulo">{AREA_EXEMPLO}</p>
          <h1 className="rz-titulo rz-titulo--detalhe">{item.rotacao}</h1>
          <div className="rz-situacao">
            <img src="/raizes/elegivel-20.svg" alt="" width={20} height={20} />
            <p className="rz-cor-elegivel">Elegível</p>
          </div>
        </div>
        <div className="rz-indicadores">
          <div className="rz-indicador">
            <p className="rz-indicador-rotulo">Adequação R</p>
            <p className="rz-indicador-valor">{item.indice}</p>
          </div>
          <div className="rz-indicador rz-indicador--vazio">
            <p className="rz-indicador-rotulo">Comunidade Q</p>
            <p className="rz-indicador-texto">Sem relatos reais ainda</p>
          </div>
        </div>
        <div className="rz-baseado">
          <p className="rz-sobretitulo">Baseado em</p>
          <p>Chuva e temperatura da NASA, regras de plantio da região e o que você informou da sua área.</p>
        </div>
        <Espaco />
        <p className="rz-nota">Resultado exploratório, sem revisão agronômica. Não é recomendação de plantio.</p>
        <Botao tipo="secundario" href="/exemplo/dados">Ver os dados</Botao>
      </Tela>
    );
  }

  return (
    <Tela quente>
      <div className="rz-topo"><Voltar href="/exemplo" /><Selo>Exemplo fictício</Selo></div>
      <Espaco />
      <Veredito rotacao={item.rotacao} estado={item.estado} motivo={item.motivo} />
      <Espaco />
      <div className="rz-acoes rz-acoes--justas">
        {item.estado === "inconclusiva"
          ? <Botao href="/area">Informar tipo de solo</Botao>
          : <Botao href="/area">Nova análise</Botao>}
        <LinkAcao href="/exemplo/dados">Ver o que já sabemos</LinkAcao>
      </div>
      <p className="rz-rodape">Chuva e temperatura: NASA · Regras: base regional</p>
    </Tela>
  );
}
