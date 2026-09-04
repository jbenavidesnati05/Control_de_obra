"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star } from "lucide-react";
import { historialSemanal } from "@/lib/puntaje";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface Props {
  tasks: Task[];
}

export default function WeeklyScoreBadge({ tasks }: Props) {
  const [open, setOpen] = useState(false);
  const semanas = useMemo(() => historialSemanal(tasks, 6), [tasks]);
  const actual = semanas[semanas.length - 1];
  const maxPuntos = Math.max(...semanas.map((s) => s.puntos), 1);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
      >
        <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
        {actual.puntos} esta semana
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-slate-500">Últimas 6 semanas</p>
          <div className="flex h-20 items-end gap-1.5">
            {semanas.map((s, i) => {
              const esActual = i === semanas.length - 1;
              const alturaPct = Math.max((s.puntos / maxPuntos) * 100, s.puntos > 0 ? 8 : 2);
              return (
                <div key={s.inicio.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-full w-full items-end">
                    <div
                      title={`${format(s.inicio, "d MMM", { locale: es })}: ${s.puntos} pts (${s.tareas} tareas)`}
                      className={cn(
                        "w-full rounded-t transition-colors",
                        esActual ? "bg-amber-500" : "bg-amber-200"
                      )}
                      style={{ height: `${alturaPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">{format(s.inicio, "d/M")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
