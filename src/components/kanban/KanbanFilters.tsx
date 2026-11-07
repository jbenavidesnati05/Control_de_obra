"use client";

import { X } from "lucide-react";
import { PRIORIDAD_COLOR, PRIORIDAD_LABEL } from "@/lib/automatizacion";
import { cn } from "@/lib/utils";
import { PRIORIDADES, type Prioridad } from "@/lib/types";

interface Props {
  prioridadFiltro: Prioridad | null;
  setPrioridadFiltro: (p: Prioridad | null) => void;
}

export default function KanbanFilters({ prioridadFiltro, setPrioridadFiltro }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-4 py-3 sm:px-6">
      <span className="mr-1 text-xs font-medium text-slate-400">Prioridad:</span>
      {PRIORIDADES.map((p) => {
        const info = PRIORIDAD_COLOR[p];
        const active = prioridadFiltro === p;
        return (
          <button
            key={p}
            onClick={() => setPrioridadFiltro(active ? null : p)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-transform",
              active ? "scale-105 ring-2 ring-offset-1" : "opacity-70 hover:opacity-100"
            )}
            style={{
              backgroundColor: info.bg,
              color: info.text,
              ...(active ? ({ "--tw-ring-color": info.text } as React.CSSProperties) : {}),
            }}
          >
            {PRIORIDAD_LABEL[p]}
          </button>
        );
      })}

      {prioridadFiltro && (
        <button
          onClick={() => setPrioridadFiltro(null)}
          className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700"
        >
          <X className="h-3 w-3" />
          Limpiar
        </button>
      )}
    </div>
  );
}
