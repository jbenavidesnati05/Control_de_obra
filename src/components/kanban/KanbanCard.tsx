"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, CalendarDays, Clock, Repeat, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import DisciplinaChip from "@/components/tasks/DisciplinaChip";
import { disciplinaInfo } from "@/lib/disciplinas";
import { colorEstancamiento, diasSinGestion } from "@/lib/taskStatus";
import { isPast, cn } from "@/lib/utils";
import { RECURRENCIA_LABEL_CORTO } from "@/lib/recurrencia";
import { ESTADOS_FINALES, type Task } from "@/lib/types";

interface Props {
  task: Task;
  onClick: () => void;
  onRequestDelete: () => void;
}

// Contenido visual puro de la tarjeta, sin nada de dnd-kit: se reutiliza
// tanto en la tarjeta arrastrable normal como en el DragOverlay (la copia
// flotante que sigue al cursor durante el arrastre).
export function KanbanCardBody({ task }: { task: Task }) {
  const info = disciplinaInfo(task.disciplina);
  const vencida = task.fecha && !ESTADOS_FINALES.includes(task.estado) && isPast(task.fecha);
  const dias = diasSinGestion(task);
  const estancamiento = colorEstancamiento(task);

  return (
    <>
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
        {estancamiento && (
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: estancamiento.bg, color: estancamiento.text }}
            title={`${dias} día${dias === 1 ? "" : "s"} sin gestionar`}
          >
            <Clock className="h-2.5 w-2.5" />
            {dias}d
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
    </>
  );
}

// Tarjeta "fantasma" que se muestra dentro del DragOverlay: copia flotante,
// portada al body por dnd-kit, que no se recorta con el overflow de la
// columna de origen y sigue al cursor con su propia sombra.
export function KanbanCardOverlay({ task }: { task: Task }) {
  const info = disciplinaInfo(task.disciplina);
  const cerrada = task.estado === "CERRADA";
  const estancamiento = colorEstancamiento(task);
  return (
    <div
      style={{
        borderLeftColor: estancamiento?.ring ?? info.color,
        backgroundColor: estancamiento?.bg,
      }}
      className={cn(
        "cursor-grabbing rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-xl ring-1 ring-black/5",
        cerrada && "grayscale opacity-75"
      )}
    >
      <KanbanCardBody task={task} />
    </div>
  );
}

export default function KanbanCard({ task, onClick, onRequestDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const info = disciplinaInfo(task.disciplina);
  const cerrada = task.estado === "CERRADA";
  const estancamiento = colorEstancamiento(task);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: estancamiento?.ring ?? info.color,
    backgroundColor: estancamiento?.bg,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "group relative cursor-grab rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        // Con DragOverlay activo, la tarjeta original se vuelve invisible (el
        // overlay es la que se ve siguiendo al cursor) para no duplicar la
        // tarjeta en pantalla.
        isDragging && "invisible",
        cerrada && "grayscale opacity-75 hover:opacity-100"
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Eliminar tarea"
        className="absolute right-1.5 top-1.5 rounded-md p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <KanbanCardBody task={task} />
    </div>
  );
}
