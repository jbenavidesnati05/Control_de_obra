import { Repeat } from "lucide-react";
import { DISCIPLINA_INFO } from "@/lib/disciplinas";
import { DISCIPLINAS } from "@/lib/types";

export default function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:px-6">
      <span className="font-medium text-slate-400">Disciplinas:</span>
      {DISCIPLINAS.map((d) => {
        const info = DISCIPLINA_INFO[d];
        return (
          <span key={d} className="inline-flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: info.color }}
            />
            {info.label}
          </span>
        );
      })}
      <span className="ml-2 inline-flex items-center gap-1 border-l border-slate-200 pl-3">
        <Repeat className="h-3 w-3 opacity-70" />
        Tarea recurrente (semanal/quincenal)
      </span>
    </div>
  );
}
