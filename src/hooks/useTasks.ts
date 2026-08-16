"use client";

import { useEffect, useState } from "react";
import { subscribeTasks } from "@/lib/tasks";
import type { Task } from "@/lib/types";

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

// Se suscribe en tiempo real a la colección "tasks" de Firestore.
export function useTasks(): UseTasksResult {
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

  return { tasks, loading, error };
}
