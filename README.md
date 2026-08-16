# ObraControl

MVP para que un interventor de obra lleve el orden de un proyecto de
interventoría electromecánica (remodelación de tienda retail): calendario de
obra y tablero de tareas (Kanban) por disciplina, con datos en tiempo real
sobre Firestore.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Firebase / Firestore (SDK Web modular v9+), tiempo real con `onSnapshot`
- `@dnd-kit` para el drag & drop del Kanban
- `lucide-react` para iconos

## 1. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilita **Firestore Database** (modo producción o de prueba).
3. En **Configuración del proyecto → Tus apps**, crea una app web y copia las
   credenciales (`apiKey`, `authDomain`, `projectId`, etc.).
4. Publica las reglas de seguridad de este repo (`firestore.rules`) desde la
   consola de Firebase o con la CLI:
   ```bash
   firebase deploy --only firestore:rules
   ```
   Las reglas del MVP dejan la colección `tasks` abierta a lectura/escritura
   (sin login). El archivo incluye, comentado, el cambio a aplicar cuando se
   habilite Firebase Auth en una fase posterior.

## 2. Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores con los de tu
proyecto de Firebase:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

`.env.local` está en `.gitignore` — nunca se sube al repositorio.

## 3. Correr en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) (redirige a
`/calendario`).

## 4. Cargar datos de ejemplo (seed)

Con `.env.local` ya configurado:

```bash
npm run seed
```

Esto crea ~20 tareas repartidas por disciplina y estado, más eventos
recurrentes típicos (comité semanal los miércoles, corte de obra quincenal,
informe de contratistas los viernes) en la colección `tasks` de Firestore.

## Modelo de datos

Colección `tasks`, un documento por tarea/evento/solicitud:

```
task {
  titulo:       string
  descripcion?: string
  disciplina:   'ELECTRICO'|'HVAC'|'RCI'|'HIDROSANITARIO'|'GAS'|'RED_FRIO'
                |'ILUMINACION'|'CIVIL'|'SEGURIDAD'|'TRANSVERSAL'
  responsable?: string
  estado:       'POR_HACER'|'EN_TRAMITE'|'HECHO'
  tipo:         'TAREA'|'EVENTO'|'SOLICITUD'
  fecha?:       Timestamp
  esStopper:    boolean
  notas?:       string
  createdAt:    Timestamp (serverTimestamp)
  updatedAt:    Timestamp (serverTimestamp)
}
```

La misma tarea se ve en el **Calendario** (por `fecha`) y en el **Kanban**
(por `estado`), y ambas vistas se actualizan en tiempo real vía `onSnapshot`.

## 5. Desplegar en Vercel

1. Sube el repo a GitHub.
2. En Vercel: **Import Project** desde GitHub.
3. En **Settings → Environment Variables**, agrega las mismas claves
   `NEXT_PUBLIC_FIREBASE_*` de tu `.env.local`.
4. Deploy — no hay migraciones ni pooling que configurar (Firestore es
   serverless).
5. En Firebase Console, agrega el dominio de Vercel (`*.vercel.app` o tu
   dominio propio) a **Authentication → Settings → Authorized domains** (útil
   desde ya para cuando se habilite Auth) y confirma que las reglas de
   Firestore estén publicadas.

## Estructura del proyecto

```
src/
  app/
    calendario/page.tsx   Vista de calendario (mes/semana)
    tareas/page.tsx        Vista de kanban
    layout.tsx, page.tsx
  components/
    calendar/               Grilla mensual/semanal, panel del día, leyenda
    kanban/                 Columnas, tarjetas, filtros
    tasks/                  Formulario de tarea (crear/editar), chip de disciplina
    layout/                 Encabezado y navegación
    ui/                     Primitivas (modal)
  hooks/useTasks.ts         Suscripción en tiempo real a Firestore
  lib/
    firebase.ts             Singleton de inicialización de Firebase
    tasks.ts                CRUD sobre la colección "tasks"
    disciplinas.ts           Paleta y metadatos por disciplina
    types.ts, utils.ts, calendarUtils.ts
scripts/seed.ts             Script de datos de ejemplo
firestore.rules
```

## Próximas fases (terreno preparado, sin implementar)

- **Firebase Auth**: multi-usuario / multi-interventor. Ver comentario en
  `firestore.rules` con la regla a activar.
- **Eventos recurrentes automáticos**: hoy el seed genera ocurrencias
  puntuales; una fase futura podría generarlas dinámicamente o con Cloud
  Functions.
- **Alertas por correo** (tareas por vencer / vencidas).
- **Importar cronograma desde Excel**.
