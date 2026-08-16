"use client";

import { X } from "lucide-react";
import { DISCIPLINA_INFO } from "@/lib/disciplinas";
import { cn } from "@/lib/utils";
import { DISCIPLINAS, type Disciplina } from "@/lib/types";

interface Props {
  disciplinaFiltro: Disciplina | null;
  setDisciplinaFiltro: (d: Disciplina | null) => void;
  responsables: string[];
  responsableFiltro: string | null;
  setResponsableFiltro: (r: string | null) => void;
  agrupar: boolean;
  setAgrupar: (v: boolean) => void;
}

export default function KanbanFilters({
  disciplinaFiltro,
  setDisciplinaFiltro,
  responsables,
  responsableFiltro,
  setResponsableFiltro,
  agrupar,
  setAgrupar,
}: Props) {
  const hayFiltros = disciplinaFiltro || responsableFiltro;

  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-slate-400">Disciplina:</span>
        {DISCIPLINAS.map((d) => {
          const info = DISCIPLINA_INFO[d];
          const active = disciplinaFiltro === d;
          return (
            <button
              key={d}
              onClick={() => setDisciplinaFiltro(active ? null : d)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-transform",
                active ? "scale-105 ring-2 ring-offset-1" : "opacity-70 hover:opacity-100"
              )}
              style={{
                backgroundColor: info.bg,
                color: info.text,
                ...(active ? ({ "--tw-ring-color": info.color } as React.CSSProperties) : {}),
              }}
            >
              {info.label}
            </button>
          );
        })}
      </div>

      {responsables.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-slate-400">Responsable:</span>
          {responsables.map((r) => {
            const active = responsableFiltro === r;
            return (
              <button
                key={r}
                onClick={() => setResponsableFiltro(active ? null : r)}
                className={cn(
                  "rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {r}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 pt-0.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <input
            type="checkbox"
            checked={agrupar}
            onChange={(e) => setAgrupar(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600"
          />
          Agrupar por disciplina
        </label>

        {hayFiltros && (
          <button
            onClick={() => {
              setDisciplinaFiltro(null);
              setResponsableFiltro(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700"
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
