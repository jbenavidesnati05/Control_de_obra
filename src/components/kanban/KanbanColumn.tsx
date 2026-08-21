"use client";

import { useDroppable } from "@dnd-kit/core";
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
}

export default function KanbanColumn({
  estado,
  title,
  accent,
  tasks,
  onCardClick,
  onDeleteRequest,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <div className="flex min-w-[210px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="h-1.5 shrink-0"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3 py-2.5">
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
          "flex flex-1 flex-col gap-2 overflow-y-auto bg-slate-50/70 p-2.5 transition-colors",
          isOver && "bg-blue-50 ring-2 ring-inset ring-blue-300"
        )}
      >
        {tasks.length === 0 && (
          <p className="mt-4 text-center text-xs text-slate-400">Sin tareas</p>
        )}
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onClick={() => onCardClick(task)}
            onRequestDelete={() => onDeleteRequest(task)}
          />
        ))}
      </div>
    </div>
  );
}
