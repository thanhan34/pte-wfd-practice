// Smart database wrapper that falls back to localStorage when Firebase is unavailable
import { Room, User } from '@/types';

// Try Firebase first, fallback to localStorage
let useFirebase = true;
let firestoreModule: any = null;
let fallbackModule: any = null;

// Initialize modules
async function initializeModules() {
  try {
    // Try to import Firebase module
    firestoreModule = await import('./firestore');
    
    // Test Firebase connection with timeout
    const connectionPromise = firestoreModule.authenticateUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firebase connection timeout')), 10000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    useFirebase = true;
    console.log('✅ Using Firebase for data storage');
  } catch (error) {
    console.warn('⚠️ Firebase not available, using localStorage fallback:', error instanceof Error ? error.message : 'Unknown error');
    useFirebase = false;
    fallbackModule = await import('./firestore-fallback');
    console.log('📦 Using localStorage fallback for data storage');
  }
}

// Initialize on first use
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await initializeModules();
    initialized = true;
  }
}

/**
 * Authenticate user
 */
export async function authenticateUser(): Promise<any> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.authenticateUser();
}

/**
 * Create a new room
 */
export async function createRoom(hostNickname: string): Promise<string> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.createRoom(hostNickname);
}

/**
 * Join an existing room
 */
export async function joinRoom(roomId: string, nickname: string): Promise<void> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.joinRoom(roomId, nickname);
}

/**
 * Set target phrase (host only)
 */
export async function setTargetPhrase(roomId: string, phrase: string, index?: number, audioUrl?: string): Promise<void> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.setTargetPhrase(roomId, phrase, index, audioUrl);
}

/**
 * Submit answer
 */
export async function submitAnswer(roomId: string, answer: string): Promise<void> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.submitAnswer(roomId, answer);
}

/**
 * Update typing status
 */
export async function updateTypingStatus(roomId: string, isTyping: boolean): Promise<void> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.updateTypingStatus(roomId, isTyping);
}

/**
 * Leave room
 */
export async function leaveRoom(roomId: string): Promise<void> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.leaveRoom(roomId);
}

/**
 * Subscribe to room updates
 */
export async function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): Promise<() => void> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.subscribeToRoom(roomId, callback);
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User | null> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.getCurrentUser();
}

/**
 * Toggle show phrase to participants (host only)
 */
export async function toggleShowPhraseToParticipants(roomId: string, show: boolean): Promise<void> {
  await ensureInitialized();
  const dbModule = useFirebase ? firestoreModule : fallbackModule;
  return dbModule.toggleShowPhraseToParticipants(roomId, show);
}

/**
 * Check if using Firebase or fallback
 */
export async function isUsingFirebase(): Promise<boolean> {
  await ensureInitialized();
  return useFirebase;
}
