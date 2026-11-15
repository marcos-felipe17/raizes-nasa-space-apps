import { texts } from "../i18n/pt-BR";

const DEFAULT_API_URL = "http://localhost:8000";

export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return DEFAULT_API_URL;
}

export function formatField(value) {
  if (value === null || value === undefined) {
    return texts.notInformed;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : texts.notInformed;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value : texts.notInformed;
  }
  return String(value);
}

export function formatWaterRegime(value) {
  const formatted = formatField(value);
  if (formatted === texts.notInformed) {
    return texts.notInformed;
  }
  return texts.waterRegimeValues[formatted] || formatted;
}

export async function fetchScenarios() {
  const response = await fetch(`${getApiBaseUrl()}/api/scenarios`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter((item) => item && item.simulado === true);
}

export async function fetchScenarioById(id) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/scenarios/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
    }
  );
  if (response.status === 404) {
    return { notFound: true, scenario: null };
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!data || data.simulado !== true) {
    return { notFound: true, scenario: null };
  }
  return { notFound: false, scenario: data };
}
