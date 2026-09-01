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
import type { Estado, Task, TaskInput } from "./types";

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
    descripcion: data.descripcion ?? "",
    disciplina: data.disciplina,
    responsable: data.responsable ?? "",
    estado: data.estado,
    tipo: data.tipo,
    fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : null,
    horaInicio: data.horaInicio ?? null,
    horaFin: data.horaFin ?? null,
    esStopper: !!data.esStopper,
    recurrencia: data.recurrencia ?? null,
    notas: data.notas ?? "",
    enviado: !!data.enviado,
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const ref = taskDoc(requireUid(), id);
  const { fecha, ...rest } = input;
  await updateDoc(ref, {
    ...rest,
    ...(fecha !== undefined ? { fecha: fecha ? Timestamp.fromDate(fecha) : null } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function moveTask(id: string, estado: Estado) {
  const ref = taskDoc(requireUid(), id);
  await updateDoc(ref, { estado, updatedAt: serverTimestamp() });
}

export async function setEnviado(id: string, enviado: boolean) {
  const ref = taskDoc(requireUid(), id);
  await updateDoc(ref, { enviado, updatedAt: serverTimestamp() });
}

export async function deleteTask(id: string) {
  const ref = taskDoc(requireUid(), id);
  await deleteDoc(ref);
}
