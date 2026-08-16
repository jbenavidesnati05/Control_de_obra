"use client";

import { useMemo, useState } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, isToday, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, Repeat } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { getMonthMatrix, getWeekDays } from "@/lib/calendarUtils";
import { disciplinaInfo } from "@/lib/disciplinas";
import { isSameDay, isPast, cn } from "@/lib/utils";
import { RECURRENCIA_LABEL } from "@/lib/recurrencia";
import { ESTADOS_FINALES, type Task } from "@/lib/types";
import DayPanel from "./DayPanel";
import Legend from "./Legend";
import TaskFormModal from "@/components/tasks/TaskFormModal";

type Vista = "mes" | "semana";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_CHIPS_POR_DIA = 3;

export default function CalendarView() {
  const { tasks, loading, error } = useTasks();
  const [vista, setVista] = useState<Vista>("mes");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [creatingFor, setCreatingFor] = useState<Date | null>(null);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.fecha) continue;
      const key = format(t.fecha, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  function tasksOn(day: Date): Task[] {
    return tasksByDay.get(format(day, "yyyy-MM-dd")) ?? [];
  }

  const weeks = useMemo(
    () => (vista === "mes" ? getMonthMatrix(cursor) : [getWeekDays(cursor)]),
    [vista, cursor]
  );

  function goPrev() {
    setCursor((c) => (vista === "mes" ? subMonths(c, 1) : subWeeks(c, 1)));
  }
  function goNext() {
    setCursor((c) => (vista === "mes" ? addMonths(c, 1) : addWeeks(c, 1)));
  }
  function goToday() {
    setCursor(new Date());
  }

  const selectedDayTasks = selectedDay ? tasksOn(selectedDay) : [];

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex flex-1 flex-col min-h-0">
        {/* Barra de herramientas */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Hoy
            </button>
            <h1 className="ml-2 text-base font-semibold capitalize text-slate-900">
              {format(cursor, vista === "mes" ? "MMMM yyyy" : "'Semana del' d MMM yyyy", {
                locale: es,
              })}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(["mes", "semana"] as Vista[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    vista === v ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCreatingFor(new Date())}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nueva tarea
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-6">
            Error cargando tareas: {error}
          </div>
        )}

        {/* Grilla */}
        <div className="flex-1 overflow-auto px-4 pb-2 sm:px-6">
          <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-medium text-slate-400">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Cargando...
            </div>
          ) : (
            <div className={cn("grid grid-cols-7", vista === "semana" && "h-full")}>
              {weeks.map((week, wi) =>
                week.map((day, di) => {
                  const dayTasks = tasksOn(day);
                  const inMonth = vista === "semana" ? true : isSameMonth(day, cursor);
                  const today = isToday(day);
                  const selected = selectedDay && isSameDay(day, selectedDay);
                  const visibleTasks = dayTasks.slice(0, MAX_CHIPS_POR_DIA);
                  const extra = dayTasks.length - visibleTasks.length;

                  return (
                    <button
                      key={`${wi}-${di}`}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex min-h-[100px] flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left align-top transition-colors hover:bg-slate-50",
                        vista === "semana" && "min-h-[420px]",
                        !inMonth && "bg-slate-50/60",
                        selected && "bg-blue-50 ring-1 ring-inset ring-blue-300"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          today
                            ? "bg-blue-600 text-white shadow-sm"
                            : inMonth
                              ? "text-slate-700"
                              : "text-slate-400"
                        )}
                      >
                        {format(day, "d")}
                      </span>

                      <div className="flex flex-1 flex-col gap-1">
                        {visibleTasks.map((task) => {
                          const info = disciplinaInfo(task.disciplina);
                          const vencida = !ESTADOS_FINALES.includes(task.estado) && isPast(day);
                          return (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTask(task);
                              }}
                              className={cn(
                                "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                                vencida && "ring-1 ring-red-500"
                              )}
                              style={{ backgroundColor: info.bg, color: info.text }}
                              title={
                                task.recurrencia
                                  ? `${task.titulo} · se repite ${RECURRENCIA_LABEL[task.recurrencia].toLowerCase()}`
                                  : task.titulo
                              }
                            >
                              {task.esStopper && (
                                <AlertTriangle className="mr-0.5 inline h-2.5 w-2.5 text-red-600" />
                              )}
                              {task.recurrencia && (
                                <Repeat className="mr-0.5 inline h-2.5 w-2.5 opacity-70" />
                              )}
                              {task.titulo}
                            </div>
                          );
                        })}
                        {extra > 0 && (
                          <span className="px-1.5 text-[10px] font-medium text-slate-400">
                            +{extra} más
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <Legend />
      </div>

      {selectedDay && (
        <DayPanel
          date={selectedDay}
          tasks={selectedDayTasks}
          onClose={() => setSelectedDay(null)}
          onAdd={() => setCreatingFor(selectedDay)}
          onSelectTask={(t) => setEditingTask(t)}
        />
      )}

      {editingTask && (
        <TaskFormModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
      {creatingFor && (
        <TaskFormModal defaultFecha={creatingFor} onClose={() => setCreatingFor(null)} />
      )}
    </div>
  );
}
