'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom, joinRoom } from '@/lib/database';
import SearchParamsHandler from '@/components/SearchParamsHandler';

export default function HomePage() {
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRemovedMessage, setShowRemovedMessage] = useState(false);
  const router = useRouter();

  const handleRemoved = () => {
    setShowRemovedMessage(true);
  };

  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      setError('Vui lòng nhập nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newRoomId = await createRoom(nickname.trim());
      router.push(`/room/${newRoomId}`);
    } catch (err) {
      setError('Không thể tạo phòng. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      setError('Vui lòng nhập nickname');
      return;
    }

    if (!roomId.trim()) {
      setError('Vui lòng nhập mã phòng');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await joinRoom(roomId.trim().toUpperCase(), nickname.trim());
      router.push(`/room/${roomId.trim().toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Không thể tham gia phòng. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNickname('');
    setRoomId('');
    setError('');
    setMode('select');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      {/* Search params handler wrapped in Suspense */}
      <Suspense fallback={null}>
        <SearchParamsHandler onRemoved={handleRemoved} />
      </Suspense>
      
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            Phòng luyện đánh máy
          </h1>
          <h2 className="text-xl text-primary-500 mb-4">
            Nhóm thời gian thực
          </h2>
          <p className="text-gray-600">
            Luyện kỹ năng gõ chính xác cho PTE Write From Dictation
          </p>
        </div>

        {/* Removed Message */}
        {showRemovedMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-red-600 text-2xl">🚫</span>
                <div>
                  <h4 className="font-semibold text-red-800">
                    Bạn đã bị loại khỏi phòng
                  </h4>
                  <p className="text-sm text-red-600">
                    Host đã loại bạn ra khỏi phòng luyện tập
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRemovedMessage(false)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="card">
          {mode === 'select' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center mb-6">
                Chọn vai trò của bạn
              </h3>
              
              <button
                onClick={() => setMode('host')}
                className="w-full btn-primary py-4 text-lg"
              >
                🎯 Tạo phòng (Host)
              </button>
              
              <button
                onClick={() => setMode('join')}
                className="w-full btn-secondary py-4 text-lg"
              >
                👥 Tham gia phòng
              </button>

              <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                <h4 className="font-semibold text-primary-600 mb-2">
                  Cách sử dụng:
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Host:</strong> Tạo phòng và đặt câu mẫu</li>
                  <li>• <strong>Người tham gia:</strong> Nghe và gõ lại câu</li>
                  <li>• Hệ thống sẽ chấm điểm theo chuẩn PTE WFD</li>
                </ul>
              </div>
            </div>
          )}

          {mode === 'host' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tạo phòng mới</h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Quay lại
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname của bạn
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nhập nickname..."
                  className="input-field"
                  maxLength={20}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Đang tạo phòng...' : 'Tạo phòng'}
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tham gia phòng</h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Quay lại
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã phòng
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Nhập mã phòng (6 ký tự)..."
                  className="input-field"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname của bạn
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nhập nickname..."
                  className="input-field"
                  maxLength={20}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoinRoom}
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Đang tham gia...' : 'Tham gia phòng'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Ứng dụng luyện tập PTE Write From Dictation</p>
          <p className="mt-1">Phiên bản thời gian thực</p>
        </div>
      </div>
    </div>
  );
}
