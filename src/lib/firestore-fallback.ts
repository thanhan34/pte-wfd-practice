import { Room, ParticipantData, User } from '@/types';
import { generateRoomId, calculateAccuracy } from './utils';

// Local storage keys
const ROOMS_KEY = 'wfd_rooms';
const CURRENT_USER_KEY = 'wfd_current_user';

// In-memory storage for real-time updates
let roomsData: Record<string, Room> = {};
let currentUser: User | null = null;
let listeners: Record<string, ((room: Room | null) => void)[]> = {};

// Load data from localStorage
function loadFromStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(ROOMS_KEY);
    if (stored) {
      roomsData = JSON.parse(stored);
    }
    
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
  } catch (error) {
    console.warn('Error loading from localStorage:', error);
  }
}

// Save data to localStorage
function saveToStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(roomsData));
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    }
  } catch (error) {
    console.warn('Error saving to localStorage:', error);
  }
}

// Notify listeners
function notifyListeners(roomId: string) {
  const room = roomsData[roomId] || null;
  const roomListeners = listeners[roomId] || [];
  roomListeners.forEach(callback => callback(room));
}

// Generate a simple user ID
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Authenticate user (fallback)
 */
export async function authenticateUser(): Promise<User> {
  loadFromStorage();
  
  if (!currentUser) {
    currentUser = {
      id: generateUserId(),
      nickname: '',
      isHost: false,
      joinedAt: new Date()
    };
    saveToStorage();
  }
  
  return currentUser;
}

/**
 * Create a new room (fallback)
 */
export async function createRoom(hostNickname: string): Promise<string> {
  const user = await authenticateUser();
  const roomId = generateRoomId();
  
  const room: Room = {
    id: roomId,
    hostId: user.id,
    targetPhrase: '',
    createdAt: new Date(),
    isActive: true,
    participants: {
      [user.id]: {
        nickname: hostNickname,
        status: 'waiting',
        isTyping: false,
        correctCount: 0,
        totalAttempts: 0
      }
    },
    isCountingDown: false,
    currentPhraseIndex: 0,
    shouldPlayAudio: false
  };

  roomsData[roomId] = room;
  saveToStorage();
  notifyListeners(roomId);

  return roomId;
}

/**
 * Join an existing room (fallback)
 */
export async function joinRoom(roomId: string, nickname: string): Promise<void> {
  loadFromStorage();
  const user = await authenticateUser();
  
  const room = roomsData[roomId];
  if (!room) {
    throw new Error('Room not found');
  }

  if (!room.isActive) {
    throw new Error('Room is not active');
  }

  // Add participant to room
  room.participants[user.id] = {
    nickname,
    status: 'waiting',
    isTyping: false,
    correctCount: 0,
    totalAttempts: 0
  };

  roomsData[roomId] = room;
  saveToStorage();
  notifyListeners(roomId);
}

/**
 * Set target phrase (fallback)
 */
export async function setTargetPhrase(roomId: string, phrase: string): Promise<void> {
  loadFromStorage();
  const user = await authenticateUser();
  
  const room = roomsData[roomId];
  if (!room) {
    throw new Error('Room not found');
  }

  if (room.hostId !== user.id) {
    throw new Error('Only host can set target phrase');
  }

  // Reset all participants' status when setting new phrase
  Object.keys(room.participants).forEach(userId => {
    const participant = room.participants[userId];
    room.participants[userId] = {
      ...participant,
      status: 'waiting',
      isTyping: false,
      submission: undefined,
      accuracy: undefined,
      submittedAt: undefined
    };
  });

  room.targetPhrase = phrase;
  room.isCountingDown = true;
  room.countdownStartedAt = new Date();
  roomsData[roomId] = room;
  saveToStorage();
  notifyListeners(roomId);

  // After 3 seconds, stop countdown and set round start time
  setTimeout(() => {
    const currentRoom = roomsData[roomId];
    if (currentRoom) {
      currentRoom.isCountingDown = false;
      currentRoom.roundStartTime = new Date();
      roomsData[roomId] = currentRoom;
      saveToStorage();
      notifyListeners(roomId);
    }
  }, 3000);
}

/**
 * Submit answer (fallback)
 */
export async function submitAnswer(roomId: string, answer: string): Promise<void> {
  loadFromStorage();
  const user = await authenticateUser();
  
  const room = roomsData[roomId];
  if (!room) {
    throw new Error('Room not found');
  }

  const targetPhrase = room.targetPhrase;
  if (!targetPhrase) {
    throw new Error('No target phrase set');
  }

  // Calculate accuracy
  const accuracy = calculateAccuracy(targetPhrase, answer);
  
  const currentParticipant = room.participants[user.id];
  const newCorrectCount = accuracy.isFullyCorrect 
    ? (currentParticipant.correctCount || 0) + 1 
    : (currentParticipant.correctCount || 0);
  const newTotalAttempts = (currentParticipant.totalAttempts || 0) + 1;

  // Calculate completion time if correct
  let updatedTimeData = {};
  if (accuracy.isFullyCorrect && room.roundStartTime) {
    const completionTime = Date.now() - room.roundStartTime.getTime();
    const currentTimes = currentParticipant.completionTimes || [];
    const newCompletionTimes = [...currentTimes, completionTime];
    
    updatedTimeData = {
      completionTimes: newCompletionTimes,
      averageTime: newCompletionTimes.reduce((sum, time) => sum + time, 0) / newCompletionTimes.length,
      fastestTime: Math.min(...newCompletionTimes)
    };
  }

  // Update participant data
  room.participants[user.id] = {
    ...room.participants[user.id],
    status: 'submitted',
    submission: answer,
    accuracy,
    submittedAt: new Date(),
    isTyping: false,
    correctCount: newCorrectCount,
    totalAttempts: newTotalAttempts,
    ...updatedTimeData
  };

  roomsData[roomId] = room;
  saveToStorage();
  notifyListeners(roomId);
}

/**
 * Update typing status (fallback)
 */
export async function updateTypingStatus(roomId: string, isTyping: boolean): Promise<void> {
  loadFromStorage();
  const user = await authenticateUser();
  
  const room = roomsData[roomId];
  if (!room) return;

  const participant = room.participants[user.id];
  if (!participant || participant.status === 'submitted') return;

  participant.status = isTyping ? 'typing' : 'waiting';
  participant.isTyping = isTyping;

  roomsData[roomId] = room;
  saveToStorage();
  notifyListeners(roomId);
}

/**
 * Leave room (fallback)
 */
export async function leaveRoom(roomId: string): Promise<void> {
  loadFromStorage();
  const user = await authenticateUser();
  
  const room = roomsData[roomId];
  if (!room) return;

  delete room.participants[user.id];

  // If host leaves, deactivate room
  if (room.hostId === user.id) {
    room.isActive = false;
  }

  roomsData[roomId] = room;
  saveToStorage();
  notifyListeners(roomId);
}

/**
 * Subscribe to room updates (fallback)
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  loadFromStorage();
  
  if (!listeners[roomId]) {
    listeners[roomId] = [];
  }
  
  listeners[roomId].push(callback);
  
  // Immediately call with current data
  const room = roomsData[roomId] || null;
  callback(room);
  
  // Return unsubscribe function
  return () => {
    if (listeners[roomId]) {
      listeners[roomId] = listeners[roomId].filter(cb => cb !== callback);
    }
  };
}

/**
 * Get current user info (fallback)
 */
export function getCurrentUser(): User | null {
  loadFromStorage();
  return currentUser;
}
