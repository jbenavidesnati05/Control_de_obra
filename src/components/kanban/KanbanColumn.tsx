"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { Estado, Task } from "@/lib/types";
import KanbanCard from "./KanbanCard";

interface Props {
  estado: Estado;
  title: string;
  accent: string;
  tasks: Task[];
  onCardClick: (task: Task) => void;
  onDeleteRequest: (task: Task) => void;
  // Columna sobre la que está el drag activo ahora mismo, calculada en
  // KanbanBoard (ver comentario ahí). No basta el `isOver` del propio
  // useDroppable: ese solo es true al pasar por el espacio vacío, no al
  // pasar sobre otra tarjeta (que es casi toda el área de una columna con
  // contenido), y por eso el resaltado no se activaba.
  overEstado: Estado | null;
}

export default function KanbanColumn({
  estado,
  title,
  accent,
  tasks,
  onCardClick,
  onDeleteRequest,
  overEstado,
}: Props) {
  const { setNodeRef } = useDroppable({ id: estado });
  const isOver = overEstado === estado;

  return (
    <div
      className={cn(
        "flex min-w-[210px] flex-1 flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-150",
        isOver ? "scale-[1.015] border-blue-400 shadow-lg" : "border-slate-200"
      )}
    >
      <div
        className="h-1.5 shrink-0 transition-colors duration-150"
        style={{ backgroundColor: isOver ? "#2563eb" : accent }}
      />
      <div
        className={cn(
          "flex items-center justify-between border-b px-3 py-2.5 transition-colors duration-150",
          isOver ? "border-blue-100 bg-blue-50" : "border-slate-100 bg-slate-50/70"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto p-2.5 transition-colors duration-150",
          isOver ? "bg-blue-100/70 ring-4 ring-inset ring-blue-400" : "bg-slate-50/70"
        )}
      >
        {tasks.length === 0 && (
          <p className="mt-4 text-center text-xs text-slate-400">Sin tareas</p>
        )}
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onCardClick(task)}
              onRequestDelete={() => onDeleteRequest(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
