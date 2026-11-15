export type Scenario = {
  id: string;
  name: string;
  approximate_region: string;
  soil: {
    status: "known" | "unknown";
    description?: string | null;
    classification?: string | null;
    source?: "farmer" | "external" | null;
    source_reference?: string | null;
  };
  water_regime: "rainfed" | "irrigated";
  history: { periods: Array<{ crop: string; start_month: string; end_month: string }> } | null;
  possible_crops: string[];
  priority: string | null;
  simulated: true;
};

export function isScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Scenario>;
  return item.simulated === true && typeof item.id === "string" &&
    typeof item.name === "string" && typeof item.approximate_region === "string" &&
    !!item.soil && (item.soil.status === "known" || item.soil.status === "unknown") &&
    (item.water_regime === "rainfed" || item.water_regime === "irrigated");
}
