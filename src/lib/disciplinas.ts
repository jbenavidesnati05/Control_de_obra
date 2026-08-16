import {
  Zap,
  Wind,
  Flame,
  Droplet,
  Fuel,
  Snowflake,
  Lightbulb,
  HardHat,
  ShieldCheck,
  Layers,
  type LucideIcon,
} from "lucide-react";
import type { Disciplina } from "./types";

interface DisciplinaInfo {
  label: string;
  corto: string;
  icon: LucideIcon;
  // Color único por disciplina, usado igual en calendario y kanban.
  color: string; // hex del punto/borde
  bg: string; // fondo suave del chip
  text: string; // texto sobre el chip
  ring: string; // borde sutil del chip
}

export const DISCIPLINA_INFO: Record<Disciplina, DisciplinaInfo> = {
  ELECTRICO: {
    label: "Eléctrico",
    corto: "ELEC",
    icon: Zap,
    color: "#eda100",
    bg: "#fff3d9",
    text: "#7a5200",
    ring: "#f0c473",
  },
  HVAC: {
    label: "HVAC",
    corto: "HVAC",
    icon: Wind,
    color: "#1baf7a",
    bg: "#d9f5ea",
    text: "#0d6b4a",
    ring: "#7fd6b6",
  },
  RCI: {
    label: "RCI (Contra Incendio)",
    corto: "RCI",
    icon: Flame,
    color: "#e34948",
    bg: "#fbe1e1",
    text: "#8f2221",
    ring: "#ef9c9b",
  },
  HIDROSANITARIO: {
    label: "Hidrosanitario",
    corto: "HIDRO",
    icon: Droplet,
    color: "#2a78d6",
    bg: "#deebfb",
    text: "#164c8c",
    ring: "#8fbceb",
  },
  GAS: {
    label: "Gas",
    corto: "GAS",
    icon: Fuel,
    color: "#eb6834",
    bg: "#fde3d6",
    text: "#96380f",
    ring: "#f3a780",
  },
  RED_FRIO: {
    label: "Red de Frío",
    corto: "FRIO",
    icon: Snowflake,
    color: "#4a3aa7",
    bg: "#e5e1f7",
    text: "#2f2470",
    ring: "#a99ce0",
  },
  ILUMINACION: {
    label: "Iluminación",
    corto: "ILUM",
    icon: Lightbulb,
    color: "#e87ba4",
    bg: "#fce4ee",
    text: "#9c3e64",
    ring: "#f2aec7",
  },
  CIVIL: {
    label: "Civil",
    corto: "CIVIL",
    icon: HardHat,
    color: "#8a6a4a",
    bg: "#ece3d8",
    text: "#5a4227",
    ring: "#c7ae91",
  },
  SEGURIDAD: {
    label: "Seguridad",
    corto: "SEG",
    icon: ShieldCheck,
    color: "#5b6b7a",
    bg: "#e4e8ec",
    text: "#33404b",
    ring: "#a6b4bf",
  },
  TRANSVERSAL: {
    label: "Transversal",
    corto: "TRANS",
    icon: Layers,
    color: "#008300",
    bg: "#d9f2d9",
    text: "#0a5c0a",
    ring: "#7fc97f",
  },
};

export function disciplinaInfo(d: Disciplina): DisciplinaInfo {
  return DISCIPLINA_INFO[d];
}
