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
