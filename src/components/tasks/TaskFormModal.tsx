"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import DeleteTaskDialog from "./DeleteTaskDialog";
import { createTask, updateTask, updateSerie, deleteTask, deleteSerie } from "@/lib/tasks";
import { useTasks } from "@/hooks/useTasks";
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
  EN_PROCESO: "En proceso",
  CERRADA: "Cerrada",
};

const TIPO_LABEL: Record<string, string> = {
  TAREA: "Tarea",
  EVENTO: "Evento",
  SOLICITUD: "Solicitud",
  COMITE: "Comité",
  CORTE_PROGRAMACION: "Corte de programación",
  HITO_CRONOGRAMA: "Hito de cronograma",
  ENTREGABLE: "Entregable",
};

// Igual que Outlook/Teams al crear un evento recurrente: no hay motor de
// recurrencia real (ver src/lib/types.ts), así que se materializan
// ocurrencias concretas como tareas independientes. Tope de seguridad para
// no generar cientos de documentos por accidente.
const MAX_OCURRENCIAS_SERIE = 52;

function addDiasLocal(date: Date, dias: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + dias);
  return d;
}

function calcularFechasSerie(
  anchor: Date,
  recurrencia: Recurrencia,
  finSerie: "ocurrencias" | "fecha",
  ocurrencias: number,
  hastaFecha: Date | null
): Date[] {
  const paso = recurrencia === "SEMANAL" ? 7 : 14;
  const fechas: Date[] = [];
  if (finSerie === "ocurrencias") {
    const n = Math.min(Math.max(Math.floor(ocurrencias) - 1, 0), MAX_OCURRENCIAS_SERIE);
    for (let i = 1; i <= n; i++) fechas.push(addDiasLocal(anchor, paso * i));
  } else if (hastaFecha) {
    for (let i = 1; i <= MAX_OCURRENCIAS_SERIE; i++) {
      const d = addDiasLocal(anchor, paso * i);
      if (d.getTime() > hastaFecha.getTime()) break;
      fechas.push(d);
    }
  }
  return fechas;
}

interface Props {
  onClose: () => void;
  task?: Task | null; // si viene, es edición
  defaultFecha?: Date | null; // fecha preseleccionada al crear desde el calendario
  defaultEstado?: Task["estado"]; // estado preseleccionado al crear desde el kanban
  defaultTipo?: Task["tipo"]; // tipo preseleccionado (EVENTO al crear desde el calendario)
}

