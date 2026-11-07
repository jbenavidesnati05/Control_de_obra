import type { TaskInput } from "./types";

function diasDesdeHoy(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// 5 tareas de ejemplo del día a día (rol de automatización en Grupo EMI
// Falck), repartidas en las 4 columnas, para ver el tablero funcionando
// desde el día 1. Se cargan con el botón "Cargar ejemplos" (solo visible
// con el tablero vacío) y usan createTask() normal, autenticado como el usuario.
export const TAREAS_EJEMPLO: TaskInput[] = [
  {
    titulo: "Agendar reunión de levantamiento con Facturación",
    notas: "Coordinar con el área para el nuevo proceso de auditoría IA.",
    estado: "BACKLOG",
    prioridad: "ALTA",
    fecha: diasDesdeHoy(2),
  },
  {
    titulo: "Solicitar accesos a Azure DevOps para Karen",
    notas: "Pedir a TI que agregue a Karen al repo del proyecto nuevo.",
    estado: "BACKLOG",
    prioridad: "MEDIA",
    fecha: diasDesdeHoy(1),
  },
  {
    titulo: "Revisar y comentar el PDD de Conciliación de pagos",
    estado: "ANALISIS",
    prioridad: "MEDIA",
    fecha: diasDesdeHoy(3),
  },
  {
    titulo: "Enviar correo de seguimiento de UAT a Auditor IA",
    notas: "Confirmar con los 3 usuarios si ya probaron la última versión.",
    estado: "EN_PROCESO",
    prioridad: "ALTA",
    fecha: diasDesdeHoy(0),
  },
  {
    titulo: "Pedir feedback de Emma 2.0 al área de experiencia del paciente",
    notas: "Reunión mensual de seguimiento, ya se envió.",
    estado: "CERRADA",
    prioridad: "BAJA",
    fecha: diasDesdeHoy(-3),
  },
];
