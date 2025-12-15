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
}

export default function ParticipantsList({ 
  participants, 
  currentUserId, 
  isHost,
  roomId
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

            {/* Show accuracy details for host */}
            {isHost && participant.accuracy && participant.submission && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-2">
                  <strong>Câu trả lời:</strong> &quot;{participant.submission}&quot;
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {participant.accuracy.correct.length > 0 && (
                    <div>
                      <span className="text-green-600 font-medium">Đúng:</span>
                      <div className="text-green-700">
                        {participant.accuracy.correct.join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {participant.accuracy.incorrect.length > 0 && (
                    <div>
                      <span className="text-red-600 font-medium">Sai:</span>
                      <div className="text-red-700">
                        {participant.accuracy.incorrect.join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {participant.accuracy.missing.length > 0 && (
                    <div>
                      <span className="text-orange-600 font-medium">Thiếu:</span>
                      <div className="text-orange-700">
                        {participant.accuracy.missing.join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {participant.accuracy.extra.length > 0 && (
                    <div>
                      <span className="text-purple-600 font-medium">Thừa:</span>
                      <div className="text-purple-700">
                        {participant.accuracy.extra.join(', ')}
                      </div>
                    </div>
                  )}
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
