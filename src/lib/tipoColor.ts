import type { Tipo } from "./types";

interface TipoColor {
  color: string;
  bg: string;
  text: string;
}

// Color fijo por tipo de evento administrativo/de cronograma general, para
// distinguirlos de un vistazo en el calendario (independiente de la
// disciplina). TAREA/EVENTO/SOLICITUD/HITO_CRONOGRAMA no tienen entrada aquí:
// para esos se sigue usando el color de la disciplina (ver disciplinaInfo).
export const TIPO_COLOR: Partial<Record<Tipo, TipoColor>> = {
  COMITE: { color: "#2563eb", bg: "#dbeafe", text: "#1e3a8a" },
  CORTE_PROGRAMACION: { color: "#ea580c", bg: "#ffedd5", text: "#9a3412" },
  ENTREGABLE: { color: "#16a34a", bg: "#dcfce7", text: "#14532d" },
};

export function tipoColor(tipo: Tipo): TipoColor | null {
  return TIPO_COLOR[tipo] ?? null;
}
