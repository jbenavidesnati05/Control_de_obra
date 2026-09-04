"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import type { Task } from "@/lib/types";

interface Props {
  task: Task;
  serieCount: number; // cantidad total de tareas en la serie (0/1 = no aplica)
  onDeleteOne: () => void;
  onDeleteSerie: () => void;
  onCancel: () => void;
}

// Si la tarea es parte de una serie recurrente, pregunta el alcance del
// borrado (igual que Outlook/Teams); si no, es el confirm simple de siempre.
export default function DeleteTaskDialog({ task, serieCount, onDeleteOne, onDeleteSerie, onCancel }: Props) {
  if (!task.serieId || serieCount <= 1) {
    return (
      <ConfirmDialog
        title="Eliminar tarea"
        message={`¿Eliminar "${task.titulo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={onDeleteOne}
        onCancel={onCancel}
      />
    );
  }

  return (
    <Modal title="Eliminar tarea" onClose={onCancel} widthClass="max-w-sm">
      <p className="text-sm text-slate-600">
        "{task.titulo}" es parte de una serie recurrente ({serieCount} tareas en total). ¿Qué
        quieres eliminar?
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={onDeleteOne}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Solo esta tarea
        </button>
        <button
          type="button"
          onClick={onDeleteSerie}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-left text-sm font-medium text-white shadow-sm hover:bg-red-700"
        >
          Toda la serie ({serieCount})
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </Modal>
  );
}
