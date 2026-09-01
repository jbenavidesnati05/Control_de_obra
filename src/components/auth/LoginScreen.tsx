"use client";

import { useState } from "react";
import { HardHat } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import GoogleIcon from "./GoogleIcon";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [entrando, setEntrando] = useState(false);

  async function handleSignIn() {
    setEntrando(true);
    try {
      await signIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
      setEntrando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
        <HardHat className="h-7 w-7" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-900">ObraControl</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inicia sesión para ver tu calendario y tablero de obra.
        </p>
      </div>
      <button
        onClick={handleSignIn}
        disabled={entrando}
        className="flex items-center gap-2.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
      >
        <GoogleIcon className="h-4 w-4" />
        {entrando ? "Entrando..." : "Continuar con Google"}
      </button>
    </div>
  );
}
