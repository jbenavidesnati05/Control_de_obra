"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Plus, Repeat, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import DisciplinaChip from "@/components/tasks/DisciplinaChip";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteTask } from "@/lib/tasks";
import { isPast } from "@/lib/utils";
import { RECURRENCIA_LABEL_CORTO } from "@/lib/recurrencia";
import { ESTADOS_FINALES, type Task } from "@/lib/types";

interface Props {
  date: Date;
  tasks: Task[];
  onClose: () => void;
  onAdd: () => void;
  onSelectTask: (task: Task) => void;
}

export default function DayPanel({ date, tasks, onClose, onAdd, onSelectTask }: Props) {
  const sorted = [...tasks].sort((a, b) => a.titulo.localeCompare(b.titulo));
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  async function handleDelete() {
    if (!deletingTask) return;
    const task = deletingTask;
    setDeletingTask(null);
    try {
      await deleteTask(task.id);
      toast.success("Tarea eliminada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la tarea.");
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-l border-slate-200 bg-white sm:w-80">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {format(date, "EEEE", { locale: es })}
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {format(date, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cerrar panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={onAdd}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>

        {sorted.length === 0 && (
          <p className="mt-6 text-center text-sm text-slate-400">Sin tareas ni eventos este día.</p>
        )}

        <ul className="space-y-2">
          {sorted.map((task) => {
            const vencida = task.fecha && !ESTADOS_FINALES.includes(task.estado) && isPast(task.fecha);
            return (
              <li key={task.id} className="group relative">
                <button
                  onClick={() => onSelectTask(task)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 pr-9 text-left shadow-sm transition-shadow hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <DisciplinaChip disciplina={task.disciplina} size="xs" />
                    {task.esStopper && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        STOPPER
                      </span>
                    )}
                    {vencida && (
                      <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        VENCIDA
                      </span>
                    )}
                    {task.recurrencia && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                        <Repeat className="h-2.5 w-2.5" />
                        {RECURRENCIA_LABEL_CORTO[task.recurrencia]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900">{task.titulo}</p>
                  {task.responsable && (
                    <p className="mt-0.5 text-xs text-slate-500">{task.responsable}</p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingTask(task)}
                  aria-label="Eliminar tarea"
                  className="absolute right-2 top-2 rounded-md p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {deletingTask && (
        <ConfirmDialog
          title="Eliminar tarea"
          message={`¿Eliminar "${deletingTask.titulo}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </aside>
  );
}
