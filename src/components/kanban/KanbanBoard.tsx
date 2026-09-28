"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";
import { deleteTask, deleteSerie, reorderTask } from "@/lib/tasks";
import {
  ESTADOS,
  DISCIPLINAS,
  TIPOS_SOLO_CALENDARIO,
  type Disciplina,
  type Estado,
  type Task,
} from "@/lib/types";
import { disciplinaInfo } from "@/lib/disciplinas";
import KanbanColumn from "./KanbanColumn";
import KanbanFilters from "./KanbanFilters";
import { KanbanCardOverlay } from "./KanbanCard";
import WeeklyScoreBadge from "./WeeklyScoreBadge";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import DeleteTaskDialog from "@/components/tasks/DeleteTaskDialog";

// closestCenter elige el droppable más cercano por centro de rectángulo, lo
// que con columnas de tamaños/posiciones distintas activa la equivocada de
// forma inconsistente. Preferimos "dónde está literalmente el cursor"
// (pointerWithin) y solo si eso no encuentra nada (p. ej. el cursor salió
// del área de cualquier columna) caemos a rectIntersection como respaldo.
const collisionDetectionStrategy: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

const ESTADO_TITLE: Record<Estado, string> = {
  POR_HACER: "Por hacer",
  EN_PROCESO: "En proceso",
  CERRADA: "Cerrada",
};

const ESTADO_ACCENT: Record<Estado, string> = {
  POR_HACER: "#94a3b8",
  EN_PROCESO: "#f59e0b",
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overEstado, setOverEstado] = useState<Estado | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // Comités, cortes, hitos de cronograma y entregables viven en el Calendario;
  // el Kanban es solo para tareas de trabajo por disciplina.
  const tareasDeTrabajo = useMemo(
    () => tasks.filter((t) => !TIPOS_SOLO_CALENDARIO.includes(t.tipo)),
    [tasks]
  );

  const responsables = useMemo(() => {
    const set = new Set<string>();
    for (const t of tareasDeTrabajo) if (t.responsable) set.add(t.responsable);
    return Array.from(set).sort();
  }, [tareasDeTrabajo]);

  const filtered = useMemo(() => {
    return tareasDeTrabajo.filter((t) => {
      if (disciplinaFiltro && t.disciplina !== disciplinaFiltro) return false;
      if (responsableFiltro && t.responsable !== responsableFiltro) return false;
      return true;
    });
  }, [tareasDeTrabajo, disciplinaFiltro, responsableFiltro]);

  // Orden manual (arrastrar en el tablero) con respaldo a orden de creación
  // para tareas viejas que todavía no tienen "orden" asignado.
  function ordenDe(t: Task): number {
    return t.orden ?? t.createdAt?.getTime() ?? 0;
  }

  function tasksFor(estado: Estado, disciplina?: Disciplina) {
    return filtered
      .filter((t) => t.estado === estado && (disciplina ? t.disciplina === disciplina : true))
      .sort((a, b) => ordenDe(a) - ordenDe(b));
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  // El `isOver` del useDroppable de cada columna solo es true sobre su
  // espacio vacío, no al pasar sobre una tarjeta (que es casi toda el área
  // de una columna con contenido). Por eso calculamos aquí "sobre qué
  // columna está el drag" y se lo pasamos a cada KanbanColumn para resaltarla.
  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      setOverEstado(null);
      return;
    }
    const overIsColumn = (ESTADOS as string[]).includes(String(over.id));
    if (overIsColumn) {
      setOverEstado(over.id as Estado);
      return;
    }
    const overTask = tasks.find((t) => t.id === over.id);
    setOverEstado(overTask?.estado ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    setOverEstado(null);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // over.id es el id de la columna (ESTADOS) cuando se suelta en un espacio
    // vacío, o el id de otra tarjeta cuando se suelta cerca/sobre otra.
    const overIsColumn = (ESTADOS as string[]).includes(String(over.id));
    const overTask = overIsColumn ? null : tasks.find((t) => t.id === over.id);
    const targetEstado: Estado = overIsColumn
      ? (over.id as Estado)
      : (overTask?.estado ?? activeTask.estado);

    const destino = tasksFor(targetEstado).filter((t) => t.id !== activeTask.id);
    const index = overTask ? destino.findIndex((t) => t.id === overTask.id) : destino.length;
    const before = index > 0 ? destino[index - 1] : undefined;
    const after = index >= 0 && index < destino.length ? destino[index] : undefined;

    let nuevoOrden: number;
    if (before && after) nuevoOrden = (ordenDe(before) + ordenDe(after)) / 2;
    else if (before) nuevoOrden = ordenDe(before) + 1000;
    else if (after) nuevoOrden = ordenDe(after) - 1000;
    else nuevoOrden = Date.now();

    const cambiaEstado = targetEstado !== activeTask.estado;
    if (!cambiaEstado && nuevoOrden === ordenDe(activeTask)) return;

    try {
      await reorderTask(activeTask.id, nuevoOrden, cambiaEstado ? targetEstado : undefined);
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

  async function handleConfirmDeleteSerie() {
    if (!deletingTask?.serieId) return;
    const { serieId } = deletingTask;
    setDeletingTask(null);
    try {
      await deleteSerie(serieId);
      toast.success("Serie eliminada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la serie.");
    }
  }

  const disciplinasConTareas = agrupar
    ? DISCIPLINAS.filter((d) => filtered.some((t) => t.disciplina === d))
    : [];

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
        <h1 className="text-base font-semibold text-slate-900">Tablero de tareas</h1>
        <div className="flex items-center gap-3">
          <WeeklyScoreBadge tasks={tasks} />
          <button
            onClick={() => setCreatingEstado("POR_HACER")}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </button>
        </div>
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
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              setActiveTask(null);
              setOverEstado(null);
            }}
          >
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
                      <div className="mx-auto flex w-full max-w-[75%] gap-3">
                        {ESTADOS.map((estado) => (
                          <KanbanColumn
                            key={estado}
                            estado={estado}
                            title={ESTADO_TITLE[estado]}
                            accent={ESTADO_ACCENT[estado]}
                            tasks={tasksFor(estado, d)}
                            onCardClick={setEditingTask}
                            onDeleteRequest={setDeletingTask}
                            overEstado={overEstado}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mx-auto flex h-full w-full max-w-[75%] gap-3">
                {ESTADOS.map((estado) => (
                  <KanbanColumn
                    key={estado}
                    estado={estado}
                    title={ESTADO_TITLE[estado]}
                    accent={ESTADO_ACCENT[estado]}
                    tasks={tasksFor(estado)}
                    onCardClick={setEditingTask}
                    onDeleteRequest={setDeletingTask}
                    overEstado={overEstado}
                  />
                ))}
              </div>
            )}
            <DragOverlay>{activeTask && <KanbanCardOverlay task={activeTask} />}</DragOverlay>
          </DndContext>
        )}
      </div>

      {editingTask && <TaskFormModal task={editingTask} onClose={() => setEditingTask(null)} />}
      {creatingEstado && (
        <TaskFormModal defaultEstado={creatingEstado} onClose={() => setCreatingEstado(null)} />
      )}
      {deletingTask && (
        <DeleteTaskDialog
          task={deletingTask}
          serieCount={
            deletingTask.serieId
              ? tasks.filter((t) => t.serieId === deletingTask.serieId).length
              : 0
          }
          onDeleteOne={handleConfirmDelete}
          onDeleteSerie={handleConfirmDeleteSerie}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
