import Link from "next/link";
import type { ReactNode } from "react";

export type EstadoRotacao = "elegivel" | "inconclusiva" | "excluida" | "indisponivel";

const ICONE_ESTADO: Record<EstadoRotacao, string> = {
  elegivel: "/raizes/estado-elegivel.svg",
  inconclusiva: "/raizes/estado-inconclusiva.svg",
  excluida: "/raizes/estado-excluida.svg",
  indisponivel: "/raizes/estado-indisponivel.svg",
};

export const ROTULO_ESTADO: Record<EstadoRotacao, string> = {
  elegivel: "Elegível",
  inconclusiva: "Inconclusiva",
  excluida: "Excluída",
  indisponivel: "Indisponível",
};

export function Tela({ children, quente = false }: { children: ReactNode; quente?: boolean }) {
  return (
    <div className="rz-palco">
      <main className={quente ? "rz-tela rz-tela--quente" : "rz-tela"}>{children}</main>
    </div>
  );
}

export function Espaco() {
  return <div className="rz-espaco" aria-hidden="true" />;
}

export function Marca({ tamanho = "p" }: { tamanho?: "p" | "g" }) {
  const lado = tamanho === "g" ? 40 : 32;
  return (
    <Link href="/" className={`rz-marca rz-marca--${tamanho}`} aria-label="Raízes, página inicial">
      <img src="/raizes/logo.svg" alt="" width={lado} height={lado} />
      <span>raízes</span>
    </Link>
  );
}

export function Selo({ children }: { children: ReactNode }) {
  return <span className="rz-selo">{children}</span>;
}

export function Voltar({ href }: { href: string }) {
  return (
    <Link href={href} className="rz-voltar" aria-label="Voltar">
      <img src="/raizes/voltar.svg" alt="" width={22} height={22} />
    </Link>
  );
}

export function Progresso({ passo }: { passo: 1 | 2 | 3 }) {
  return (
    <div className="rz-progresso">
      <div className="rz-progresso-barras" aria-hidden="true">
        {[1, 2, 3].map((n) => <span key={n} data-feito={n <= passo} />)}
      </div>
      <p>Passo {passo} de 3</p>
    </div>
  );
}

type BotaoProps = {
  children: ReactNode;
  href?: string;
  tipo?: "primario" | "secundario";
  onClick?: () => void;
  disabled?: boolean;
  submit?: boolean;
};

export function Botao({ children, href, tipo = "primario", onClick, disabled, submit }: BotaoProps) {
  const classe = tipo === "secundario" ? "rz-botao rz-botao--secundario" : "rz-botao";
  if (href) return <Link href={href} className={classe}>{children}</Link>;
  return (
    <button type={submit ? "submit" : "button"} className={classe} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function LinkAcao({ children, href, onClick, disabled }: {
  children: ReactNode; href?: string; onClick?: () => void; disabled?: boolean;
}) {
  if (href) return <Link href={href} className="rz-link">{children}</Link>;
  return <button type="button" className="rz-link" onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Chip({ children, selecionado, onClick }: {
  children: ReactNode; selecionado: boolean; onClick: () => void;
}) {
  return (
    <button type="button" className="rz-chip" aria-pressed={selecionado} onClick={onClick}>
      {children}
    </button>
  );
}

export function Estado({ estado, grande = false }: { estado: EstadoRotacao; grande?: boolean }) {
  const lado = grande ? 44 : 20;
  return (
    <span className={grande ? "rz-estado rz-estado--grande" : "rz-estado"} data-estado={estado}>
      <img src={ICONE_ESTADO[estado]} alt="" width={lado} height={lado} />
    </span>
  );
}

export function AvisoQ() {
  return (
    <div className="rz-aviso">
      <img src="/raizes/indisponivel.svg" alt="" width={18} height={18} />
      <p>Ainda não há relatos reais de agricultores para comparar.</p>
    </div>
  );
}

/** Linha de "o que já sabemos": dado encontrado ou lacuna, com a origem. */
export function ItemDado({ titulo, origem, encontrado, acao }: {
  titulo: string; origem: string; encontrado: boolean; acao?: ReactNode;
}) {
  return (
    <li className="rz-item">
      <img src={encontrado ? "/raizes/check.svg" : "/raizes/alerta.svg"} alt="" width={22} height={22} />
      <div className="rz-item-texto">
        <strong>{titulo}</strong>
        <span data-alerta={!encontrado}>{origem}</span>
      </div>
      {acao}
    </li>
  );
}

/** Cartão de rotação na lista de resultados. O índice R só aparece quando existe. */
export function CartaoRotacao({ href, rotacao, estado, detalhe, indice }: {
  href: string; rotacao: string; estado: EstadoRotacao; detalhe?: string; indice?: string;
}) {
  return (
    <li>
      <Link href={href} className="rz-cartao">
        <Estado estado={estado} />
        <span className="rz-cartao-texto">
          <strong>{rotacao}</strong>
          <span className={`rz-cor-${estado}`}>
            {ROTULO_ESTADO[estado]}{detalhe ? ` · ${detalhe}` : ""}
          </span>
        </span>
        {indice ? <span className="rz-indice">{indice}</span> : null}
      </Link>
    </li>
  );
}

/** Tela de veredito centralizada (inconclusiva ou excluída). */
export function Veredito({ rotacao, estado, motivo }: {
  rotacao: string; estado: "inconclusiva" | "excluida"; motivo: string;
}) {
  return (
    <section className="rz-veredito" aria-live="polite">
      <p className="rz-veredito-rotacao">{rotacao}</p>
      <Estado estado={estado} grande />
      <h1 className="rz-veredito-titulo" data-estado={estado}>{ROTULO_ESTADO[estado]}</h1>
      <p className="rz-veredito-motivo">{motivo}</p>
    </section>
  );
}
