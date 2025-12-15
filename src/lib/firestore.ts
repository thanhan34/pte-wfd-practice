import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  deleteField,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { signInAnonymously, User as FirebaseUser } from 'firebase/auth';
import { db, auth, checkFirebaseConnection } from './firebase';
import { Room, ParticipantData, User } from '@/types';
import { generateRoomId, calculateAccuracy } from './utils';

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to retry operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`Operation attempt ${i + 1} failed:`, error.message);
      
      if (i === attempts - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
  throw new Error('All retry attempts failed');
}

/**
 * Convert Firestore timestamp to Date
 */
function timestampToDate(timestamp: any): Date {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date();
}

/**
 * Convert Firestore document to Room object
 */
function documentToRoom(doc: QueryDocumentSnapshot<DocumentData>): Room {
  const data = doc.data();
  return {
    id: doc.id,
    hostId: data.hostId,
    targetPhrase: data.targetPhrase || '',
    audioUrl: data.audioUrl,
    createdAt: timestampToDate(data.createdAt),
    isActive: data.isActive || false,
    participants: data.participants || {},
    countdownStartedAt: data.countdownStartedAt ? timestampToDate(data.countdownStartedAt) : undefined,
    isCountingDown: data.isCountingDown || false,
    roundStartTime: data.roundStartTime ? timestampToDate(data.roundStartTime) : undefined,
    currentPhraseIndex: data.currentPhraseIndex,
    shouldPlayAudio: data.shouldPlayAudio || false,
    showPhraseToParticipants: data.showPhraseToParticipants || false
  };
}

/**
 * Authenticate user anonymously
 */
export async function authenticateUser(): Promise<FirebaseUser> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Failed to authenticate user');
  }
}

/**
 * Create a new room
 */
export async function createRoom(hostNickname: string): Promise<string> {
  return retryOperation(async () => {
    // Check Firebase connection first
    const isConnected = await checkFirebaseConnection();
    if (!isConnected) {
      throw new Error('Firebase connection failed');
    }

    const user = await authenticateUser();
    const roomId = generateRoomId();
    
    const roomData: Omit<Room, 'id'> = {
      hostId: user.uid,
      targetPhrase: '',
      createdAt: new Date(),
      isActive: true,
      participants: {
        [user.uid]: {
          nickname: hostNickname,
          status: 'waiting',
          isTyping: false,
          correctCount: 0,
          totalAttempts: 0
        }
      }
    };

    await setDoc(doc(db, 'rooms', roomId), {
      ...roomData,
      createdAt: serverTimestamp()
    });

    console.log(`✅ Room ${roomId} created successfully`);
    return roomId;
  });
}

/**
 * Join an existing room
 */
export async function joinRoom(roomId: string, nickname: string): Promise<void> {
  try {
    const user = await authenticateUser();
    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (!roomData.isActive) {
      throw new Error('Room is not active');
    }

    // Add participant to room
    const updatedParticipants = {
      ...roomData.participants,
      [user.uid]: {
        nickname,
        status: 'waiting',
        isTyping: false,
        correctCount: 0,
        totalAttempts: 0
      }
    };

    await updateDoc(roomRef, {
      participants: updatedParticipants
    });
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
}

/**
 * Set target phrase (host only)
 */
export async function setTargetPhrase(roomId: string, phrase: string, index?: number, audioUrl?: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can set target phrase');
    }

    // Reset only specific fields, preserve submissionHistory
    const updateData: any = {
      targetPhrase: phrase,
      isCountingDown: true,
      countdownStartedAt: serverTimestamp()
    };

    // If audioUrl is provided, add it to update data
    if (audioUrl) {
      updateData.audioUrl = audioUrl;
    } else {
      // Clear audioUrl if no audio provided
      updateData.audioUrl = deleteField();
    }

    // If index is provided, update currentPhraseIndex
    if (index !== undefined) {
      updateData.currentPhraseIndex = index;
    }

    // Reset each participant's status individually without touching submissionHistory
    const participantUpdates: { [key: string]: any } = {};
    const fieldsToDelete: { [key: string]: any } = {};
    
    Object.entries(roomData.participants).forEach(([userId, participant]: [string, any]) => {
      console.log(`🔍 RESET PARTICIPANT ${participant.nickname}:`);
      console.log('Before reset - submissionHistory:', participant.submissionHistory);
      console.log('Before reset - submissionHistory length:', participant.submissionHistory?.length || 0);
      
      // Only update status-related fields, keep everything else intact
      participantUpdates[`participants.${userId}.status`] = 'waiting';
      participantUpdates[`participants.${userId}.isTyping`] = false;
      
      // Add fields to delete at top level
      if (participant.submission !== undefined) {
        fieldsToDelete[`participants.${userId}.submission`] = deleteField();
      }
      if (participant.accuracy !== undefined) {
        fieldsToDelete[`participants.${userId}.accuracy`] = deleteField();
      }
      if (participant.submittedAt !== undefined) {
        fieldsToDelete[`participants.${userId}.submittedAt`] = deleteField();
      }
    });

    // Combine all updates
    const allUpdates = { ...updateData, ...participantUpdates };

    // First update the basic data with countdown and participant status
    await updateDoc(roomRef, allUpdates);

    // Then delete the fields if there are any to delete
    if (Object.keys(fieldsToDelete).length > 0) {
      await updateDoc(roomRef, fieldsToDelete);
    }

    // After 3 seconds, stop countdown and allow input
    setTimeout(async () => {
      try {
        await updateDoc(roomRef, {
          isCountingDown: false,
          roundStartTime: serverTimestamp()
        });
      } catch (error) {
        console.error('Error stopping countdown:', error);
      }
    }, 3000);
  } catch (error) {
    console.error('Error setting target phrase:', error);
    throw error;
  }
}

