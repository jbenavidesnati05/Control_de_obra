/**
 * Seed de eventos reales de calendario para el proyecto Carulla Belén:
 * comités de obra, recepción/aprobación de cortes de programación, y fechas
 * de envío de entregables al cliente (bitácora, reportes, informes, actas).
 *
 * NO incluye los hitos de cronograma general (PASO 1..23): esa lista con
 * fechas y contratistas todavía no existe en el proyecto — hay que agregarla
 * a este script (o pasarla aparte) antes de poder sembrarla.
 *
 * Uso:
 *   npm run seed:belen -- --dry-run   (solo imprime qué se crearía, no escribe nada)
 *   npm run seed:belen                (escribe de verdad en Firestore)
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import type { Disciplina, Estado, Tipo } from "../src/lib/types";

const DRY_RUN = process.argv.includes("--dry-run");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error(
    "Faltan variables NEXT_PUBLIC_FIREBASE_* en .env.local. Copia .env.example y complétalo."
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface SeedEvento {
  titulo: string;
  descripcion?: string;
  disciplina: Disciplina;
  responsable?: string;
  estado: Estado;
  tipo: Tipo;
  fecha: Date;
  horaInicio?: string | null;
  horaFin?: string | null;
  esStopper: boolean;
  notas?: string;
  enviado?: boolean;
}

function d(y: number, m: number, day: number): Date {
  return new Date(y, m - 1, day);
}

function addDays(base: Date, n: number): Date {
  const r = new Date(base);
  r.setDate(r.getDate() + n);
  return r;
}

const eventos: SeedEvento[] = [];

// ---------------------------------------------------------------------------
// 1. Comités de obra con contratistas (semanal, miércoles 8:30-9:00, salvo #0)
// ---------------------------------------------------------------------------
const FECHAS_COMITE: Date[] = [
  d(2026, 7, 22), // 0 - especial
  d(2026, 7, 29),
  d(2026, 8, 5),
  d(2026, 8, 12),
  d(2026, 8, 19),
  d(2026, 8, 26),
  d(2026, 9, 9),
  d(2026, 9, 16),
  d(2026, 9, 23),
  d(2026, 9, 30),
  d(2026, 10, 7),
  d(2026, 10, 14),
  d(2026, 10, 21),
  d(2026, 10, 28),
];

FECHAS_COMITE.forEach((fecha, i) => {
  const esComite0 = i === 0;
  eventos.push({
    titulo: esComite0 ? "Comité 0 · Ingreso contratista civil WTG" : `Comité de obra semanal #${i}`,
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "COMITE",
    fecha,
    horaInicio: esComite0 ? "08:00" : "08:30",
    horaFin: "09:00",
    esStopper: false,
    ...(esComite0 ? { notas: "Ingreso contratista civil WTG." } : {}),
  });
});

// Comité recurrente semanal (miércoles) desde el 04-nov-2026 en adelante.
// No hay motor de recurrencia real (ver comentario en src/lib/types.ts), así
// que se materializan ocurrencias concretas hacia adelante. Horizonte inicial:
// 12 semanas (~hasta finales de enero 2027); se puede volver a correr este
// script más adelante para extenderlo.
const COMITE_RECURRENTE_SEMANAS = 12;
let cursorComiteFuturo = d(2026, 11, 4);
for (let i = 0; i < COMITE_RECURRENTE_SEMANAS; i++) {
  eventos.push({
    titulo: "Comité de obra semanal",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "COMITE",
    fecha: addDays(cursorComiteFuturo, i * 7),
    horaInicio: "08:30",
    horaFin: "09:00",
    esStopper: false,
  });
}

// ---------------------------------------------------------------------------
// 2. Recepción / Aprobación de cortes de programación (quincenal)
// ---------------------------------------------------------------------------
const CORTES: { recepcion: Date; aprobacion: Date }[] = [
  { recepcion: d(2026, 8, 17), aprobacion: d(2026, 8, 21) },
  { recepcion: d(2026, 9, 7), aprobacion: d(2026, 9, 11) },
  { recepcion: d(2026, 9, 21), aprobacion: d(2026, 9, 25) },
  { recepcion: d(2026, 10, 5), aprobacion: d(2026, 10, 9) },
  { recepcion: d(2026, 10, 19), aprobacion: d(2026, 10, 23) },
];

for (const { recepcion, aprobacion } of CORTES) {
  eventos.push({
    titulo: "Recepción de corte de programación",
    disciplina: "TRANSVERSAL",
    responsable: "Contratistas",
    estado: "POR_HACER",
    tipo: "CORTE_PROGRAMACION",
    fecha: recepcion,
    esStopper: false,
  });
  eventos.push({
    titulo: "Aprobación de corte de programación",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "CORTE_PROGRAMACION",
    fecha: aprobacion,
    esStopper: false,
  });
}

// ---------------------------------------------------------------------------
// 3. Hitos de cronograma general (PASO 1..23) — PENDIENTE.
// Falta la lista real (nombre de paso, contratista, fecha de inicio).
// Agregarla aquí como un array de { titulo, disciplina, fecha } y hacer:
//   for (const h of HITOS_CRONOGRAMA) eventos.push({ ...h, tipo: "HITO_CRONOGRAMA", estado: "POR_HACER", esStopper: false });
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 4. Entregables al cliente (IT-07 + reunión de estandarización)
// ---------------------------------------------------------------------------
const PROYECTO_INICIO = d(2026, 7, 22);
const PROYECTO_FIN = d(2026, 10, 29);

function rangoDias(desde: Date, hasta: Date): Date[] {
  const dias: Date[] = [];
  let cur = new Date(desde);
  while (cur.getTime() <= hasta.getTime()) {
    dias.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return dias;
}

const DIAS_PROYECTO = rangoDias(PROYECTO_INICIO, PROYECTO_FIN);
const VIERNES_PROYECTO = DIAS_PROYECTO.filter((f) => f.getDay() === 5);
const LUNES_PROYECTO = DIAS_PROYECTO.filter((f) => f.getDay() === 1);

// Bitácora diaria: recordatorio de envío antes del mediodía del día siguiente.
for (const fecha of DIAS_PROYECTO) {
  eventos.push({
    titulo: "Entrega: Bitácora diaria",
    disciplina: "TRANSVERSAL",
    responsable: "Residente",
    estado: "POR_HACER",
    tipo: "ENTREGABLE",
    fecha,
    esStopper: false,
    notas: "Recordatorio: enviar antes del mediodía del día siguiente (día vencido).",
    enviado: false,
  });
}

// Reporte matutino diario.
for (const fecha of DIAS_PROYECTO) {
  eventos.push({
    titulo: "Entrega: Reporte matutino",
    descripcion: "Personal presente, actividades del día, novedades.",
    disciplina: "TRANSVERSAL",
    responsable: "Residente",
    estado: "POR_HACER",
    tipo: "ENTREGABLE",
    fecha,
    esStopper: false,
    enviado: false,
  });
}

// Informe semanal de programación (viernes, máximo sábado).
for (const fecha of VIERNES_PROYECTO) {
  eventos.push({
    titulo: "Entrega: Informe semanal de programación",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "ENTREGABLE",
    fecha,
    esStopper: false,
    notas: "Máximo sábado siguiente.",
    enviado: false,
  });
}

// PPT semanal de SST (mismo día que el informe de programación).
for (const fecha of VIERNES_PROYECTO) {
  eventos.push({
    titulo: "Entrega: PPT semanal de SST",
    disciplina: "SEGURIDAD",
    responsable: "SISO Obra",
    estado: "POR_HACER",
    tipo: "ENTREGABLE",
    fecha,
    esStopper: false,
    enviado: false,
  });
}

// Acta de comité de obra: 2 días después de cada comité ya cargado en la
// sección 1 (no se genera para el comité recurrente futuro sin fecha exacta
// de cierre de horizonte; se puede volver a correr este script para eso).
for (const fechaComite of FECHAS_COMITE) {
  eventos.push({
    titulo: "Entrega: Acta de comité de obra",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "ENTREGABLE",
    fecha: addDays(fechaComite, 2),
    esStopper: false,
    enviado: false,
  });
}

// Informe de control presupuestal (quincenal, cortes 15/30, entrega +3 días).
const CONTROL_PRESUPUESTAL: Date[] = [
  d(2026, 8, 18),
  d(2026, 9, 2),
  d(2026, 9, 18),
  d(2026, 10, 3),
  d(2026, 10, 18),
  d(2026, 11, 2),
];
for (const fecha of CONTROL_PRESUPUESTAL) {
  eventos.push({
    titulo: "Entrega: Informe de control presupuestal",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "ENTREGABLE",
    fecha,
    esStopper: false,
    enviado: false,
  });
}

// Informe semanal de avance fotográfico: PENDIENTE DE CONFIRMAR (no se está
// enviando actualmente en Belén y su vigencia está en duda).
for (const fecha of LUNES_PROYECTO) {
  eventos.push({
    titulo: "Entrega: Informe semanal de avance (fotográfico)",
    disciplina: "TRANSVERSAL",
    responsable: "Residente",
    estado: "POR_HACER",
    tipo: "ENTREGABLE",
    fecha,
    esStopper: false,
    notas: "PENDIENTE DE CONFIRMAR: no se está enviando actualmente en Belén; vigencia en duda.",
    enviado: false,
  });
}

// Informe S&SO: PENDIENTE DE CONFIRMAR periodicidad (mensual según IT-07,
// semanal según la reunión de estandarización). Se siembra mensual (fin de
// mes) como placeholder hasta que se resuelva la discrepancia.
const CIERRES_MES = [d(2026, 8, 31), d(2026, 9, 30), d(2026, 10, 30)];
for (const fecha of CIERRES_MES) {
  eventos.push({
    titulo: "Entrega: Informe S&SO",
    disciplina: "SEGURIDAD",
    responsable: "SISO Obra",
    estado: "POR_HACER",
    tipo: "ENTREGABLE",
    fecha,
    esStopper: false,
    notas: "PENDIENTE DE CONFIRMAR: periodicidad en disputa (mensual IT-07 vs. semanal según reunión).",
    enviado: false,
  });
}

// Informe final del proyecto (evento único, cierre de cronograma general).
eventos.push({
  titulo: "Entrega: Informe final del proyecto",
  disciplina: "TRANSVERSAL",
  responsable: "INP",
  estado: "POR_HACER",
  tipo: "ENTREGABLE",
  fecha: PROYECTO_FIN,
  esStopper: true,
  notas: "Fecha exacta por confirmar; se usa el cierre del cronograma general (29-oct-2026).",
  enviado: false,
});

// ---------------------------------------------------------------------------
async function run() {
  const porTipo = eventos.reduce<Record<string, number>>((acc, e) => {
    acc[e.tipo] = (acc[e.tipo] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Total de eventos a crear: ${eventos.length}`);
  console.table(porTipo);

  if (DRY_RUN) {
    console.log("\n--dry-run: no se escribió nada en Firestore. Primeros 5 eventos:");
    console.log(eventos.slice(0, 5));
    return;
  }

  const ref = collection(db, "tasks");
  let i = 0;
  for (const e of eventos) {
    const doc: Record<string, unknown> = {
      ...e,
      fecha: Timestamp.fromDate(e.fecha),
      recurrencia: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    for (const key of Object.keys(doc)) {
      if (doc[key] === undefined) delete doc[key];
    }
    await addDoc(ref, doc);
    i++;
    if (i % 25 === 0) console.log(`  ${i}/${eventos.length}...`);
  }
  console.log(`Listo. ${eventos.length} eventos creados en Firestore.`);
}

run().catch((err) => {
  console.error("Error al cargar eventos:", err);
  process.exit(1);
});
