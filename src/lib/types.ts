export type Disciplina =
  | "ELECTRICO"
  | "HVAC"
  | "RCI"
  | "HIDROSANITARIO"
  | "GAS"
  | "RED_FRIO"
  | "ILUMINACION"
  | "CIVIL"
  | "SEGURIDAD"
  | "TRANSVERSAL";

export type Estado = "POR_HACER" | "EN_PROCESO" | "CERRADA";

export type Tipo =
  | "TAREA"
  | "EVENTO"
  | "SOLICITUD"
  | "COMITE"
  | "CORTE_PROGRAMACION"
  | "HITO_CRONOGRAMA"
  | "ENTREGABLE";

// Tipos de calendario/cronograma: son recordatorios (comités, cortes, hitos,
// entregables, eventos) y se muestran SOLO en el Calendario, nunca en el
// tablero Kanban. El Kanban es para tareas de ejecución por disciplina
// (TAREA/SOLICITUD) — cronograma y tareas quedan intencionalmente separados.
export const TIPOS_SOLO_CALENDARIO: Tipo[] = [
  "EVENTO",
  "COMITE",
  "CORTE_PROGRAMACION",
  "HITO_CRONOGRAMA",
  "ENTREGABLE",
];

// Recurrencia informativa: solo marca visualmente que la tarea/evento hace
// parte de una serie que se repite. No genera automáticamente las próximas
// ocurrencias (eso queda para una fase futura).
export type Recurrencia = "SEMANAL" | "QUINCENAL";

export const RECURRENCIAS: Recurrencia[] = ["SEMANAL", "QUINCENAL"];

export const DISCIPLINAS: Disciplina[] = [
  "ELECTRICO",
  "HVAC",
  "RCI",
  "HIDROSANITARIO",
  "GAS",
  "RED_FRIO",
  "ILUMINACION",
  "CIVIL",
  "SEGURIDAD",
  "TRANSVERSAL",
];

export const ESTADOS: Estado[] = ["POR_HACER", "EN_PROCESO", "CERRADA"];

// Estados que se consideran "terminados" para efectos de vencimiento
// (una tarea con fecha pasada en uno de estos estados ya no se marca como vencida).
export const ESTADOS_FINALES: Estado[] = ["CERRADA"];

export const TIPOS: Tipo[] = [
  "TAREA",
  "EVENTO",
  "SOLICITUD",
  "COMITE",
  "CORTE_PROGRAMACION",
  "HITO_CRONOGRAMA",
  "ENTREGABLE",
];

// Forma de la tarea en el cliente (Timestamps ya convertidos a Date).
export interface Task {
  id: string;
  titulo: string;
  descripcion?: string;
  disciplina: Disciplina;
  responsable?: string;
  estado: Estado;
  tipo: Tipo;
  fecha?: Date | null;
  horaInicio?: string | null; // "HH:mm", opcional (comités, cortes)
  horaFin?: string | null;
  esStopper: boolean;
  recurrencia?: Recurrencia | null;
  notas?: string;
  // Solo aplica a tipo ENTREGABLE: control de cumplimiento de envío.
  enviado?: boolean;
  // Comparte este id con las demás tareas creadas en la misma serie
  // recurrente (ver TaskFormModal). null/ausente = tarea suelta, sin serie.
  serieId?: string | null;
  // Orden manual dentro de su columna (menor = más prioritaria/arriba). Se
  // asigna al crear (Date.now()) y se recalcula al arrastrar en el tablero;
  // si falta (datos viejos), se usa createdAt como respaldo al ordenar.
  orden?: number;
  // Puntos que suma al marcarse "Cerrada" (por defecto 50 por tarea).
  puntaje?: number;
  // Fecha en la que quedó "Cerrada" por última vez; se limpia si se reabre.
  // Es lo que decide a qué semana se le abona el puntaje.
  cerradaEn?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Datos que el formulario produce antes de escribir en Firestore.
export interface TaskInput {
  titulo: string;
  descripcion?: string;
  disciplina: Disciplina;
  responsable?: string;
  estado: Estado;
  tipo: Tipo;
  fecha?: Date | null;
  horaInicio?: string | null;
  horaFin?: string | null;
  esStopper: boolean;
  recurrencia?: Recurrencia | null;
  notas?: string;
  enviado?: boolean;
  serieId?: string | null;
}
