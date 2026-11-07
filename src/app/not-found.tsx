import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <Compass className="h-10 w-10 text-slate-300" />
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Esta página ya no existe</h1>
        <p className="mt-1 text-sm text-slate-500">
          Puede que tengas guardado un enlace viejo (como /calendario).
        </p>
      </div>
      <Link
        href="/tareas"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
      >
        Ir al tablero de tareas
      </Link>
    </div>
  );
}
