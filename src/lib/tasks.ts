import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Estado, Task, TaskInput } from "./types";

const TASKS_COLLECTION = "tasks";

function fromFirestore(snap: QueryDocumentSnapshot<DocumentData>): Task {
  const data = snap.data();
  return {
    id: snap.id,
    titulo: data.titulo,
    descripcion: data.descripcion ?? "",
    disciplina: data.disciplina,
    responsable: data.responsable ?? "",
    estado: data.estado,
    tipo: data.tipo,
    fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : null,
    esStopper: !!data.esStopper,
    recurrencia: data.recurrencia ?? null,
    notas: data.notas ?? "",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
  };
}

// Suscripción en tiempo real a todas las tareas. Devuelve la función de unsubscribe.
export function subscribeTasks(onChange: (tasks: Task[]) => void, onError?: (err: Error) => void) {
  const ref = collection(db, TASKS_COLLECTION);
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
  const ref = collection(db, TASKS_COLLECTION);
  await addDoc(ref, {
    ...input,
    fecha: input.fecha ? Timestamp.fromDate(input.fecha) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const ref = doc(db, TASKS_COLLECTION, id);
  const { fecha, ...rest } = input;
  await updateDoc(ref, {
    ...rest,
    ...(fecha !== undefined ? { fecha: fecha ? Timestamp.fromDate(fecha) : null } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function moveTask(id: string, estado: Estado) {
  const ref = doc(db, TASKS_COLLECTION, id);
  await updateDoc(ref, { estado, updatedAt: serverTimestamp() });
}

export async function deleteTask(id: string) {
  const ref = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(ref);
}
