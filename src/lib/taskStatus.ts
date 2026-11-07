import { daysUntil, isPast } from "./utils";
import { ESTADOS_FINALES, type Task } from "./types";

export function isCompletada(task: Task): boolean {
  return ESTADOS_FINALES.includes(task.estado);
}

export function isVencida(task: Task): boolean {
  if (!task.fecha || isCompletada(task)) return false;
  return isPast(task.fecha);
}

const DIAS_ESTANCAMIENTO_MAX = 7;

// Días desde que se creó la tarea sin llegar a un estado final. Se congela
// (vuelve a 0, sin color) apenas queda Cerrada — ya no hace falta la alerta
// visual porque se resolvió.
export function diasSinGestion(task: Task): number {
  if (!task.createdAt || isCompletada(task)) return 0;
  return Math.max(0, -daysUntil(task.createdAt));
}

export interface ColorEstancamiento {
  bg: string;
  text: string;
  ring: string;
}

// Degradado amarillo -> naranja -> rojo a medida que pasan los días sin
// gestión (tope en 7 días = rojo pleno), para notar de un vistazo qué
// procesos llevan mucho tiempo estancados.
export function colorEstancamiento(task: Task): ColorEstancamiento | null {
  const dias = diasSinGestion(task);
  if (dias < 1) return null;
  const t = Math.min(dias / DIAS_ESTANCAMIENTO_MAX, 1);
  const hue = 48 - t * 48; // 48° amarillo -> 0° rojo
  return {
    bg: `hsl(${hue} 90% 94%)`,
    text: `hsl(${hue} 75% 32%)`,
    ring: `hsl(${hue} 85% 55%)`,
  };
}