export default function TaskFormModal({
  onClose,
  task,
  defaultFecha,
  defaultEstado,
  defaultTipo,
}: Props) {
  const isEdit = !!task;
  const { tasks: todasLasTareas } = useTasks();
  const serieCount = task?.serieId
    ? todasLasTareas.filter((t) => t.serieId === task.serieId).length
    : 0;
  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(task?.descripcion ?? "");
  const [disciplina, setDisciplina] = useState(task?.disciplina ?? "ELECTRICO");
  const [responsable, setResponsable] = useState(task?.responsable ?? "");
  const [estado, setEstado] = useState(task?.estado ?? defaultEstado ?? "POR_HACER");
  const [tipo, setTipo] = useState(task?.tipo ?? defaultTipo ?? "TAREA");
  const [fecha, setFecha] = useState(toDateInputValue(task?.fecha ?? defaultFecha ?? null));
  const [horaInicio, setHoraInicio] = useState(task?.horaInicio ?? "");
  const [horaFin, setHoraFin] = useState(task?.horaFin ?? "");
  const [esStopper, setEsStopper] = useState(task?.esStopper ?? false);
  const [recurrencia, setRecurrencia] = useState<"" | Recurrencia>(task?.recurrencia ?? "");
  const [notas, setNotas] = useState(task?.notas ?? "");
  const [enviado, setEnviado] = useState(task?.enviado ?? false);
  const [finSerie, setFinSerie] = useState<"ocurrencias" | "fecha">("ocurrencias");
  const [serieOcurrencias, setSerieOcurrencias] = useState(10);
  const [serieHastaFecha, setSerieHastaFecha] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pendingInput, setPendingInput] = useState<TaskInput | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!isEdit && recurrencia && finSerie === "fecha" && !serieHastaFecha) {
      setError('Elige la fecha de fin de la serie, o cambia a "Después de N repeticiones".');
      return;
    }
    const input: TaskInput = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      disciplina,
      responsable: responsable.trim(),
      estado,
      tipo,
      fecha: fromDateInputValue(fecha),
      horaInicio: horaInicio || null,
      horaFin: horaFin || null,
      esStopper,
      recurrencia: recurrencia || null,
      notas: notas.trim(),
      enviado,
    };

    // Si la tarea pertenece a una serie, hay que preguntar el alcance antes
    // de guardar (igual que Outlook/Teams: "solo este evento" o "toda la serie").
    if (isEdit && task?.serieId) {
      setPendingInput(input);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit && task) {
        await updateTask(task.id, input);
        toast.success("Tarea actualizada.");
      } else {
        const serieId =
          recurrencia && input.fecha
            ? typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `serie-${Date.now()}`
            : null;
        await createTask({ ...input, serieId });

        if (serieId && input.fecha) {
          const fechasSerie = calcularFechasSerie(
            input.fecha,
            recurrencia as Recurrencia,
            finSerie,
            serieOcurrencias,
            finSerie === "fecha" ? fromDateInputValue(serieHastaFecha) : null
          );
          let creadas = 1;
          let fallidas = 0;
          for (const f of fechasSerie) {
            try {
              await createTask({ ...input, fecha: f, serieId });
              creadas++;
            } catch {
              fallidas++;
            }
          }
          toast.success(
            fallidas > 0
              ? `Serie creada: ${creadas} tareas (${fallidas} fallaron).`
              : `Serie creada: ${creadas} tareas.`
          );
        } else {
          toast.success("Tarea creada.");
        }
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar la tarea.";
      setError(message);
      toast.error(message);
      setSaving(false);
    }
  }

  async function handleSerieChoice(scope: "solo" | "serie") {
    if (!pendingInput || !task) return;
    const input = pendingInput;
    setPendingInput(null);
    setSaving(true);
    setError(null);
    try {
      await updateTask(task.id, input);
      if (scope === "serie" && task.serieId) {
        const { titulo, descripcion, disciplina, responsable, tipo, horaInicio, horaFin, esStopper, notas } =
          input;
        await updateSerie(
          task.serieId,
          { titulo, descripcion, disciplina, responsable, tipo, horaInicio, horaFin, esStopper, notas },
          task.id
        );
      }
      toast.success(scope === "serie" ? "Serie actualizada." : "Tarea actualizada.");
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

  async function handleDeleteSerie() {
    if (!task?.serieId) return;
    setConfirmingDelete(false);
    setSaving(true);
    try {
      await deleteSerie(task.serieId);
      toast.success("Serie eliminada.");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar la serie.";
      setError(message);
      toast.error(message);
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

        {isEdit && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción (opcional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

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
            <label className="mb-1 block text-xs font-medium text-slate-600">Hora inicio</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Hora fin</label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className={isEdit ? "grid grid-cols-2 gap-3" : ""}>
          {isEdit && (
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
          )}
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

        {isEdit && task?.serieId && (
          <p className="-mt-2 text-xs text-indigo-600">
            Esta tarea es parte de una serie recurrente ({serieCount} tareas). Al guardar, podrás
            elegir si el cambio aplica solo aquí o a toda la serie.
          </p>
        )}

        {!isEdit && recurrencia && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
            <p className="mb-2 text-xs font-medium text-indigo-700">
              Repetir {RECURRENCIA_LABEL[recurrencia].toLowerCase()} — ¿hasta cuándo?
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="finSerie"
                  checked={finSerie === "ocurrencias"}
                  onChange={() => setFinSerie("ocurrencias")}
                  className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
                />
                Después de
                <input
                  type="number"
                  min={1}
                  max={MAX_OCURRENCIAS_SERIE + 1}
                  value={serieOcurrencias}
                  disabled={finSerie !== "ocurrencias"}
                  onChange={(e) => setSerieOcurrencias(Number(e.target.value))}
                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                repeticiones
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="finSerie"
                  checked={finSerie === "fecha"}
                  onChange={() => setFinSerie("fecha")}
                  className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
                />
                Hasta el
                <input
                  type="date"
                  value={serieHastaFecha}
                  disabled={finSerie !== "fecha"}
                  onChange={(e) => setSerieHastaFecha(e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Se crea una tarea independiente por cada fecha (máx. {MAX_OCURRENCIAS_SERIE + 1} en
              total), igual que en Outlook/Teams.
            </p>
          </div>
        )}

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={esStopper}
              onChange={(e) => setEsStopper(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            Es <span className="font-semibold text-red-600">stopper</span>
          </label>
        )}

        {tipo === "ENTREGABLE" && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={enviado}
              onChange={(e) => setEnviado(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <span className="font-semibold text-green-700">Enviado</span> al cliente/interventoría
          </label>
        )}

        {isEdit && (
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
        )}

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
        <DeleteTaskDialog
          task={task}
          serieCount={serieCount}
          onDeleteOne={handleDelete}
          onDeleteSerie={handleDeleteSerie}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {pendingInput && task?.serieId && (
        <Modal title="Guardar cambios" onClose={() => setPendingInput(null)} widthClass="max-w-sm">
          <p className="text-sm text-slate-600">
            Esta tarea es parte de una serie recurrente ({serieCount} tareas en total). ¿Dónde
            quieres aplicar los cambios?
          </p>
          <p className="mt-2 text-xs text-slate-400">
            La fecha, el estado y "Enviado" siempre quedan solo en esta tarea; el resto de campos
            (título, disciplina, responsable, horas, notas...) se pueden replicar a toda la serie.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleSerieChoice("solo")}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Solo esta tarea
            </button>
            <button
              type="button"
              onClick={() => handleSerieChoice("serie")}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-left text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Toda la serie ({serieCount})
            </button>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setPendingInput(null)}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
