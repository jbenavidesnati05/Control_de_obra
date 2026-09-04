"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, KanbanSquare, HardHat, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/tareas", label: "Tareas", icon: KanbanSquare },
];

export default function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900 shadow-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">ObraControl</p>
            <p className="text-xs text-slate-400">
              Interventoría · Remodelación tienda retail
            </p>
            <p className="text-[11px] text-sky-400">Desarrollado por jbenavides.dev</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">
            {TABS.map((tab) => {
              const active = pathname?.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "Usuario"}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-200">
                  {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="hidden text-xs font-medium text-slate-300 sm:inline">
                {user.displayName ?? user.email}
              </span>
              <button
                onClick={signOut}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
