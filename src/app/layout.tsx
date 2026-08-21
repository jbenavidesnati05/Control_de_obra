import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Header from "@/components/layout/Header";
import { TasksProvider } from "@/hooks/useTasks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ObraControl",
  description: "Control de obra: calendario y tablero de tareas por disciplina",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="top-right" richColors closeButton />
        <TasksProvider>
          <Header />
          <main className="flex flex-1 flex-col min-h-0">
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col min-h-0 p-4 sm:p-6">
              <div className="flex flex-1 flex-col min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {children}
              </div>
            </div>
          </main>
        </TasksProvider>
      </body>
    </html>
  );
}
