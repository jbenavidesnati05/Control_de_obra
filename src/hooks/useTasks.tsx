"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeTasks } from "@/lib/tasks";
import type { Task } from "@/lib/types";

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const TasksContext = createContext<TasksContextValue | null>(null);

// Suscripción única a Firestore, montada una sola vez en el layout raíz.
// Al vivir por encima de /calendario y /tareas, moverse entre esas dos
// páginas no destruye ni recrea la conexión en tiempo real: los datos ya
// están en memoria y la navegación es instantánea.
export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeTasks(
      (data) => {
        setTasks(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return <TasksContext.Provider value={{ tasks, loading, error }}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks debe usarse dentro de <TasksProvider>");
  }
  return ctx;
}
