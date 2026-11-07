import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { ESTADOS_FINALES, type Estado, type Task, type TaskInput } from "./types";

export const PUNTAJE_POR_TAREA = 50;

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

function fromFirestore(snap: QueryDocumentSnapshot<DocumentData>): Task {
  const data = snap.data();
  return {
    id: snap.id,
    titulo: data.titulo,
    notas: data.notas ?? "",
    estado: data.estado,
    prioridad: data.prioridad ?? "MEDIA",
    fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : null,
    orden: typeof data.orden === "number" ? data.orden : undefined,
    puntaje: typeof data.puntaje === "number" ? data.puntaje : PUNTAJE_POR_TAREA,
    completadaEn: data.completadaEn instanceof Timestamp ? data.completadaEn.toDate() : null,
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
    completadaEn: ESTADOS_FINALES.includes(input.estado) ? serverTimestamp() : null,
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
    // completadaEn decide a qué semana se abona el puntaje; se limpia si se
    // reabre para que no quede "pegada" a una semana vieja.
    ...(estado !== undefined
      ? { estado, completadaEn: ESTADOS_FINALES.includes(estado) ? serverTimestamp() : null }
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
    ...(estado
      ? { estado, completadaEn: ESTADOS_FINALES.includes(estado) ? serverTimestamp() : null }
      : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(id: string) {
  const ref = taskDoc(requireUid(), id);
  await deleteDoc(ref);
}
