import type { Recurrencia } from "./types";

export const RECURRENCIA_LABEL: Record<Recurrencia, string> = {
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
};

export const RECURRENCIA_LABEL_CORTO: Record<Recurrencia, string> = {
  SEMANAL: "Sem.",
  QUINCENAL: "Quinc.",
};
