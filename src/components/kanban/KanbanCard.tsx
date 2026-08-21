"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, CalendarDays, Repeat, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import DisciplinaChip from "@/components/tasks/DisciplinaChip";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { disciplinaInfo } from "@/lib/disciplinas";
import { deleteTask } from "@/lib/tasks";
import { isPast, cn } from "@/lib/utils";
import { RECURRENCIA_LABEL_CORTO } from "@/lib/recurrencia";
import { ESTADOS_FINALES, type Task } from "@/lib/types";

interface Props {
  task: Task;
  onClick: () => void;
}

export default function KanbanCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const info = disciplinaInfo(task.disciplina);
  const vencida = task.fecha && !ESTADOS_FINALES.includes(task.estado) && isPast(task.fecha);

  const style = {
    transform: CSS.Translate.toString(transform),
    borderLeftColor: info.color,
  };

  async function handleDelete() {
    setConfirmingDelete(false);
    try {
      await deleteTask(task.id);
      toast.success("Tarea eliminada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la tarea.");
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "group relative cursor-grab rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setConfirmingDelete(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Eliminar tarea"
        className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="mb-1.5 flex flex-wrap items-center gap-1 pr-5">
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

      <p className="text-sm font-medium leading-snug text-slate-900">{task.titulo}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {task.responsable && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.responsable}
          </span>
        )}
        {task.fecha && (
          <span className={cn("inline-flex items-center gap-1", vencida && "font-medium text-red-600")}>
            <CalendarDays className="h-3 w-3" />
            {format(task.fecha, "d MMM", { locale: es })}
          </span>
        )}
      </div>

      {confirmingDelete && (
        <div onClick={(e) => e.stopPropagation()}>
          <ConfirmDialog
            title="Eliminar tarea"
            message={`¿Eliminar "${task.titulo}"? Esta acción no se puede deshacer.`}
            confirmLabel="Eliminar"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirmingDelete(false)}
          />
        </div>
      )}
    </div>
  );
}
