import { startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";
import { PUNTAJE_POR_TAREA } from "./tasks";
import type { Task } from "./types";

const WEEK_STARTS_ON = 1; // lunes, igual que el resto del calendario

export interface SemanaPuntaje {
  inicio: Date;
  fin: Date;
  puntos: number;
  tareas: number;
}

function tareasCerradas(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.estado === "CERRADA" && t.cerradaEn);
}

function puntosDe(task: Task): number {
  return task.puntaje ?? PUNTAJE_POR_TAREA;
}

// Últimas `semanas` semanas (incluida la actual), en orden cronológico, con
// el total de puntos de tareas cerradas cuya `cerradaEn` cae en cada una.
export function historialSemanal(tasks: Task[], semanas = 6, hoy = new Date()): SemanaPuntaje[] {
  const cerradas = tareasCerradas(tasks);
  const resultado: SemanaPuntaje[] = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const inicio = startOfWeek(subWeeks(hoy, i), { weekStartsOn: WEEK_STARTS_ON });
    const fin = endOfWeek(inicio, { weekStartsOn: WEEK_STARTS_ON });
    const deLaSemana = cerradas.filter((t) => isWithinInterval(t.cerradaEn as Date, { start: inicio, end: fin }));
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
