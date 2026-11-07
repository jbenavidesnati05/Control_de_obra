import { startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";
import { PUNTAJE_POR_TAREA } from "./tasks";
import { ESTADOS_FINALES, type Task } from "./types";

const WEEK_STARTS_ON = 1; // lunes

export interface SemanaPuntaje {
  inicio: Date;
  fin: Date;
  puntos: number;
  tareas: number;
}

function procesosCompletados(tasks: Task[]): Task[] {
  return tasks.filter((t) => ESTADOS_FINALES.includes(t.estado) && t.completadaEn);
}

function puntosDe(task: Task): number {
  return task.puntaje ?? PUNTAJE_POR_TAREA;
}

// Últimas `semanas` semanas (incluida la actual), en orden cronológico, con
// el total de puntos de procesos completados cuya `completadaEn` cae en cada una.
export function historialSemanal(tasks: Task[], semanas = 6, hoy = new Date()): SemanaPuntaje[] {
  const completados = procesosCompletados(tasks);
  const resultado: SemanaPuntaje[] = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const inicio = startOfWeek(subWeeks(hoy, i), { weekStartsOn: WEEK_STARTS_ON });
    const fin = endOfWeek(inicio, { weekStartsOn: WEEK_STARTS_ON });
    const deLaSemana = completados.filter((t) =>
      isWithinInterval(t.completadaEn as Date, { start: inicio, end: fin })
    );
    resultado.push({
      inicio,
      fin,
      puntos: deLaSemana.reduce((sum, t) => sum + puntosDe(t), 0),
      tareas: deLaSemana.length,
    });
  }
  return resultado;
}

export function puntajeSemanaActual(tasks: Task[], hoy = new Date()): SemanaPuntaje {
  return historialSemanal(tasks, 1, hoy)[0];
}
