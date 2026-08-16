"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createTask, updateTask, deleteTask } from "@/lib/tasks";
import { DISCIPLINA_INFO } from "@/lib/disciplinas";
import { RECURRENCIA_LABEL } from "@/lib/recurrencia";
import {
  DISCIPLINAS,
  ESTADOS,
  RECURRENCIAS,
  TIPOS,
  type Recurrencia,
  type Task,
  type TaskInput,
} from "@/lib/types";
import { toDateInputValue, fromDateInputValue } from "@/lib/utils";

const ESTADO_LABEL: Record<string, string> = {
  POR_HACER: "Por hacer",
  EN_ANALISIS: "En análisis",
  EN_GESTION: "En gestión",
  HECHA: "Hecha",
  CERRADA: "Cerrada",
};

const TIPO_LABEL: Record<string, string> = {
  TAREA: "Tarea",
  EVENTO: "Evento",
  SOLICITUD: "Solicitud",
};

interface Props {
  onClose: () => void;
  task?: Task | null; // si viene, es edición
  defaultFecha?: Date | null; // fecha preseleccionada al crear desde el calendario
  defaultEstado?: Task["estado"]; // estado preseleccionado al crear desde el kanban
}

export default function TaskFormModal({ onClose, task, defaultFecha, defaultEstado }: Props) {
  const isEdit = !!task;
  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(task?.descripcion ?? "");
  const [disciplina, setDisciplina] = useState(task?.disciplina ?? "ELECTRICO");
  const [responsable, setResponsable] = useState(task?.responsable ?? "");
  const [estado, setEstado] = useState(task?.estado ?? defaultEstado ?? "POR_HACER");
  const [tipo, setTipo] = useState(task?.tipo ?? "TAREA");
  const [fecha, setFecha] = useState(toDateInputValue(task?.fecha ?? defaultFecha ?? null));
  const [esStopper, setEsStopper] = useState(task?.esStopper ?? false);
  const [recurrencia, setRecurrencia] = useState<"" | Recurrencia>(task?.recurrencia ?? "");
  const [notas, setNotas] = useState(task?.notas ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        descripcion: descripcion.trim(),
        disciplina,
        responsable: responsable.trim(),
        estado,
        tipo,
        fecha: fromDateInputValue(fecha),
        esStopper,
        recurrencia: recurrencia || null,
        notas: notas.trim(),
      };
      if (isEdit && task) {
        await updateTask(task.id, input);
      } else {
        await createTask(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la tarea.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm(`¿Eliminar "${task.titulo}"? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      await deleteTask(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la tarea.");
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? "Editar tarea" : "Nueva tarea"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Título *</label>
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Solicitar planos eléctricos actualizados"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Breve descripción (opcional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Disciplina</label>
            <select
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value as Task["disciplina"])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DISCIPLINAS.map((d) => (
                <option key={d} value={d}>
                  {DISCIPLINA_INFO[d].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Task["tipo"])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Responsable</label>
            <input
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Ej: Contratista, INP..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as Task["estado"])}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Se repite</label>
            <select
              value={recurrencia}
              onChange={(e) => setRecurrencia(e.target.value as "" | Recurrencia)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No se repite</option>
              {RECURRENCIAS.map((r) => (
                <option key={r} value={r}>
                  {RECURRENCIA_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={esStopper}
            onChange={(e) => setEsStopper(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
          Es <span className="font-semibold text-red-600">stopper</span>
        </label>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Detalles adicionales, próximos pasos..."
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
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
    </Modal>
  );
}
