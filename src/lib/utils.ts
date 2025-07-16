import { AccuracyResult } from '@/types';

/**
 * Calculate accuracy for PTE Write From Dictation style scoring
 * Compares target phrase with user input word by word
 */
export function calculateAccuracy(targetPhrase: string, userInput: string): AccuracyResult {
  // Normalize text: trim, lowercase, remove extra spaces
  const normalizeText = (text: string): string => {
    return text.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  const normalizedTarget = normalizeText(targetPhrase);
  const normalizedInput = normalizeText(userInput);

  // Split into words
  const targetWords = normalizedTarget.split(' ').filter(word => word.length > 0);
  const inputWords = normalizedInput.split(' ').filter(word => word.length > 0);

  const correct: string[] = [];
  const incorrect: string[] = [];
  const missing: string[] = [];
  const extra: string[] = [];

  // Create a map to track word usage
  const targetWordCount = new Map<string, number>();
  const inputWordCount = new Map<string, number>();

  // Count target words
  targetWords.forEach(word => {
    targetWordCount.set(word, (targetWordCount.get(word) || 0) + 1);
  });

  // Count input words
  inputWords.forEach(word => {
    inputWordCount.set(word, (inputWordCount.get(word) || 0) + 1);
  });

  // Find correct words (words that appear in both with correct count)
  targetWordCount.forEach((targetCount, word) => {
    const inputCount = inputWordCount.get(word) || 0;
    const correctCount = Math.min(targetCount, inputCount);
    
    for (let i = 0; i < correctCount; i++) {
      correct.push(word);
    }
  });

  // Find missing words (words in target but not enough in input)
  targetWordCount.forEach((targetCount, word) => {
    const inputCount = inputWordCount.get(word) || 0;
    const missingCount = Math.max(0, targetCount - inputCount);
    
    for (let i = 0; i < missingCount; i++) {
      missing.push(word);
    }
  });

  // Find extra words (words in input but not enough in target)
  inputWordCount.forEach((inputCount, word) => {
    const targetCount = targetWordCount.get(word) || 0;
    const extraCount = Math.max(0, inputCount - targetCount);
    
    for (let i = 0; i < extraCount; i++) {
      extra.push(word);
    }
  });

  // Find incorrect words (words that don't match any target word)
  inputWords.forEach(word => {
    if (!targetWordCount.has(word)) {
      incorrect.push(word);
    }
  });

  // Calculate accuracy percentage
  const totalTargetWords = targetWords.length;
  const correctWords = correct.length;
  const accuracy = totalTargetWords > 0 ? (correctWords / totalTargetWords) * 100 : 0;

  // Check if fully correct
  const isFullyCorrect = missing.length === 0 && incorrect.length === 0 && extra.length === 0;

  return {
    correct,
    incorrect,
    missing,
    extra,
    isFullyCorrect,
    accuracy: Math.round(accuracy * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Generate a random room ID
 */
export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format timestamp to readable time
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get user status based on participant data
 */
export function getUserStatus(participant: any): 'waiting' | 'typing' | 'correct' | 'incorrect' {
  if (participant.status === 'submitted') {
    return participant.accuracy?.isFullyCorrect ? 'correct' : 'incorrect';
  }
  return participant.status;
}

/**
 * Debounce function for typing status updates
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
