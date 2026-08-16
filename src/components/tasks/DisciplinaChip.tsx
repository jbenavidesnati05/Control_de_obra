import { disciplinaInfo } from "@/lib/disciplinas";
import type { Disciplina } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  disciplina: Disciplina;
  size?: "xs" | "sm";
  className?: string;
}

// Chip consistente para identificar la disciplina en calendario y kanban.
// Siempre lleva icono + texto (nunca depende solo del color).
export default function DisciplinaChip({ disciplina, size = "sm", className }: Props) {
  const info = disciplinaInfo(disciplina);
  const Icon = info.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        className
      )}
      style={{ backgroundColor: info.bg, color: info.text }}
    >
      <Icon className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {size === "xs" ? info.corto : info.label}
    </span>
  );
}
