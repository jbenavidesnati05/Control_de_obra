"use client";

import { useMemo, useState } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";
import { deleteTask, moveTask } from "@/lib/tasks";
import { ESTADOS, DISCIPLINAS, type Disciplina, type Estado, type Task } from "@/lib/types";
import { disciplinaInfo } from "@/lib/disciplinas";
import KanbanColumn from "./KanbanColumn";
import KanbanFilters from "./KanbanFilters";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ESTADO_TITLE: Record<Estado, string> = {
  POR_HACER: "Por hacer",
  EN_ANALISIS: "En análisis",
  EN_GESTION: "En gestión",
  HECHA: "Hecha",
  CERRADA: "Cerrada",
};

const ESTADO_ACCENT: Record<Estado, string> = {
  POR_HACER: "#94a3b8",
  EN_ANALISIS: "#6366f1",
  EN_GESTION: "#f59e0b",
  HECHA: "#10b981",
  CERRADA: "#475569",
};

export default function KanbanBoard() {
  const { tasks, loading, error } = useTasks();
  const [disciplinaFiltro, setDisciplinaFiltro] = useState<Disciplina | null>(null);
  const [responsableFiltro, setResponsableFiltro] = useState<string | null>(null);
  const [agrupar, setAgrupar] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingEstado, setCreatingEstado] = useState<Estado | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const responsables = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) if (t.responsable) set.add(t.responsable);
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (disciplinaFiltro && t.disciplina !== disciplinaFiltro) return false;
      if (responsableFiltro && t.responsable !== responsableFiltro) return false;
      return true;
    });
  }, [tasks, disciplinaFiltro, responsableFiltro]);

  function tasksFor(estado: Estado, disciplina?: Disciplina) {
    return filtered.filter(
      (t) => t.estado === estado && (disciplina ? t.disciplina === disciplina : true)
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const nuevoEstado = over.id as Estado;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.estado === nuevoEstado) return;
    try {
      await moveTask(task.id, nuevoEstado);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo mover la tarea.");
    }
  }

  async function handleConfirmDelete() {
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

  const disciplinasConTareas = agrupar
    ? DISCIPLINAS.filter((d) => filtered.some((t) => t.disciplina === d))
    : [];

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
        <h1 className="text-base font-semibold text-slate-900">Tablero de tareas</h1>
        <button
          onClick={() => setCreatingEstado("POR_HACER")}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </div>

      <KanbanFilters
        disciplinaFiltro={disciplinaFiltro}
        setDisciplinaFiltro={setDisciplinaFiltro}
        responsables={responsables}
        responsableFiltro={responsableFiltro}
        setResponsableFiltro={setResponsableFiltro}
        agrupar={agrupar}
        setAgrupar={setAgrupar}
      />

      {error && (
        <div className="mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-6">
          Error cargando tareas: {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Cargando...
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {agrupar ? (
              <div className="flex flex-col gap-6">
                {disciplinasConTareas.map((d) => {
                  const info = disciplinaInfo(d);
                  return (
                    <div key={d}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
                        <h3 className="text-sm font-semibold text-slate-700">{info.label}</h3>
                      </div>
                      <div className="flex gap-3">
                        {ESTADOS.map((estado) => (
                          <KanbanColumn
                            key={estado}
                            estado={estado}
                            title={ESTADO_TITLE[estado]}
                            accent={ESTADO_ACCENT[estado]}
                            tasks={tasksFor(estado, d)}
                            onCardClick={setEditingTask}
                            onDeleteRequest={setDeletingTask}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full gap-3">
                {ESTADOS.map((estado) => (
                  <KanbanColumn
                    key={estado}
                    estado={estado}
                    title={ESTADO_TITLE[estado]}
                    accent={ESTADO_ACCENT[estado]}
                    tasks={tasksFor(estado)}
                    onCardClick={setEditingTask}
                    onDeleteRequest={setDeletingTask}
                  />
                ))}
              </div>
            )}
          </DndContext>
        )}
      </div>

      {editingTask && <TaskFormModal task={editingTask} onClose={() => setEditingTask(null)} />}
      {creatingEstado && (
        <TaskFormModal defaultEstado={creatingEstado} onClose={() => setCreatingEstado(null)} />
      )}
      {deletingTask && (
        <ConfirmDialog
          title="Eliminar tarea"
          message={`¿Eliminar "${deletingTask.titulo}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
