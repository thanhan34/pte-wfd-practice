import { useState, useEffect, useRef } from 'react';

interface VoiceChatProps {
  roomId: string;
  currentUserId: string;
  isHost: boolean;
}

interface AudioState {
  isMuted: boolean;
  isRecording: boolean;
  hasPermission: boolean;
  error: string | null;
}

export default function VoiceChat({ roomId, currentUserId, isHost }: VoiceChatProps) {
  const [audioState, setAudioState] = useState<AudioState>({
    isMuted: true,
    isRecording: false,
    hasPermission: false,
    error: null
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Request microphone permission
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaStreamRef.current = stream;
      setAudioState(prev => ({ 
        ...prev, 
        hasPermission: true, 
        error: null 
      }));
      
      // Setup audio analysis for visual feedback
      setupAudioAnalysis(stream);
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setAudioState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        error: 'Không thể truy cập microphone. Vui lòng cho phép quyền truy cập.' 
      }));
      return false;
    }
  };

  // Setup audio analysis for visual feedback
  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start monitoring audio level
      monitorAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  };

  // Monitor audio level for visual feedback
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      if (!audioState.isMuted) {
        requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // Toggle microphone mute/unmute
  const toggleMicrophone = async () => {
    if (!audioState.hasPermission) {
      const granted = await requestMicPermission();
      if (!granted) return;
    }

    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = audioState.isMuted;
      });
      
      setAudioState(prev => ({ 
        ...prev, 
        isMuted: !prev.isMuted,
        isRecording: !prev.isMuted
      }));
      
      if (!audioState.isMuted) {
        monitorAudioLevel();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getMicButtonColor = () => {
    if (audioState.error) return 'bg-red-600 hover:bg-red-700';
    if (!audioState.hasPermission) return 'bg-gray-600 hover:bg-gray-700';
    if (audioState.isMuted) return 'bg-gray-600 hover:bg-gray-700';
    return 'bg-green-600 hover:bg-green-700';
  };

  const getMicIcon = () => {
    if (audioState.error) return '❌';
    if (!audioState.hasPermission) return '🎤';
    if (audioState.isMuted) return '🔇';
    return '🎤';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          🎙️ Voice Chat
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Microphone Control */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMicrophone}
              className={`p-3 rounded-full text-white transition-colors ${getMicButtonColor()}`}
              title={
                audioState.error 
                  ? 'Lỗi microphone'
                  : !audioState.hasPermission 
                    ? 'Click để cho phép microphone'
                    : audioState.isMuted 
                      ? 'Click để bật microphone'
                      : 'Click để tắt microphone'
              }
            >
              <span className="text-xl">{getMicIcon()}</span>
            </button>
            
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">
                {audioState.error 
                  ? 'Lỗi microphone'
                  : !audioState.hasPermission 
                    ? 'Chưa có quyền truy cập microphone'
                    : audioState.isMuted 
                      ? 'Microphone đã tắt'
                      : 'Microphone đang bật'
                }
              </div>
              
              {/* Audio level indicator */}
              {!audioState.isMuted && audioState.hasPermission && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Mức âm thanh
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {audioState.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">
                {audioState.error}
              </div>
              <div className="text-xs text-red-600 mt-1">
                Vui lòng kiểm tra cài đặt trình duyệt và cho phép quyền truy cập microphone.
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              Hướng dẫn sử dụng Voice Chat:
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Click vào nút microphone để bật/tắt</p>
              <p>• Thanh màu xanh hiển thị mức âm thanh của bạn</p>
              <p>• {isHost ? 'Bạn có thể nói chuyện với tất cả participants' : 'Bạn có thể nói chuyện với host và participants khác'}</p>
              <p>• Sử dụng để hỏi đáp, thảo luận về bài tập</p>
            </div>
          </div>

          {/* Voice Chat Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Trạng thái:</span>
                <span className={`font-medium ${
                  !audioState.isMuted && audioState.hasPermission 
                    ? 'text-green-600' 
                    : 'text-gray-600'
                }`}>
                  {!audioState.isMuted && audioState.hasPermission 
                    ? '🟢 Đang kết nối' 
                    : '🔴 Không kết nối'
                  }
                </span>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                💡 Tính năng này cho phép giao tiếp voice real-time trong phòng
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (mediaStreamRef.current) {
                  mediaStreamRef.current.getTracks().forEach(track => track.stop());
                  mediaStreamRef.current = null;
                }
                setAudioState({
                  isMuted: true,
                  isRecording: false,
                  hasPermission: false,
                  error: null
                });
              }}
              className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Reset Audio
            </button>
            
            <button
              onClick={requestMicPermission}
              disabled={audioState.hasPermission}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              Test Microphone
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
