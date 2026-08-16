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

export type Estado = "POR_HACER" | "EN_ANALISIS" | "EN_GESTION" | "HECHA" | "CERRADA";

export type Tipo = "TAREA" | "EVENTO" | "SOLICITUD";

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

export const ESTADOS: Estado[] = ["POR_HACER", "EN_ANALISIS", "EN_GESTION", "HECHA", "CERRADA"];

// Estados que se consideran "terminados" para efectos de vencimiento
// (una tarea con fecha pasada en uno de estos estados ya no se marca como vencida).
export const ESTADOS_FINALES: Estado[] = ["HECHA", "CERRADA"];

export const TIPOS: Tipo[] = ["TAREA", "EVENTO", "SOLICITUD"];

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
  esStopper: boolean;
  recurrencia?: Recurrencia | null;
  notas?: string;
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
  esStopper: boolean;
  recurrencia?: Recurrencia | null;
  notas?: string;
}
