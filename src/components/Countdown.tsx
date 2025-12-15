import { useState, useEffect, useCallback, useRef } from 'react';

interface CountdownProps {
  targetPhrase: string;
  audioUrl?: string; // URL of audio file from Firebase
  countdownStartedAt: Date;
  onComplete: () => void;
}

export default function Countdown({ targetPhrase, audioUrl, countdownStartedAt, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(3);
  const [isReading, setIsReading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const startTime = countdownStartedAt.getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    const remaining = Math.max(0, 3 - elapsed);
    
    setTimeLeft(remaining);

    if (remaining <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      const currentTime = Date.now();
      const currentElapsed = Math.floor((currentTime - startTime) / 1000);
      const currentRemaining = Math.max(0, 3 - currentElapsed);
      
      setTimeLeft(currentRemaining);
      
      if (currentRemaining <= 0) {
        clearInterval(timer);
        onComplete();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [countdownStartedAt, onComplete]);

  // Text-to-speech fallback function
  const speakPhraseWithTTS = useCallback(() => {
    if ('speechSynthesis' in window && targetPhrase) {
      setIsReading(true);
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(targetPhrase);
      
      // Configure speech settings
      utterance.rate = 0.8; // Slightly slower for better comprehension
      utterance.volume = 0.8;
      utterance.pitch = 1;
      
      // Try to use English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') || voice.name.toLowerCase().includes('english')
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.onend = () => {
        setIsReading(false);
      };
      
      utterance.onerror = () => {
        setIsReading(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  }, [targetPhrase]);

  // Play audio or use text-to-speech
  const playAudio = useCallback(() => {
    setIsReading(true);
    
    // If audioUrl is provided, play audio file
    if (audioUrl) {
      try {
        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        
        // Create new audio element
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsReading(false);
          audioRef.current = null;
        };
        
        audio.onerror = (error) => {
          console.error('Error playing audio:', error);
          setIsReading(false);
          audioRef.current = null;
          // Fallback to TTS if audio fails
          speakPhraseWithTTS();
        };
        
        audio.play().catch((error) => {
          console.error('Error playing audio:', error);
          setIsReading(false);
          audioRef.current = null;
          // Fallback to TTS if audio fails
          speakPhraseWithTTS();
        });
      } catch (error) {
        console.error('Error creating audio:', error);
        setIsReading(false);
        // Fallback to TTS if audio creation fails
        speakPhraseWithTTS();
      }
    } else {
      // No audioUrl provided, use TTS
      speakPhraseWithTTS();
    }
  }, [audioUrl, speakPhraseWithTTS]);

  // Auto-play audio when countdown reaches 1
  useEffect(() => {
    if (timeLeft === 1 && !isReading) {
      playAudio();
    }
  }, [timeLeft, isReading, playAudio]);

  const getCountdownColor = () => {
    switch (timeLeft) {
      case 3: return 'text-green-600 border-green-300 bg-green-50';
      case 2: return 'text-yellow-600 border-yellow-300 bg-yellow-50';
      case 1: return 'text-red-600 border-red-300 bg-red-50';
      default: return 'text-gray-600 border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Chuẩn bị nghe câu mẫu
        </h2>
        
        {/* Countdown Circle */}
        <div className={`mx-auto w-32 h-32 rounded-full border-4 flex items-center justify-center mb-6 ${getCountdownColor()}`}>
          <div className="text-6xl font-bold">
            {timeLeft}
          </div>
        </div>
        
        {/* Status Text */}
        <div className="space-y-2 mb-6">
          {timeLeft > 1 && (
            <p className="text-gray-600">
              Đếm ngược {timeLeft} giây...
            </p>
          )}
          
          {timeLeft === 1 && (
            <div className="space-y-2">
              <p className="text-red-600 font-semibold">
                🔊 Đang đọc câu mẫu...
              </p>
              {isReading && (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                  <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
          )}
          
          {timeLeft === 0 && (
            <p className="text-green-600 font-semibold">
              ✅ Bắt đầu gõ câu trả lời!
            </p>
          )}
        </div>
        
        {/* Manual Play Button */}
        <div className="space-y-4">
          <button
            onClick={playAudio}
            disabled={isReading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isReading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isReading ? '🔊 Đang phát...' : `🔊 Nghe lại${audioUrl ? ' (Audio)' : ' (TTS)'}`}
          </button>
          
          <p className="text-xs text-gray-500">
            {audioUrl ? 'Câu sẽ được phát audio tự động khi đếm ngược đến 1' : 'Câu sẽ được đọc tự động khi đếm ngược đến 1'}
          </p>
        </div>
        
        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">
            Hướng dẫn:
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Nghe kỹ câu được đọc</p>
            <p>• Ghi nhớ chính xác từng từ</p>
            <p>• Sẵn sàng gõ lại sau khi đếm ngược</p>
          </div>
        </div>
      </div>
    </div>
  );
}
