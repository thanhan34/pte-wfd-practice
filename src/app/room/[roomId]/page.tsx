'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  subscribeToRoom, 
  setTargetPhrase, 
  submitAnswer, 
  updateTypingStatus, 
  leaveRoom,
  getCurrentUser,
  joinRoom
} from '@/lib/database';
import { Room, User, ParticipantData } from '@/types';
import { getUserStatus, debounce } from '@/lib/utils';
import ParticipantsList from '@/components/ParticipantsList';
import HostControls from '@/components/HostControls';
import ParticipantInterface from '@/components/ParticipantInterface';
import LoadingSpinner from '@/components/LoadingSpinner';
import Leaderboard from '@/components/Leaderboard';
import VoiceChat from '@/components/VoiceChat';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  // Debounced typing status update
  const debouncedUpdateTypingStatus = useCallback(
    (isTyping: boolean) => {
      const debouncedFn = debounce((typing: boolean) => {
        if (roomId) {
          updateTypingStatus(roomId, typing);
        }
      }, 300);
      debouncedFn(isTyping);
    },
    [roomId]
  );

  // Handle URL parameters and auto-join room for participants
  useEffect(() => {
    if (!roomId || hasJoinedRoom) return;

    const role = searchParams.get('role');
    const name = searchParams.get('name');

    // If this is a participant trying to join
    if (role === 'participant' && name) {
      const handleJoinRoom = async () => {
        try {
          setLoading(true);
          await joinRoom(roomId, decodeURIComponent(name));
          setHasJoinedRoom(true);
          console.log(`✅ Participant ${name} joined room ${roomId}`);
        } catch (err: any) {
          console.error('Error joining room:', err);
          setError(err.message || 'Không thể tham gia phòng');
          setLoading(false);
        }
      };

      handleJoinRoom();
    } else if (role === 'host') {
      // Host is already in the room from creation
      setHasJoinedRoom(true);
    } else {
      // No valid role/name parameters, might be direct access
      setHasJoinedRoom(true);
    }
  }, [roomId, searchParams, hasJoinedRoom]);

  useEffect(() => {
    if (!roomId || !hasJoinedRoom) return;

    let unsubscribe: (() => void) | null = null;

    // Subscribe to room updates
    const setupSubscription = async () => {
      try {
        unsubscribe = await subscribeToRoom(roomId, async (updatedRoom) => {
          if (updatedRoom) {
            // Get current user info
            const user = await getCurrentUser();
            if (user) {
              const participant = updatedRoom.participants[user.id];
              
              // Check if current user has been removed from the room
              if (!participant) {
                // User has been removed by host, redirect to home
                router.push('/?removed=true');
                return;
              }
              
              setCurrentUser({
                ...user,
                nickname: participant.nickname,
                isHost: updatedRoom.hostId === user.id
              });
              setIsHost(updatedRoom.hostId === user.id);
            }
            
            setRoom(updatedRoom);
            setLoading(false);
          } else {
            setError('Phòng không tồn tại hoặc đã bị xóa');
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Không thể kết nối đến phòng');
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [roomId, router, hasJoinedRoom]);

  const handleSetTargetPhrase = async (phrase: string) => {
    try {
      await setTargetPhrase(roomId, phrase);
    } catch (err: any) {
      setError(err.message || 'Không thể đặt câu mẫu');
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    try {
      await submitAnswer(roomId, answer);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi câu trả lời');
    }
  };

  const handleTypingStatusChange = (isTyping: boolean) => {
    debouncedUpdateTypingStatus(isTyping);
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(roomId);
      router.push('/');
    } catch (err) {
      console.error('Error leaving room:', err);
      router.push('/');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !room || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Không thể tải thông tin phòng'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const participants = Object.entries(room.participants).map(([userId, data]) => ({
    id: userId,
    nickname: data.nickname,
    submission: data.submission,
    accuracy: data.accuracy,
    submittedAt: data.submittedAt,
    isTyping: data.isTyping,
    status: getUserStatus(data)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">
                Phòng luyện đánh máy
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600">
                  Mã phòng: <span className="font-mono font-semibold">{roomId}</span>
                </span>
                <button
                  onClick={copyRoomId}
                  className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded hover:bg-primary-200 transition-colors"
                >
                  Sao chép
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {isHost ? '🎯 Host' : '👤 Người tham gia'}
                </div>
                <div className="font-semibold text-primary-600">
                  {currentUser.nickname}
                </div>
              </div>
              
              <button
                onClick={handleLeaveRoom}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Rời phòng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
          {/* Left Column - Participants List */}
          <div className="lg:col-span-1">
            <ParticipantsList
              participants={participants}
              currentUserId={currentUser.id}
              isHost={isHost}
              roomId={room.id}
            />
          </div>

          {/* Middle Column - Main Interface */}
          <div className="xl:col-span-2 lg:col-span-2">
            {isHost ? (
              <HostControls
                room={room}
                participants={participants}
                onSetTargetPhrase={handleSetTargetPhrase}
              />
            ) : (
              <ParticipantInterface
                room={room}
                currentUser={currentUser}
                onSubmitAnswer={handleSubmitAnswer}
                onTypingStatusChange={handleTypingStatusChange}
              />
            )}
          </div>

          {/* Right Column - Leaderboard */}
          <div className="xl:col-span-1 lg:col-span-3 xl:col-start-4">
            <Leaderboard
              participants={room.participants}
              hostId={room.hostId}
              currentUserId={currentUser.id}
            />
          </div>
        </div>
      </div>

      {/* Voice Chat - Fixed at bottom */}
      <div className="fixed bottom-4 left-4 w-80 z-40">
        <VoiceChat
          roomId={roomId}
          currentUserId={currentUser.id}
          isHost={isHost}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
