import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
  type CollectionReference,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { Estado, Task, TaskInput } from "./types";

export const PUNTAJE_POR_TAREA = 50;

// Campos que tiene sentido replicar a toda una serie recurrente al editar
// "toda la serie": deliberadamente NO incluye fecha/estado/enviado, que son
// propios de cada ocurrencia (cada comité/entregable avanza por su cuenta).
export type SerieUpdateFields = Pick<
  TaskInput,
  | "titulo"
  | "descripcion"
  | "disciplina"
  | "responsable"
  | "tipo"
  | "horaInicio"
  | "horaFin"
  | "esStopper"
  | "notas"
>;

// Cada usuario tiene su propio espacio aislado: users/{uid}/tasks.
function tasksCollection(uid: string): CollectionReference<DocumentData> {
  return collection(db, "users", uid, "tasks");
}

function taskDoc(uid: string, id: string) {
  return doc(db, "users", uid, "tasks", id);
}

// Las mutaciones (crear/editar/mover/borrar) solo se disparan desde una UI ya
// autenticada (todo vive detrás de <AuthGate>), así que basta leer el usuario
// actual de Auth en vez de pedirle el uid a cada componente que llama esto.
function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Debes iniciar sesión para guardar cambios.");
  return uid;
}

// El tablero pasó de 5 columnas a 3 (Por hacer / En proceso / Cerrada). Las
// tareas viejas guardadas con los estados anteriores se re-mapean solo al
// leer (no se reescribe nada en Firestore); en cuanto alguien las mueva de
// nuevo desde el tablero, quedan guardadas ya con el estado nuevo.
const ESTADO_LEGADO: Record<string, Estado> = {
  EN_ANALISIS: "EN_PROCESO",
  EN_GESTION: "EN_PROCESO",
  HECHA: "CERRADA",
};

function normalizarEstado(raw: string): Estado {
  return (ESTADO_LEGADO[raw] as Estado) ?? (raw as Estado);
}

function fromFirestore(snap: QueryDocumentSnapshot<DocumentData>): Task {
  const data = snap.data();
  return {
    id: snap.id,
    titulo: data.titulo,
    descripcion: data.descripcion ?? "",
    disciplina: data.disciplina,
    responsable: data.responsable ?? "",
    estado: normalizarEstado(data.estado),
    tipo: data.tipo,
    fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : null,
    horaInicio: data.horaInicio ?? null,
    horaFin: data.horaFin ?? null,
    esStopper: !!data.esStopper,
    recurrencia: data.recurrencia ?? null,
    notas: data.notas ?? "",
    enviado: !!data.enviado,
    serieId: data.serieId ?? null,
    orden: typeof data.orden === "number" ? data.orden : undefined,
    puntaje: typeof data.puntaje === "number" ? data.puntaje : PUNTAJE_POR_TAREA,
    cerradaEn: data.cerradaEn instanceof Timestamp ? data.cerradaEn.toDate() : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
  };
}

// Suscripción en tiempo real a las tareas del usuario. Devuelve la función de unsubscribe.
export function subscribeTasks(
  uid: string,
  onChange: (tasks: Task[]) => void,
  onError?: (err: Error) => void
) {
  const ref = tasksCollection(uid);
  return onSnapshot(
    ref,
    (snapshot) => {
      const tasks = snapshot.docs.map(fromFirestore);
      onChange(tasks);
    },
    (err) => onError?.(err)
  );
}

export async function createTask(input: TaskInput) {
  const ref = tasksCollection(requireUid());
  await addDoc(ref, {
    ...input,
    fecha: input.fecha ? Timestamp.fromDate(input.fecha) : null,
    // Al crear, siempre queda de última en su columna (mayor = más abajo);
    // Date.now() como valor produce "apilado por orden de creación" gratis.
    orden: Date.now(),
    puntaje: PUNTAJE_POR_TAREA,
    cerradaEn: input.estado === "CERRADA" ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const ref = taskDoc(requireUid(), id);
  const { fecha, estado, ...rest } = input;
  await updateDoc(ref, {
    ...rest,
    ...(fecha !== undefined ? { fecha: fecha ? Timestamp.fromDate(fecha) : null } : {}),
    // cerradaEn decide a qué semana se abona el puntaje; se limpia si se
    // reabre para que no quede "pegada" a una semana vieja.
    ...(estado !== undefined
      ? { estado, cerradaEn: estado === "CERRADA" ? serverTimestamp() : null }
      : {}),
    updatedAt: serverTimestamp(),
  });
}

// Mueve una tarea a otra columna y/o le asigna una nueva posición manual
// dentro de la columna (arrastrar y soltar en el Kanban).
export async function reorderTask(id: string, orden: number, estado?: Estado) {
  const ref = taskDoc(requireUid(), id);
  await updateDoc(ref, {
    orden,
    ...(estado ? { estado, cerradaEn: estado === "CERRADA" ? serverTimestamp() : null } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function setEnviado(id: string, enviado: boolean) {
  const ref = taskDoc(requireUid(), id);
  await updateDoc(ref, { enviado, updatedAt: serverTimestamp() });
}

export async function deleteTask(id: string) {
  const ref = taskDoc(requireUid(), id);
  await deleteDoc(ref);
}

// Borra todas las tareas de la misma serie recurrente (incluida la que
// disparó la acción).
export async function deleteSerie(serieId: string) {
  const uid = requireUid();
  const q = query(tasksCollection(uid), where("serieId", "==", serieId));
  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
}

// Replica los campos "compartidos" (no la fecha/estado/enviado, que son por
// ocurrencia) a todas las demás tareas de la misma serie recurrente.
export async function updateSerie(serieId: string, changes: SerieUpdateFields, excludeId?: string) {
  const uid = requireUid();
  const q = query(tasksCollection(uid), where("serieId", "==", serieId));
  const snapshot = await getDocs(q);
  await Promise.all(
    snapshot.docs
      .filter((d) => d.id !== excludeId)
      .map((d) => updateDoc(d.ref, { ...changes, updatedAt: serverTimestamp() }))
  );
}
