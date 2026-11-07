"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import DeleteTaskDialog from "./DeleteTaskDialog";
import { createTask, updateTask, deleteTask } from "@/lib/tasks";
import { ESTADO_LABEL, PRIORIDAD_LABEL } from "@/lib/automatizacion";
import { ESTADOS, PRIORIDADES, type Task, type TaskInput } from "@/lib/types";
import { toDateInputValue, fromDateInputValue } from "@/lib/utils";

interface Props {
  onClose: () => void;
  task?: Task | null; // si viene, es edición
}

export default function TaskFormModal({ onClose, task }: Props) {
  const isEdit = !!task;
  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [notas, setNotas] = useState(task?.notas ?? "");
  const [estado, setEstado] = useState(task?.estado ?? "BACKLOG");
  const [prioridad, setPrioridad] = useState(task?.prioridad ?? "MEDIA");
  const [fecha, setFecha] = useState(toDateInputValue(task?.fecha ?? null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: TaskInput = {
        titulo: titulo.trim(),
        notas: notas.trim(),
        estado,
        prioridad,
        fecha: fromDateInputValue(fecha),
      };
      if (isEdit && task) {
        await updateTask(task.id, input);
        toast.success("Tarea actualizada.");
      } else {
        await createTask(input);
        toast.success("Tarea creada.");
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la tarea.";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setConfirmingDelete(false);
    setSaving(true);
    try {
      await deleteTask(task.id);
      toast.success("Tarea eliminada.");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar la tarea.";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelClass = "mb-1 block text-xs font-medium text-slate-600";

  return (
    <Modal title={isEdit ? "Editar tarea" : "Nueva tarea"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Título *</label>
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Enviar correo de seguimiento a Karen"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Prioridad</label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Task["prioridad"])}
              className={inputClass}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {PRIORIDAD_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {isEdit && (
          <div>
            <label className={labelClass}>Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as Task["estado"])}
              className={inputClass}
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Detalles adicionales..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {isEdit ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isEdit ? "Guardar cambios" : "Crear tarea"}
            </button>
          </div>
        </div>
      </form>

      {confirmingDelete && task && (
        <DeleteTaskDialog task={task} onConfirm={handleDelete} onCancel={() => setConfirmingDelete(false)} />
      )}
    </Modal>
  );
}
