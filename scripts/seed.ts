/**
 * Carga datos de ejemplo en Firestore para que la app se vea "diciente" al abrir.
 * Uso: npm run seed
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import type { Disciplina, Estado, Recurrencia, Tipo } from "../src/lib/types";

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

interface SeedTask {
  titulo: string;
  descripcion?: string;
  disciplina: Disciplina;
  responsable?: string;
  estado: Estado;
  tipo: Tipo;
  fecha?: Date | null;
  esStopper: boolean;
  recurrencia?: Recurrencia;
  notas?: string;
}

const hoy = new Date();

function diasDesdeHoy(n: number): Date {
  const d = new Date(hoy);
  d.setDate(d.getDate() + n);
  return d;
}

// Próxima fecha con un día de la semana dado (0=domingo..6=sábado), moviéndose hacia adelante.
function proximoDiaSemana(desde: Date, diaSemana: number): Date {
  const d = new Date(desde);
  const delta = (diaSemana - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);
  return d;
}

const tareas: SeedTask[] = [
  // ELECTRICO
  {
    titulo: "Solicitar planos eléctricos actualizados",
    descripcion: "Pedir al contratista los planos as-built de tablero general.",
    disciplina: "ELECTRICO",
    responsable: "Contratista Eléctrico",
    estado: "POR_HACER",
    tipo: "SOLICITUD",
    fecha: diasDesdeHoy(-2),
    esStopper: true,
    notas: "Vencida: reiterar por correo y escalar con INP.",
  },
  {
    titulo: "Revisar cargas del tablero general TG-1",
    disciplina: "ELECTRICO",
    responsable: "INP",
    estado: "EN_GESTION",
    tipo: "TAREA",
    fecha: diasDesdeHoy(3),
    esStopper: false,
  },
  {
    titulo: "Aprobar protocolo de pruebas de tablero",
    disciplina: "ELECTRICO",
    responsable: "Éxito",
    estado: "CERRADA",
    tipo: "TAREA",
    fecha: diasDesdeHoy(-5),
    esStopper: false,
  },

  // HVAC
  {
    titulo: "Revisar ficha técnica de unidades HVAC",
    disciplina: "HVAC",
    responsable: "Contratista HVAC",
    estado: "EN_ANALISIS",
    tipo: "TAREA",
    fecha: diasDesdeHoy(2),
    esStopper: false,
  },
  {
    titulo: "Coordinar izaje de unidad condensadora",
    disciplina: "HVAC",
    responsable: "Contratista HVAC",
    estado: "POR_HACER",
    tipo: "TAREA",
    fecha: diasDesdeHoy(6),
    esStopper: true,
    notas: "Requiere corte de obra y grúa. Confirmar con seguridad.",
  },

  // RCI
  {
    titulo: "Coordinar prueba de sistema contra incendio",
    disciplina: "RCI",
    responsable: "Contratista RCI",
    estado: "POR_HACER",
    tipo: "TAREA",
    fecha: diasDesdeHoy(4),
    esStopper: true,
    notas: "Stopper para entrega: sin prueba de RCI no hay certificado de ocupación.",
  },
  {
    titulo: "Recibir certificado de recarga de extintores",
    disciplina: "RCI",
    responsable: "Contratista RCI",
    estado: "EN_GESTION",
    tipo: "SOLICITUD",
    fecha: diasDesdeHoy(1),
    esStopper: false,
  },

  // HIDROSANITARIO
  {
    titulo: "Verificar punto de conexión hidrosanitario cocina",
    disciplina: "HIDROSANITARIO",
    responsable: "Natali",
    estado: "HECHA",
    tipo: "TAREA",
    fecha: diasDesdeHoy(-7),
    esStopper: false,
  },
  {
    titulo: "Revisar prueba de presión de red hidráulica",
    disciplina: "HIDROSANITARIO",
    responsable: "Contratista Hidrosanitario",
    estado: "EN_ANALISIS",
    tipo: "TAREA",
    fecha: diasDesdeHoy(5),
    esStopper: false,
  },

  // GAS
  {
    titulo: "Solicitar certificado de instalación de gas",
    disciplina: "GAS",
    responsable: "Contratista Gas",
    estado: "POR_HACER",
    tipo: "SOLICITUD",
    fecha: diasDesdeHoy(-1),
    esStopper: true,
    notas: "Vencida. Es stopper para habilitar zona de cafetería.",
  },

  // RED_FRIO
  {
    titulo: "Inspeccionar tendido de tubería de red de frío",
    disciplina: "RED_FRIO",
    responsable: "Contratista Red de Frío",
    estado: "EN_GESTION",
    tipo: "TAREA",
    fecha: diasDesdeHoy(3),
    esStopper: false,
  },
  {
    titulo: "Validar prueba de vacío en muebles refrigerados",
    disciplina: "RED_FRIO",
    responsable: "Contratista Red de Frío",
    estado: "POR_HACER",
    tipo: "TAREA",
    fecha: diasDesdeHoy(8),
    esStopper: false,
  },

  // ILUMINACION
  {
    titulo: "Aprobar muestra de luminarias LED",
    disciplina: "ILUMINACION",
    responsable: "Éxito",
    estado: "CERRADA",
    tipo: "TAREA",
    fecha: diasDesdeHoy(-10),
    esStopper: false,
  },
  {
    titulo: "Definir niveles de iluminancia en zona de cajas",
    disciplina: "ILUMINACION",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "TAREA",
    fecha: diasDesdeHoy(7),
    esStopper: false,
  },

  // CIVIL
  {
    titulo: "Verificar acabados de piso en zona de cajas",
    disciplina: "CIVIL",
    responsable: "Contratista Civil",
    estado: "POR_HACER",
    tipo: "TAREA",
    fecha: diasDesdeHoy(2),
    esStopper: false,
  },
  {
    titulo: "Recibir cielo raso zona de bodega",
    disciplina: "CIVIL",
    responsable: "Contratista Civil",
    estado: "EN_GESTION",
    tipo: "TAREA",
    fecha: diasDesdeHoy(-3),
    esStopper: false,
  },

  // SEGURIDAD
  {
    titulo: "Revisar señalización de seguridad temporal",
    disciplina: "SEGURIDAD",
    responsable: "SISO Obra",
    estado: "EN_ANALISIS",
    tipo: "TAREA",
    fecha: diasDesdeHoy(1),
    esStopper: false,
  },
  {
    titulo: "Auditar permisos de trabajo en alturas",
    disciplina: "SEGURIDAD",
    responsable: "SISO Obra",
    estado: "POR_HACER",
    tipo: "TAREA",
    fecha: diasDesdeHoy(4),
    esStopper: true,
  },

  // TRANSVERSAL
  {
    titulo: "Actualizar cronograma general de obra",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "TAREA",
    fecha: diasDesdeHoy(0),
    esStopper: false,
  },
  {
    titulo: "Consolidar acta de comité anterior",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "CERRADA",
    tipo: "TAREA",
    fecha: diasDesdeHoy(-4),
    esStopper: false,
  },
];

// Eventos recurrentes típicos: comité semanal (miércoles), corte de obra
// quincenal, informe de contratistas (viernes). Se generan las próximas
// ocurrencias para que el calendario se vea poblado desde hoy.
const eventos: SeedTask[] = [];

const MIERCOLES = 3;
const VIERNES = 5;

const comite = proximoDiaSemana(hoy, MIERCOLES);
for (let i = 0; i < 4; i++) {
  const fecha = new Date(comite);
  fecha.setDate(fecha.getDate() + i * 7);
  eventos.push({
    titulo: "Comité semanal de obra",
    descripcion: "Seguimiento general de avance con todas las disciplinas.",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "EVENTO",
    fecha,
    esStopper: false,
    recurrencia: "SEMANAL",
  });
}

const informe = proximoDiaSemana(hoy, VIERNES);
for (let i = 0; i < 4; i++) {
  const fecha = new Date(informe);
  fecha.setDate(fecha.getDate() + i * 7);
  eventos.push({
    titulo: "Informe de contratistas",
    descripcion: "Entrega de avance semanal de cada contratista.",
    disciplina: "TRANSVERSAL",
    responsable: "Contratistas",
    estado: "POR_HACER",
    tipo: "EVENTO",
    fecha,
    esStopper: false,
    recurrencia: "SEMANAL",
  });
}

const corteBase = diasDesdeHoy(2);
for (let i = 0; i < 3; i++) {
  const fecha = new Date(corteBase);
  fecha.setDate(fecha.getDate() + i * 14);
  eventos.push({
    titulo: "Corte de obra quincenal",
    descripcion: "Corte de cantidades y avance para acta quincenal.",
    disciplina: "TRANSVERSAL",
    responsable: "INP",
    estado: "POR_HACER",
    tipo: "EVENTO",
    fecha,
    esStopper: false,
    recurrencia: "QUINCENAL",
  });
}

async function seed() {
  const ref = collection(db, "tasks");
  const todos = [...tareas, ...eventos];
  console.log(`Creando ${todos.length} documentos en la colección "tasks"...`);

  for (const t of todos) {
    await addDoc(ref, {
      ...t,
      fecha: t.fecha ? Timestamp.fromDate(t.fecha) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  console.log("Listo. Datos de ejemplo cargados en Firestore.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error al cargar datos de ejemplo:", err);
  process.exit(1);
});
