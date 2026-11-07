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
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";
import { createTask, deleteTask, reorderTask } from "@/lib/tasks";
import { ESTADO_ACCENT, ESTADO_LABEL } from "@/lib/automatizacion";
import { TAREAS_EJEMPLO } from "@/lib/seedData";
import { ESTADOS, type Estado, type Prioridad, type Task } from "@/lib/types";
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

export default function KanbanBoard() {
  const { tasks, loading, error } = useTasks();
  const [prioridadFiltro, setPrioridadFiltro] = useState<Prioridad | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overEstado, setOverEstado] = useState<Estado | null>(null);
  const [seeding, setSeeding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => !prioridadFiltro || t.prioridad === prioridadFiltro);
  }, [tasks, prioridadFiltro]);

  // Orden manual (arrastrar en el tablero) con respaldo a orden de creación
  // para tareas viejas que todavía no tienen "orden" asignado.
  function ordenDe(t: Task): number {
    return t.orden ?? t.createdAt?.getTime() ?? 0;
  }

  function tasksFor(estado: Estado) {
    return filtered.filter((t) => t.estado === estado).sort((a, b) => ordenDe(a) - ordenDe(b));
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  // El `isOver` del useDroppable de cada columna solo es true sobre su
  // espacio vacío, no al pasar sobre otra tarjeta (que es casi toda el área
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

  async function handleSeed() {
    setSeeding(true);
    try {
      for (const input of TAREAS_EJEMPLO) {
        await createTask(input);
      }
      toast.success(`${TAREAS_EJEMPLO.length} tareas de ejemplo cargadas.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los ejemplos.");
    } finally {
      setSeeding(false);
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

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
        <h1 className="text-base font-semibold text-slate-900">Tablero de tareas</h1>
        <div className="flex items-center gap-3">
          <WeeklyScoreBadge tasks={tasks} />
          {!loading && tasks.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {seeding ? "Cargando..." : "Cargar ejemplos"}
            </button>
          )}
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </button>
        </div>
      </div>

      <KanbanFilters prioridadFiltro={prioridadFiltro} setPrioridadFiltro={setPrioridadFiltro} />

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
            <div className="mx-auto flex h-full w-full max-w-[75%] gap-3">
              {ESTADOS.map((estado) => (
                <KanbanColumn
                  key={estado}
                  estado={estado}
                  title={ESTADO_LABEL[estado]}
                  accent={ESTADO_ACCENT[estado]}
                  tasks={tasksFor(estado)}
                  onCardClick={setEditingTask}
                  onDeleteRequest={setDeletingTask}
                  overEstado={overEstado}
                />
              ))}
            </div>
            <DragOverlay>{activeTask && <KanbanCardOverlay task={activeTask} />}</DragOverlay>
          </DndContext>
        )}
      </div>

      {editingTask && <TaskFormModal task={editingTask} onClose={() => setEditingTask(null)} />}
      {creating && <TaskFormModal onClose={() => setCreating(false)} />}
      {deletingTask && (
        <DeleteTaskDialog
          task={deletingTask}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
