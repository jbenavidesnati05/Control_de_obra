import { isSameDay } from "./utils";

// Festivos colombianos restantes de 2026 (a partir de agosto), con la fecha
// ya ajustada por la Ley Emiliani (traslado al lunes siguiente) donde aplica.
export const FESTIVOS_2026: { fecha: Date; nombre: string }[] = [
  { fecha: new Date(2026, 9, 12), nombre: "Día de la Raza" },
  { fecha: new Date(2026, 10, 2), nombre: "Todos los Santos" },
  { fecha: new Date(2026, 10, 16), nombre: "Independencia de Cartagena" },
  { fecha: new Date(2026, 11, 8), nombre: "Inmaculada Concepción" },
  { fecha: new Date(2026, 11, 25), nombre: "Navidad" },
];

export function festivoEn(day: Date): string | null {
  const f = FESTIVOS_2026.find((f) => isSameDay(f.fecha, day));
  return f ? f.nombre : null;
}

export function esFinDeSemana(day: Date): boolean {
  const d = day.getDay();
  return d === 0 || d === 6;
}
