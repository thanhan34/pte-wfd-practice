'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoom } from '../lib/database';

export default function HomePage() {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [hostName, setHostName] = useState('');
  const [showRemovedMessage, setShowRemovedMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for removed parameter
  useEffect(() => {
    if (searchParams.get('removed') === 'true') {
      setShowRemovedMessage(true);
      // Clear the URL parameter
      router.replace('/');
    }
  }, [searchParams, router]);

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      alert('Vui lòng nhập tên host');
      return;
    }
    
    setIsCreatingRoom(true);
    try {
      const newRoomId = await createRoom(hostName.trim());
      router.push(`/room/${newRoomId}?role=host&name=${encodeURIComponent(hostName.trim())}`);
    } catch (error) {
      console.error('Lỗi tạo phòng:', error);
      alert('Không thể tạo phòng. Vui lòng thử lại.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = () => {
    if (!roomId.trim() || !participantName.trim()) {
      alert('Vui lòng nhập đầy đủ mã phòng và tên của bạn');
      return;
    }
    router.push(`/room/${roomId.trim()}?role=participant&name=${encodeURIComponent(participantName.trim())}`);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
        <h1 style={{ color: '#ea580c', fontSize: '2rem', marginBottom: '1rem' }}>
          Phòng luyện đánh máy
        </h1>
        <h2 style={{ color: '#fb923c', fontSize: '1.5rem', marginBottom: '1rem' }}>
          Nhóm thời gian thực
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Luyện kỹ năng gõ chính xác cho PTE Write From Dictation
        </p>
        
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            Chọn vai trò của bạn
          </h3>
          
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              width: '100%',
              backgroundColor: '#ea580c',
              color: 'white',
              padding: '1rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              marginBottom: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            🎯 Tạo phòng (Host)
          </button>

          {showCreateForm && (
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem', textAlign: 'left' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  Tên host:
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #fed7aa',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ea580c'}
                  onBlur={(e) => e.target.style.borderColor = '#fed7aa'}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                />
              </div>
              
              <button
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                style={{
                  width: '100%',
                  backgroundColor: isCreatingRoom ? '#9ca3af' : '#ea580c',
                  color: 'white',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: isCreatingRoom ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isCreatingRoom ? '⏳ Đang tạo phòng...' : 'Tạo phòng ngay'}
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setShowJoinForm(!showJoinForm)}
            style={{
              width: '100%',
              backgroundColor: '#fed7aa',
              color: '#ea580c',
              padding: '1rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            👥 Tham gia phòng
          </button>

          {showJoinForm && (
            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  Mã phòng:
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Nhập mã phòng"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #fed7aa',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ea580c'}
                  onBlur={(e) => e.target.style.borderColor = '#fed7aa'}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  Tên của bạn:
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #fed7aa',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#ea580c'}
                  onBlur={(e) => e.target.style.borderColor = '#fed7aa'}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>
              
              <button
                onClick={handleJoinRoom}
                style={{
                  width: '100%',
                  backgroundColor: '#ea580c',
                  color: 'white',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Tham gia ngay
              </button>
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          <p>Ứng dụng luyện tập PTE Write From Dictation</p>
          <p>Phiên bản thời gian thực</p>
        </div>
      </div>

      {/* Removed from room notification */}
      {showRemovedMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>⚠️</span>
            <span style={{ fontWeight: '600', color: '#dc2626' }}>Đã bị loại khỏi phòng</span>
          </div>
          <p style={{ color: '#7f1d1d', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
            Bạn đã bị host loại khỏi phòng hoặc phòng đã bị xóa.
          </p>
          <button
            onClick={() => setShowRemovedMessage(false)}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
