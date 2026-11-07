import type { Estado, Prioridad } from "./types";

export const ESTADO_LABEL: Record<Estado, string> = {
  BACKLOG: "Backlog",
  ANALISIS: "Análisis",
  EN_PROCESO: "En proceso",
  CERRADA: "Cerrada",
};

export const ESTADO_ACCENT: Record<Estado, string> = {
  BACKLOG: "#94a3b8",
  ANALISIS: "#8b5cf6",
  EN_PROCESO: "#2563eb",
  CERRADA: "#16a34a",
};

export const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const PRIORIDAD_COLOR: Record<Prioridad, { bg: string; text: string }> = {
  ALTA: { bg: "#fee2e2", text: "#991b1b" },
  MEDIA: { bg: "#fef3c7", text: "#92400e" },
  BAJA: { bg: "#e2e8f0", text: "#334155" },
};
