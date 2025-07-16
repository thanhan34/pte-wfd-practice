import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC7LWF3rfk0K8l5BTjAxjHSmQotkOlJIt4",
  authDomain: "wfdpracticeroom.firebaseapp.com",
  projectId: "wfdpracticeroom",
  storageBucket: "wfdpracticeroom.firebasestorage.app",
  messagingSenderId: "998166005854",
  appId: "1:998166005854:web:c0a2e365b5d0cd6c4b0ccf",
  measurementId: "G-2Z5WQPZK2R"
};

// Initialize Firebase
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
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export { db, auth };
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
