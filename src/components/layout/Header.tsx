"use client";

import { Bot, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900 shadow-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">FlowBoard</p>
            <p className="text-xs text-slate-400">Automatización de procesos · Grupo EMI Falck</p>
            <p className="text-[11px] text-sky-400">Desarrollado por jbenavides.dev</p>
          </div>
        </div>

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
    </header>
  );
}
