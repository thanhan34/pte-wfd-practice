import { ParticipantData, UserStatus, AccuracyResult } from '@/types';
import { formatTime } from '@/lib/utils';
import { removeParticipant } from '@/lib/phrase-management';
import { useState } from 'react';

interface ParticipantWithStatus {
  id: string;
  nickname: string;
  submission?: string;
  accuracy?: AccuracyResult;
  submittedAt?: Date;
  isTyping?: boolean;
  status: UserStatus;
}

interface ParticipantsListProps {
  participants: ParticipantWithStatus[];
  currentUserId: string;
  isHost: boolean;
  roomId: string;
  targetPhrase?: string; // Add target phrase for inline feedback
}

export default function ParticipantsList({ 
  participants, 
  currentUserId, 
  isHost,
  roomId,
  targetPhrase
}: ParticipantsListProps) {
  const [removingParticipant, setRemovingParticipant] = useState<string | null>(null);

  // Sắp xếp participants: người đã submit trước (theo thời gian submit sớm nhất), người chưa submit sau
  const sortedParticipants = [...participants].sort((a, b) => {
    const aSubmitted = a.status === 'correct' || a.status === 'incorrect';
    const bSubmitted = b.status === 'correct' || b.status === 'incorrect';
    
    // Người đã submit lên trước
    if (aSubmitted && !bSubmitted) return -1;
    if (!aSubmitted && bSubmitted) return 1;
    
    // Nếu cả hai đều đã submit, sắp xếp theo thời gian submit (sớm nhất trước)
    if (aSubmitted && bSubmitted) {
      // Nếu có submittedAt, dùng thời gian đó
      if (a.submittedAt && b.submittedAt) {
        const timeA = new Date(a.submittedAt).getTime();
        const timeB = new Date(b.submittedAt).getTime();
        return timeA - timeB; // Sớm nhất trước (số nhỏ hơn trước)
      }
      // Nếu không có submittedAt, sắp xếp theo nickname
      return a.nickname.localeCompare(b.nickname);
    }
    
    // Nếu cả hai đều chưa submit, sắp xếp theo trạng thái: typing trước, waiting sau
    if (!aSubmitted && !bSubmitted) {
      if (a.status === 'typing' && b.status !== 'typing') return -1;
      if (a.status !== 'typing' && b.status === 'typing') return 1;
      // Nếu cùng trạng thái, sắp xếp theo nickname
      return a.nickname.localeCompare(b.nickname);
    }
    
    return 0;
  });

  const handleRemoveParticipant = async (participantId: string) => {
    if (!isHost || participantId === currentUserId) return;
    
    setRemovingParticipant(participantId);
    try {
      await removeParticipant(roomId, participantId);
    } catch (error) {
      console.error('Error removing participant:', error);
    } finally {
      setRemovingParticipant(null);
    }
  };

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'correct':
        return '✅';
      case 'incorrect':
        return '❌';
      case 'typing':
        return '⌨️';
      case 'waiting':
      default:
        return '🕓';
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'correct':
        return 'Đúng hết';
      case 'incorrect':
        return 'Có sai';
      case 'typing':
        return 'Đang gõ';
      case 'waiting':
      default:
        return 'Chờ';
    }
  };

  const getStatusClass = (status: UserStatus) => {
    switch (status) {
      case 'correct':
        return 'status-correct';
      case 'incorrect':
        return 'status-incorrect';
      case 'typing':
        return 'status-typing';
      case 'waiting':
      default:
        return 'status-waiting';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Người tham gia ({participants.length})
        </h3>
        <div className="text-sm text-gray-500">
          Trạng thái thời gian thực
        </div>
      </div>

      <div className="space-y-3">
        {sortedParticipants.map((participant) => (
          <div
            key={participant.id}
            className={`p-3 rounded-lg border transition-colors ${
              participant.id === currentUserId
                ? 'bg-primary-50 border-primary-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {getStatusIcon(participant.status)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {participant.nickname}
                    </span>
                    {participant.id === currentUserId && (
                      <span className="text-xs bg-primary-200 text-primary-700 px-2 py-1 rounded-full">
                        Bạn
                      </span>
                    )}
                    {isHost && participant.id !== currentUserId && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        Thành viên
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {participant.submittedAt && (
                      <>Gửi lúc {formatTime(new Date(participant.submittedAt))}</>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className={getStatusClass(participant.status)}>
                    {getStatusText(participant.status)}
                  </span>
                  
                  {participant.accuracy && (
                    <div className="text-xs text-gray-500 mt-1">
                      {participant.accuracy.accuracy.toFixed(1)}%
                    </div>
                  )}
                </div>

                {/* Remove button for host */}
                {isHost && participant.id !== currentUserId && (
                  <button
                    onClick={() => handleRemoveParticipant(participant.id)}
                    disabled={removingParticipant === participant.id}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-red-400"
                    title="Loại khỏi phòng"
                  >
                    {removingParticipant === participant.id ? '...' : '🚫'}
                  </button>
                )}
              </div>
            </div>

            {/* Show inline accuracy details for host */}
            {isHost && participant.accuracy && participant.submission && targetPhrase && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                {/* Target phrase with inline highlights */}
                <div className="p-2 bg-white rounded border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1 font-medium">Câu gốc:</div>
                  <div className="text-sm">
                    {targetPhrase.toLowerCase().split(/\s+/).map((word, index) => {
                      const correctSet = new Set(participant.accuracy!.correct.map(w => w.toLowerCase()));
                      const missingSet = new Set(participant.accuracy!.missing.map(w => w.toLowerCase()));
                      
                      if (correctSet.has(word)) {
                        return (
                          <span key={`target-${index}`} className="text-green-600 font-semibold">
                            {word}{index < targetPhrase.toLowerCase().split(/\s+/).length - 1 ? ' ' : ''}
                          </span>
                        );
                      } else if (missingSet.has(word)) {
                        // Missing words shown in parentheses with red color
                        return (
                          <span key={`target-${index}`} className="text-red-600 font-semibold">
                            ({word}){index < targetPhrase.toLowerCase().split(/\s+/).length - 1 ? ' ' : ''}
                          </span>
                        );
                      } else {
                        return (
                          <span key={`target-${index}`}>
                            {word}{index < targetPhrase.toLowerCase().split(/\s+/).length - 1 ? ' ' : ''}
                          </span>
                        );
                      }
                    })}
                  </div>
                </div>

                {/* Submitted answer with inline highlights - showing target structure with missing words */}
                <div className="p-2 bg-white rounded border border-red-600">
                  <div className="text-xs text-gray-600 mb-1 font-medium">Câu của {participant.nickname}:</div>
                  <div className="text-sm">
                    {(() => {
                      const targetWords = targetPhrase.toLowerCase().split(/\s+/);
                      const submissionWords = participant.submission!.toLowerCase().split(/\s+/);
                      
                      // Create a working copy of submission words to track usage
                      const availableWords = [...submissionWords];
                      
                      return targetWords.map((targetWord, index) => {
                        // Find matching word in available submission words
                        const foundIndex = availableWords.findIndex(w => w === targetWord);
                        
                        if (foundIndex !== -1) {
                          // Word found in submission - mark as used and show in green
                          availableWords.splice(foundIndex, 1);
                          return (
                            <span key={`inline-${index}`} className="text-green-600 font-semibold">
                              {targetWord}{index < targetWords.length - 1 ? ' ' : ''}
                            </span>
                          );
                        } else {
                          // Word not found - show in red parentheses
                          return (
                            <span key={`inline-${index}`}>
                              <span className="text-red-600 font-semibold">({targetWord})</span>
                              {index < targetWords.length - 1 ? ' ' : ''}
                            </span>
                          );
                        }
                      });
                    })()}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs pt-1">
                  <span className="text-green-600 font-semibold">Đúng: {participant.accuracy.correct.length}</span>
                  <span className="text-[#fc5d01] font-semibold">Sai: {participant.accuracy.incorrect.length}</span>
                  <span className="text-red-600 font-semibold">Thiếu: {participant.accuracy.missing.length}</span>
                  <span className="text-[#8B4513] font-semibold">Thừa: {participant.accuracy.extra.length}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {participants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>Chưa có người tham gia</p>
          </div>
        )}
      </div>

      {/* Legend for host */}
      {isHost && participants.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Chú thích:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Đúng hết</span>
            </div>
            <div className="flex items-center gap-2">
              <span>❌</span>
              <span>Có sai</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⌨️</span>
              <span>Đang gõ</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🕓</span>
              <span>Chờ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
