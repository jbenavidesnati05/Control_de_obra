import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Sin projectId, Firestore genera paths como "projects//databases/..." y entra
// en un loop infinito de reintentos silenciosos en vez de fallar. Preferimos
// un error explícito apuntando a la variable de entorno faltante.
if (!firebaseConfig.projectId) {
  throw new Error(
    "Falta NEXT_PUBLIC_FIREBASE_PROJECT_ID (y posiblemente otras NEXT_PUBLIC_FIREBASE_*). " +
      "Configura las variables de entorno de Firebase antes de compilar/desplegar."
  );
}

// Evita reinicializar la app de Firebase en cada render / HMR.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createFirestore() {
  // En el servidor (SSR) no existe IndexedDB: usamos el cliente por defecto,
  // que de todas formas nunca llega a consultar datos ahí (onSnapshot solo
  // corre en el navegador, dentro de useEffect).
  if (typeof window === "undefined") {
    return getFirestore(firebaseApp);
  }
  try {
    // Caché local en IndexedDB: las cargas siguientes (y la navegación entre
    // /calendario y /tareas) muestran datos al instante desde disco mientras
    // Firestore sincroniza en segundo plano, en vez de esperar la red cada vez.
    // tabManager multi-pestaña: sin esto, abrir la app en una segunda pestaña
    // deja a esa pestaña sin poder tomar el candado de IndexedDB, y cualquier
    // escritura (crear/eliminar tarea) se queda colgada sin resolver ni fallar.
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Ya se inicializó antes (HMR) o el navegador no soporta IndexedDB.
    return getFirestore(firebaseApp);
  }
}

export const db = createFirestore();
