"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Task } from "@/lib/types";

interface Props {
  task: Task;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteTaskDialog({ task, onConfirm, onCancel }: Props) {
  return (
    <ConfirmDialog
      title="Eliminar proceso"
      message={`¿Eliminar "${task.titulo}"? Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar"
      danger
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
