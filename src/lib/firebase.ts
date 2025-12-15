import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Primary Firebase Configuration (Practice Room)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Secondary Firebase Configuration (PTE Shadowing)
const secondaryFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_APP_ID,
};

// Initialize Primary Firebase
let app: any = null;
let db: any = null;
let auth: any = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  db = getFirestore(app);
  auth = getAuth(app);
  
  // Enable offline persistence
  if (typeof window !== 'undefined') {
    // Only run in browser environment
    import('firebase/firestore').then(({ enableNetwork, disableNetwork }) => {
      // Enable network by default
      enableNetwork(db).catch(console.warn);
    });
  }
  
  console.log('✅ Primary Firebase initialized successfully');
} catch (error) {
  console.error('❌ Primary Firebase initialization failed:', error);
  throw error;
}

// Initialize Secondary Firebase
let secondaryApp: any = null;
let secondaryDb: any = null;

try {
  secondaryApp = initializeApp(secondaryFirebaseConfig, 'secondary');
  
  // Initialize Firestore for secondary app
  secondaryDb = getFirestore(secondaryApp);
  
  // Enable offline persistence for secondary db
  if (typeof window !== 'undefined') {
    import('firebase/firestore').then(({ enableNetwork }) => {
      enableNetwork(secondaryDb).catch(console.warn);
    });
  }
  
  console.log('✅ Secondary Firebase initialized successfully');
} catch (error) {
  console.error('❌ Secondary Firebase initialization failed:', error);
  throw error;
}

export { db, auth, secondaryDb };
export default app;

// Helper function to check Firebase connection
export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    if (!auth) return false;
    
    // Try to get current auth state
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(
        () => {
          unsubscribe();
          resolve(true);
        },
        () => {
          unsubscribe();
          resolve(false);
        }
      );
      
      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 5000);
    });
  } catch (error) {
    console.error('Firebase connection check failed:', error);
    return false;
  }
}
