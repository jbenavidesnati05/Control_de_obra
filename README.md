# FlowBoard

Tablero Kanban simple para el día a día de un rol de automatización
(Power Automate / n8n / IA): tareas administrativas y operativas — enviar
un correo, pedir accesos, agendar una reunión — no seguimiento de proyectos
de automatización como tal (eso vive en Azure DevOps). Login con Google,
cada usuario tiene su propio tablero aislado, datos en tiempo real sobre
Firestore.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Firebase Auth (Google) + Firestore (SDK Web modular v9+), tiempo real con `onSnapshot`
- `@dnd-kit` para el drag & drop y reorden del Kanban
- `lucide-react` para iconos

## 1. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilita **Firestore Database** (modo producción).
3. Habilita **Authentication → Sign-in method → Google**.
4. En **Authentication → Settings → Authorized domains**, agrega tu dominio
   de Vercel.
5. En **Configuración del proyecto → Tus apps**, crea una app web y copia las
   credenciales (`apiKey`, `authDomain`, `projectId`, etc.).
6. Publica las reglas de seguridad de este repo (`firestore.rules`):
   ```bash
   firebase deploy --only firestore:rules
   ```
   Cada usuario solo puede leer/escribir su propio espacio
   (`users/{uid}/tasks`).

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

Abre [http://localhost:3000](http://localhost:3000) (redirige a `/tareas`,
pide iniciar sesión con Google).

## 4. Datos de ejemplo

No hay script de seed por línea de comandos (las reglas de Firestore exigen
sesión, así que un script sin login no puede escribir). En su lugar, con el
tablero vacío aparece un botón **"Cargar ejemplos"** que crea 5 tareas de
muestra usando tu propia sesión autenticada (ver `src/lib/seedData.ts`).

## Modelo de datos

Colección `users/{uid}/tasks`, un documento por tarea:

```
task {
  titulo:        string
  notas?:        string
  estado:        'BACKLOG'|'ANALISIS'|'EN_PROCESO'|'CERRADA'
  prioridad:     'ALTA'|'MEDIA'|'BAJA'
  fecha?:        Timestamp
  orden:         number           (posición manual dentro de la columna)
  puntaje:       number           (50 por defecto, suma al llegar a Cerrada)
  completadaEn?: Timestamp        (decide a qué semana se abona el puntaje)
  createdAt:     Timestamp (serverTimestamp)
  updatedAt:     Timestamp (serverTimestamp)
}
```

## 5. Desplegar en Vercel

1. Sube el repo a GitHub.
2. En Vercel: **Import Project** desde GitHub.
3. En **Settings → Environment Variables**, agrega las mismas claves
   `NEXT_PUBLIC_FIREBASE_*` de tu `.env.local` (sin marcarlas "Sensitive":
   esas se inyectan solo en runtime, no en el build, y `NEXT_PUBLIC_*`
   necesita estar disponible durante el build).
4. Deploy.
5. Confirma en Firebase Console que el dominio de Vercel esté en
   **Authentication → Settings → Authorized domains** y que las reglas de
   Firestore estén publicadas.

## Estructura del proyecto

```
src/
  app/
    tareas/page.tsx         Vista de kanban (única página de la app)
    layout.tsx, page.tsx    page.tsx redirige a /tareas
  components/
    auth/                   Login con Google, gate de autenticación
    kanban/                 Tablero, columnas, tarjetas, filtros, puntaje semanal
    tasks/                  Formulario de tarea (crear/editar), confirmación de borrado
    layout/                 Encabezado
    ui/                     Primitivas (modal, confirm dialog)
  hooks/
    useAuth.tsx             Sesión de Google
    useTasks.tsx            Suscripción en tiempo real a Firestore
  lib/
    firebase.ts             Singleton de inicialización de Firebase (auth + firestore)
    tasks.ts                CRUD sobre users/{uid}/tasks
    automatizacion.ts       Labels y colores por estado/prioridad
    taskStatus.ts           Vencida / estancamiento (días sin avanzar)
    puntaje.ts              Agregación semanal de puntos
    seedData.ts             5 tareas de ejemplo
    types.ts, utils.ts
firestore.rules
```
