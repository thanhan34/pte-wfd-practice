export interface User {
  id: string;
  nickname: string;
  isHost: boolean;
  joinedAt: Date;
}

export interface ParticipantData {
  nickname: string;
  status: 'waiting' | 'typing' | 'submitted';
  submission?: string;
  accuracy?: AccuracyResult;
  submittedAt?: Date;
  isTyping?: boolean;
  correctCount: number; // Số câu đã đúng hoàn toàn
  totalAttempts: number; // Tổng số lần thử
  averageTime?: number; // Thời gian trung bình để hoàn thành câu đúng (ms)
  fastestTime?: number; // Thời gian nhanh nhất để hoàn thành câu đúng (ms)
  completionTimes?: number[]; // Danh sách thời gian hoàn thành các câu đúng
}

export interface Room {
  id: string;
  hostId: string;
  targetPhrase: string;
  createdAt: Date;
  isActive: boolean;
  participants: { [userId: string]: ParticipantData };
  countdownStartedAt?: Date;
  isCountingDown?: boolean;
  roundStartTime?: Date; // Thời gian bắt đầu round (sau countdown)
  currentPhraseIndex?: number; // Index của câu hiện tại trong global phraseList
  shouldPlayAudio?: boolean; // Signal để phát audio cho participants
  showPhraseToParticipants?: boolean; // Host có thể bật/tắt hiển thị câu cho participants
}

export interface AccuracyResult {
  correct: string[];
  incorrect: string[];
  missing: string[];
  extra: string[];
  isFullyCorrect: boolean;
  accuracy: number;
}

export interface TypingStatus {
  userId: string;
  isTyping: boolean;
  lastUpdate: Date;
}

export type UserStatus = 'waiting' | 'typing' | 'correct' | 'incorrect';

export interface RoomContextType {
  room: Room | null;
  currentUser: User | null;
  isHost: boolean;
  loading: boolean;
  error: string | null;
  joinRoom: (roomId: string, nickname: string) => Promise<void>;
  createRoom: (hostNickname: string) => Promise<string>;
  setTargetPhrase: (phrase: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  updateTypingStatus: (isTyping: boolean) => void;
  leaveRoom: () => void;
}
