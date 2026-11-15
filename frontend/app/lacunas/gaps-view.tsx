import Link from "next/link";

export type ExpectedSource =
  | "farmer_input"
  | "nasa_earth_observation"
  | "regional_agricultural_rule";

export type EvaluationStatus = "inconclusive" | "no_gaps_identified";

export type GapItem = {
  code: string;
  missing_data: string;
  dependent_rule: string;
  expected_source: ExpectedSource;
  reason: string;
  source: string;
};

export type UnverifiedItem = {
  code: string;
  label: string;
  status: "unverified";
  dependent_rule: string;
  expected_source: ExpectedSource;
  detail: string;
};

export type CropRuleCoverage = {
  crop: string;
  status: "no_coverage" | "covered";
  expected_source: ExpectedSource;
  source: string;
  placeholder: true;
  notice: string;
  detail: string;
};

export type EvaluationGapSummary = {
  rule_id: string;
  rule_name: string;
  required_code: string;
  status: EvaluationStatus;
  gaps: GapItem[];
  unverified: UnverifiedItem[];
  source: string;
  r_score: null;
  r_absence_reason: string;
};

export type GapsResult = {
  status: EvaluationStatus;
  gaps: GapItem[];
  unverified_items: UnverifiedItem[];
  evaluations: EvaluationGapSummary[];
  regional_rules_coverage: CropRuleCoverage[];
  regional_rules_notice: string;
  r_score: null;
  r_absence_reason: string;
  eligibility_evaluated: false;
  recommendation_ready: false;
  simulated_requirements: true;
  requirements_source: string;
};

export const STATUS_LABELS: Record<EvaluationStatus, string> = {
  inconclusive: "Inconclusiva",
  no_gaps_identified: "Sem lacunas identificadas",
};

export const ITEM_BADGE_LABELS = {
  missing: "Ausente",
  unverified: "Não verificado",
  no_coverage: "Sem cobertura (PLACEHOLDER)",
} as const;

export const SOURCE_LABELS: Record<ExpectedSource, string> = {
  farmer_input: "Informado pelo agricultor",
  nasa_earth_observation: "Observação da Terra da NASA",
  regional_agricultural_rule: "Regra agrícola regional",
};

type GapsViewProps = {
  result: GapsResult;
};

export default function GapsView({ result }: GapsViewProps) {
  return (
    <section className="summary-card" aria-live="polite">
      <h2>Diagnóstico de lacunas da área de cultivo</h2>

      <p className="summary-value">
        Estado geral: {STATUS_LABELS[result.status]}
      </p>
      <p>
        <strong>R: não calculado nesta etapa</strong>
      </p>

      <p className="notice">
        &ldquo;Sem lacunas identificadas&rdquo; indica apenas que os campos
        básicos verificados estão presentes para as alternativas para explorar;
        não significa que a opção seja elegível, adequada ao plantio ou isenta
        de restrições. Exigências marcadas como {result.requirements_source} são
        simuladas para demonstração.
      </p>

      {result.gaps.length > 0 ? (
        <>
          <h3>Dados ausentes ({result.gaps.length})</h3>
          <ul className="coverage-list">
            {result.gaps.map((gap) => (
              <li key={gap.code}>
                <span className="coverage-status coverage-missing">
                  {ITEM_BADGE_LABELS.missing}
                </span>
                <strong>{gap.missing_data}</strong>
                <small>
                  Código: {gap.code} · Regra dependente: {gap.dependent_rule} (
                  {gap.source}) · Origem esperada:{" "}
                  {SOURCE_LABELS[gap.expected_source]}
                </small>
                <p>{gap.reason}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Nenhum dado obrigatório marcado como ausente nesta verificação.</p>
      )}

      {result.unverified_items.length > 0 && (
        <>
          <h3>Itens não verificados ({result.unverified_items.length})</h3>
          <p className="field-hint">
            Itens não verificados não afirmam que o dado existe nem que está
            ausente.{" "}
            <Link href="/cobertura">Consulte a cobertura em /cobertura</Link>.
          </p>
          <ul className="coverage-list">
            {result.unverified_items.map((item) => (
              <li key={item.code}>
                <span className="coverage-status coverage-unverified">
                  {ITEM_BADGE_LABELS.unverified}
                </span>
                <strong>{item.label}</strong>
                <small>
                  Código: {item.code} · Regra dependente: {item.dependent_rule}{" "}
                  · Origem esperada: {SOURCE_LABELS[item.expected_source]}
                </small>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Regras agrícolas regionais (PLACEHOLDER)</h3>
      <p className="notice">{result.regional_rules_notice}</p>
      {result.regional_rules_coverage.length > 0 ? (
        <ul className="coverage-list">
          {result.regional_rules_coverage.map((item) => (
            <li key={item.crop}>
              <span className="coverage-status coverage-unverified">
                {ITEM_BADGE_LABELS.no_coverage}
              </span>
              <strong>Cultura: {item.crop}</strong>
              <small>
                Origem esperada: {SOURCE_LABELS[item.expected_source]} · Fonte:{" "}
                {item.source}
              </small>
              <p>{item.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="field-hint">
          Registre uma proposta em <Link href="/rotacao">/rotacao</Link> para
          listar o estado de cobertura regional de cada cultura proposta.
        </p>
      )}

      <h3>Avaliações consideradas</h3>
      <ul className="coverage-list">
        {result.evaluations.map((evaluation) => (
          <li key={evaluation.rule_id}>
            <span
              className={`coverage-status ${
                evaluation.status === "inconclusive"
                  ? "coverage-missing"
                  : "coverage-available"
              }`}
            >
              {STATUS_LABELS[evaluation.status]}
            </span>
            <strong>{evaluation.rule_name}</strong>
            <small>
              Campo exigido: {evaluation.required_code} · Fonte:{" "}
              {evaluation.source} · R: não calculado nesta etapa
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
