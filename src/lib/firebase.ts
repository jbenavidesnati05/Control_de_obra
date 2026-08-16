import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({}),
    });
  } catch {
    // Ya se inicializó antes (HMR) o el navegador no soporta IndexedDB.
    return getFirestore(firebaseApp);
  }
}

export const db = createFirestore();
