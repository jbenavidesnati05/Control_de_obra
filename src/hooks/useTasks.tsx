"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeTasks } from "@/lib/tasks";
import { useAuth } from "./useAuth";
import type { Task } from "@/lib/types";

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const TasksContext = createContext<TasksContextValue | null>(null);

// Suscripción a Firestore montada en el layout raíz, dentro de <AuthGate> (o
// sea, solo con sesión activa). Se re-suscribe si cambia el usuario (logout
// + login con otra cuenta), para no arrastrar datos de la sesión anterior.
export function TasksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeTasks(
      user.uid,
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
  }, [user]);

  return <TasksContext.Provider value={{ tasks, loading, error }}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks debe usarse dentro de <TasksProvider>");
  }
  return ctx;
}
