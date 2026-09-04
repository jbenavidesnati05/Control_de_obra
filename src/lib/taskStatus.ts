import { daysUntil, isPast } from "./utils";
import { ESTADOS_FINALES, type Task } from "./types";

// Para ENTREGABLE el "hecho" es el checkbox de envío, no el flujo de estados
// del Kanban (que esos tipos ni siquiera usan).
export function isCompletada(task: Task): boolean {
  if (task.tipo === "ENTREGABLE") return !!task.enviado;
  return ESTADOS_FINALES.includes(task.estado);
}

export function isVencida(task: Task): boolean {
  if (!task.fecha || isCompletada(task)) return false;
  return isPast(task.fecha);
}

// "Próximo": faltan 0-2 días para un comité, corte o entregable que aún no
// se ha marcado como hecho/enviado. No aplica a hitos de cronograma (son
// informativos, no requieren acción de envío/asistencia con antelación).
export function isProximo(task: Task): boolean {
  if (!task.fecha || isCompletada(task) || isVencida(task)) return false;
  if (task.tipo !== "COMITE" && task.tipo !== "CORTE_PROGRAMACION" && task.tipo !== "ENTREGABLE") {
    return false;
  }
  const dias = daysUntil(task.fecha);
  return dias >= 0 && dias <= 2;
}

const DIAS_ESTANCAMIENTO_MAX = 7;

// Días desde que se creó la tarea sin llegar a un estado final. Se congela
// (vuelve a 0, sin color) apenas queda Hecha/Cerrada — ya no hace falta la
// alerta visual porque el trabajo se resolvió.
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
// tareas llevan mucho tiempo estancadas y podrían necesitar atención o
// eliminarse.
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
