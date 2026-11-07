"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// Sin esto, cualquier error de render sin capturar deja la pantalla en
// blanco (Next.js App Router no muestra nada por defecto). Con esto al
// menos se ve el mensaje y se puede reintentar.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-red-500" />
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Algo salió mal</h1>
        <p className="mt-1 max-w-md text-sm text-slate-500">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}