/**
 * Submit answer
 */
export async function submitAnswer(roomId: string, answer: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    const targetPhrase = roomData.targetPhrase;

    if (!targetPhrase) {
      throw new Error('No target phrase set');
    }

    // Calculate accuracy
    const accuracy = calculateAccuracy(targetPhrase, answer);
    
    const currentParticipant = roomData.participants[user.uid];
    const newCorrectCount = accuracy.isFullyCorrect 
      ? (currentParticipant.correctCount || 0) + 1 
      : (currentParticipant.correctCount || 0);
    const newTotalAttempts = (currentParticipant.totalAttempts || 0) + 1;

    // Calculate completion time if correct
    let updatedTimeData = {};
    if (accuracy.isFullyCorrect && roomData.roundStartTime) {
      const completionTime = Date.now() - timestampToDate(roomData.roundStartTime).getTime();
      const currentTimes = currentParticipant.completionTimes || [];
      const newCompletionTimes = [...currentTimes, completionTime];
      
      updatedTimeData = {
        completionTimes: newCompletionTimes,
        averageTime: newCompletionTimes.reduce((sum, time) => sum + time, 0) / newCompletionTimes.length,
        fastestTime: Math.min(...newCompletionTimes)
      };
    }

    // Create submission history entry
    const submissionEntry = {
      phrase: targetPhrase,
      answer: answer,
      accuracy,
      submittedAt: new Date(),
      phraseIndex: roomData.currentPhraseIndex
    };

    // Update submission history
    const currentHistory = currentParticipant.submissionHistory || [];
    const updatedHistory = [...currentHistory, submissionEntry];
    
    // Debug logs
    console.log('🔍 FIRESTORE SUBMIT DEBUG:');
    console.log('Current history length:', currentHistory.length);
    console.log('Current history:', currentHistory);
    console.log('New submission:', submissionEntry);
    console.log('Updated history length:', updatedHistory.length);
    console.log('Updated history:', updatedHistory);

    // Update participant data
    const updatedParticipants = {
      ...roomData.participants,
      [user.uid]: {
        ...roomData.participants[user.uid],
        status: 'submitted',
        submission: answer,
        accuracy,
        submittedAt: serverTimestamp(),
        isTyping: false,
        correctCount: newCorrectCount,
        totalAttempts: newTotalAttempts,
        submissionHistory: updatedHistory,
        ...updatedTimeData
      }
    };

    await updateDoc(roomRef, {
      participants: updatedParticipants
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Update typing status
 */
export async function updateTypingStatus(roomId: string, isTyping: boolean): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const roomData = roomDoc.data();
    const participant = roomData.participants[user.uid];

    if (!participant || participant.status === 'submitted') return;

    const updatedParticipants = {
      ...roomData.participants,
      [user.uid]: {
        ...participant,
        status: isTyping ? 'typing' : 'waiting',
        isTyping
      }
    };

    await updateDoc(roomRef, {
      participants: updatedParticipants
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
}

/**
 * Leave room
 */
export async function leaveRoom(roomId: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) return;

    const roomData = roomDoc.data();
    const updatedParticipants = { ...roomData.participants };
    delete updatedParticipants[user.uid];

    // If host leaves, delete the entire room
    if (roomData.hostId === user.uid) {
      await deleteDoc(roomRef);
      console.log(`✅ Room ${roomId} deleted (host left)`);
    } else {
      await updateDoc(roomRef, {
        participants: updatedParticipants
      });
    }
  } catch (error) {
    console.error('Error leaving room:', error);
  }
}

/**
 * Delete room (host only)
 */
export async function deleteRoom(roomId: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can delete room');
    }

    await deleteDoc(roomRef);
    console.log(`✅ Room ${roomId} deleted`);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}

/**
 * Subscribe to room updates
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  const roomRef = doc(db, 'rooms', roomId);
  
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      const room = documentToRoom(doc as QueryDocumentSnapshot<DocumentData>);
      callback(room);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to room updates:', error);
    callback(null);
  });
}

/**
 * Toggle show phrase to participants (host only)
 */
export async function toggleShowPhraseToParticipants(roomId: string, show: boolean): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    if (roomData.hostId !== user.uid) {
      throw new Error('Only host can toggle phrase visibility');
    }

    await updateDoc(roomRef, {
      showPhraseToParticipants: show
    });
  } catch (error) {
    console.error('Error toggling phrase visibility:', error);
    throw error;
  }
}

/**
 * Get current user info
 */
export function getCurrentUser(): User | null {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  return {
    id: firebaseUser.uid,
    nickname: '', // Will be set from room data
    isHost: false, // Will be determined from room data
    joinedAt: new Date()
  };
}
