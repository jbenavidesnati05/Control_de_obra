export type Estado = "BACKLOG" | "ANALISIS" | "EN_PROCESO" | "CERRADA";

export const ESTADOS: Estado[] = ["BACKLOG", "ANALISIS", "EN_PROCESO", "CERRADA"];

// Estados que se consideran "resueltos": ya no se marcan como estancados.
export const ESTADOS_FINALES: Estado[] = ["CERRADA"];

export type Prioridad = "ALTA" | "MEDIA" | "BAJA";
export const PRIORIDADES: Prioridad[] = ["ALTA", "MEDIA", "BAJA"];

// Tarea simple del día a día (enviar un correo, pedir algo, agendar una
// reunión...). El seguimiento de proyectos de automatización como tal vive
// en Azure DevOps, no aquí.
export interface Task {
  id: string;
  titulo: string;
  notas?: string;
  estado: Estado;
  prioridad: Prioridad;
  fecha?: Date | null;
  // Orden manual dentro de su columna (menor = más prioritaria/arriba). Se
  // asigna al crear (Date.now()) y se recalcula al arrastrar en el tablero;
  // si falta (datos viejos), se usa createdAt como respaldo al ordenar.
  orden?: number;
  // Puntos que suma al marcarse "Cerrada" (por defecto 50 por tarea).
  puntaje?: number;
  // Fecha en la que quedó "Cerrada" por última vez; se limpia si se reabre.
  // Es lo que decide a qué semana se le abona el puntaje.
  completadaEn?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Datos que el formulario produce antes de escribir en Firestore.
export interface TaskInput {
  titulo: string;
  notas?: string;
  estado: Estado;
  prioridad: Prioridad;
  fecha?: Date | null;
}
