import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, ParticipantData, UserStatus, AccuracyResult } from '@/types';
import { setNextPhrase, triggerAudioPlayback } from '@/lib/phrase-management';
import { getWritefromDictionItems, subscribeToWritefromDiction, WritefromDictionItem } from '@/lib/writefromdiction';
import Countdown from './Countdown';

interface ParticipantWithStatus {
  id: string;
  nickname: string;
  submission?: string;
  accuracy?: AccuracyResult;
  submittedAt?: Date;
  isTyping?: boolean;
  status: UserStatus;
}

interface HostControlsProps {
  room: Room;
  participants: ParticipantWithStatus[];
  onSetTargetPhrase: (phrase: string, index?: number, audioUrl?: string) => Promise<void>;
  onToggleShowPhrase: (show: boolean) => Promise<void>;
}

export default function HostControls({ 
  room, 
  participants, 
  onSetTargetPhrase,
  onToggleShowPhrase
}: HostControlsProps) {
  const [wfdItems, setWfdItems] = useState<WritefromDictionItem[]>([]);
  const [phraseList, setPhraseList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState<number | null>(null);
  const [showPhraseManagement, setShowPhraseManagement] = useState(false);
  const [dataError, setDataError] = useState<string>('');
  
  // Audio playback state for host
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load writefromdiction data from secondary Firebase
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingData(true);
        setDataError('');
        const items = await getWritefromDictionItems();
        setWfdItems(items);
        // Extract text field as phrase list
        const phrases = items
          .map(item => item.text)
          .filter((text): text is string => !!text);
        setPhraseList(phrases);
        console.log(`✅ Loaded ${phrases.length} WFD phrases from secondary Firebase`);
      } catch (error) {
        console.error('Error loading writefromdiction data:', error);
        setDataError('Không thể tải dữ liệu từ Firebase. Vui lòng thử lại.');
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToWritefromDiction((items) => {
      setWfdItems(items);
      const phrases = items
        .map(item => item.text)
        .filter((text): text is string => !!text);
      setPhraseList(phrases);
      console.log(`🔄 Real-time update: ${phrases.length} WFD phrases`);
    });

    return () => unsubscribe();
  }, []);

  const handleSetActivePhrase = async (phrase: string, index: number) => {
    setLoading(true);
    setSelectedPhraseIndex(index);
    try {
      // Get audio URL for this phrase from wfdItems (use Brian voice)
      const wfdItem = wfdItems.find(item => item.text === phrase);
      const brianAudioUrl = wfdItem?.audio?.Brian || '';
      
      console.log('🎵 Setting active phrase with Brian audio:');
      console.log('📝 Phrase:', phrase);
      console.log('🔍 WFD Item found:', !!wfdItem);
      console.log('🎤 Has Brian audio:', !!brianAudioUrl);
      
      if (wfdItem) {
        console.log('📊 Available voices:', Object.keys(wfdItem.audio || {}));
        if (brianAudioUrl) {
          console.log('✅ Brian audio URL:', brianAudioUrl.substring(0, 80) + '...');
        } else {
          console.warn('⚠️ No Brian audio found for this phrase!');
        }
      } else {
        console.error('❌ WFD item not found for phrase:', phrase);
      }
      
      // Call the parent function to set target phrase with Brian audio URL
      await onSetTargetPhrase(phrase, index, brianAudioUrl);
      
      if (brianAudioUrl) {
        console.log('✅ Successfully set phrase with Brian audio');
      } else {
        console.warn('⚠️ Phrase set without audio URL (will use TTS fallback)');
      }
    } catch (error) {
      console.error('❌ Error setting target phrase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPhrase = async () => {
    if (phraseList.length === 0 || wfdItems.length === 0) return;
    
    setLoading(true);
    try {
      // Get current index and calculate next index
      const currentIndex = room.currentPhraseIndex !== undefined ? room.currentPhraseIndex : -1;
      const nextIndex = (currentIndex + 1) % phraseList.length;
      const nextPhrase = phraseList[nextIndex];
      
      console.log('⏭️ Setting next phrase:');
      console.log('📝 Current index:', currentIndex);
      console.log('📝 Next index:', nextIndex);
      console.log('📝 Next phrase:', nextPhrase);
      
      // Find audioUrl for next phrase (Brian voice)
      const wfdItem = wfdItems.find(item => item.text === nextPhrase);
      const brianAudioUrl = wfdItem?.audio?.Brian || '';
      
      if (brianAudioUrl) {
        console.log('✅ Found Brian audio for next phrase');
        console.log('🎵 Audio URL:', brianAudioUrl.substring(0, 80) + '...');
      } else {
        console.warn('⚠️ No Brian audio found for next phrase - will use TTS');
      }
      
      // Set the phrase with audio URL
      await onSetTargetPhrase(nextPhrase, nextIndex, brianAudioUrl);
      
      console.log('✅ Successfully set next phrase with Brian audio');
    } catch (error) {
      console.error('❌ Error setting next phrase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplayForParticipants = async () => {
    try {
      // Always try to get Brian's audio from wfdItems for consistency
      let brianAudioUrl = room.audioUrl;
      
      if (room.targetPhrase) {
        // Find the WFD item for current phrase
        const wfdItem = wfdItems.find(item => item.text === room.targetPhrase);
        
        console.log('🔊 Replay audio for participants:');
        console.log('📝 Target phrase:', room.targetPhrase);
        console.log('🔍 WFD item found:', !!wfdItem);
        
        if (wfdItem?.audio?.Brian) {
          brianAudioUrl = wfdItem.audio.Brian;
          console.log('✅ Using Brian audio from Firebase');
          console.log('🎵 Audio URL:', brianAudioUrl.substring(0, 80) + '...');
        } else if (room.audioUrl) {
          console.log('⚠️ No Brian audio in WFD item, using room.audioUrl');
        } else {
          console.warn('❌ No audio URL available - will use TTS fallback');
        }
      }
      
      // Play audio directly for host to hear
      if (brianAudioUrl) {
        console.log('🔊 Playing Brian audio for participants...');
        const audio = new Audio(brianAudioUrl);
        audio.onended = () => console.log('✅ Audio playback completed');
        audio.onerror = (error) => console.error('❌ Audio playback error:', error);
        
        audio.play().catch(error => {
          console.error('❌ Failed to play audio:', error);
        });
      } else {
        console.warn('⚠️ No audio URL available - participants will use TTS');
      }
      
      // Also trigger signal for participants to play audio
      await triggerAudioPlayback(room.id);
      console.log('✅ Audio playback signal sent to participants');
    } catch (error) {
      console.error('❌ Error triggering audio playback:', error);
    }
  };

  // Text-to-speech fallback
  const speakPhraseWithTTS = useCallback((phrase: string) => {
    if ('speechSynthesis' in window && phrase) {
      setIsPlayingAudio(true);
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(phrase);
      
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
        setIsPlayingAudio(false);
      };
      
      utterance.onerror = () => {
        setIsPlayingAudio(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Play audio file or use text-to-speech for host
  const playAudio = useCallback(() => {
    if (!room.targetPhrase) return;
    
    setIsPlayingAudio(true);
    
    // If audioUrl is provided, play audio file
    if (room.audioUrl) {
      try {
        // Stop any currently playing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        
        // Create new audio element
        const audio = new Audio(room.audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsPlayingAudio(false);
          audioRef.current = null;
        };
        
        audio.onerror = (error) => {
          console.error('Error playing audio:', error);
          setIsPlayingAudio(false);
          audioRef.current = null;
          // Fallback to TTS if audio fails
          speakPhraseWithTTS(room.targetPhrase);
        };
        
        audio.play().catch((error) => {
          console.error('Error playing audio:', error);
          setIsPlayingAudio(false);
          audioRef.current = null;
          // Fallback to TTS if audio fails
          speakPhraseWithTTS(room.targetPhrase);
        });
      } catch (error) {
        console.error('Error creating audio:', error);
        setIsPlayingAudio(false);
        // Fallback to TTS if audio creation fails
        speakPhraseWithTTS(room.targetPhrase);
      }
    } else {
      // No audioUrl provided, use TTS
      speakPhraseWithTTS(room.targetPhrase);
    }
  }, [room.targetPhrase, room.audioUrl, speakPhraseWithTTS]);

  return (
    <div className="space-y-6">
      {/* WFD Phrase Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Quản lý danh sách câu WFD
          </h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-xs font-medium text-blue-700">
              🔄 Đồng bộ từ Firebase
            </span>
          </div>
        </div>

        {/* Loading state */}
        {loadingData && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700 font-medium">
                Đang tải dữ liệu từ Firebase...
              </span>
            </div>
          </div>
        )}

        {/* Error state */}
        {dataError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700 font-medium">
              ❌ {dataError}
            </div>
          </div>
        )}

        {/* Main Controls - Always Visible */}
        <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          {/* Countdown for Host */}
          {room.isCountingDown && room.countdownStartedAt && room.targetPhrase && (
            <div className="mb-4">
              <Countdown
                targetPhrase={room.targetPhrase}
                audioUrl={room.audioUrl}
                countdownStartedAt={room.countdownStartedAt}
                onComplete={() => {
                  // Countdown đã tự động phát audio, không cần phát lại
                  console.log('✅ Countdown hoàn thành, audio đã được phát');
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-primary-600 font-medium">
              🎯 Điều khiển chính:
            </div>
            <div className="flex gap-2">
              <button
                onClick={playAudio}
                disabled={!room.targetPhrase || isPlayingAudio}
                className={`text-sm px-4 py-2 rounded hover:bg-primary-700 transition-colors ${
                  isPlayingAudio
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-primary-600 text-white'
                }`}
              >
                {isPlayingAudio ? '🔊 Đang phát...' : `🔊 Host nghe${room.audioUrl ? ' (Audio)' : ' (TTS)'}`}
              </button>
              <button
                onClick={handleReplayForParticipants}
                disabled={!room.targetPhrase}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                📢 Phát câu hiện tại
              </button>
              <button
                onClick={handleNextPhrase}
                disabled={loading || phraseList.length === 0 || loadingData}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Đang chuyển...' : '⏭️ Câu tiếp theo'}
              </button>
            </div>
          </div>

          {/* Toggle show phrase to participants - Always Visible */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary-700">
                👁️ Hiển thị câu cho người tham gia:
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                room.showPhraseToParticipants 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {room.showPhraseToParticipants ? '✅ Đang hiển thị' : '❌ Đang ẩn'}
              </span>
            </div>
            <button
              onClick={() => onToggleShowPhrase(!room.showPhraseToParticipants)}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                room.showPhraseToParticipants
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {room.showPhraseToParticipants ? '🙈 Ẩn câu' : '👁️ Hiện câu'}
            </button>
          </div>

          {/* Current phrase status */}
          {room.targetPhrase ? (
            <div className="space-y-3">
             

              {/* Show target phrase preview for host when enabled */}
              {room.showPhraseToParticipants && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                    👁️ Câu mẫu đang hiển thị cho người tham gia:
                  </div>
                  <div className="text-lg font-bold text-gray-800 bg-red-100 p-3 rounded-lg border border-red-300">
                    &quot;{room.targetPhrase}&quot;
                  </div>
                  <div className="text-xs text-red-600 mt-2 font-medium">
                    ✅ Người tham gia có thể thấy câu này để tham khảo
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-800 font-medium">
                ⚠️ Chưa có câu nào được đặt
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                Hãy chọn một câu từ danh sách bên dưới
              </div>
            </div>
          )}
        </div>

        {/* Toggle button for phrase list */}
        <div className="mb-6">
          <button
            onClick={() => setShowPhraseManagement(!showPhraseManagement)}
            disabled={loadingData}
            className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <span className="text-sm font-medium text-gray-700">
              📝 Danh sách câu WFD ({phraseList.length} câu)
            </span>
            <span className="text-gray-500">
              {showPhraseManagement ? '🔼 Ẩn' : '🔽 Hiện'}
            </span>
          </button>
        </div>

        {/* Collapsible phrase list section */}
        {showPhraseManagement && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Danh sách câu WFD từ Firebase:
              </h4>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {phraseList.length} câu có sẵn
              </div>
            </div>
            
            {phraseList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p className="font-medium">Chưa có câu nào trong database</p>
                <p className="text-xs mt-1">Dữ liệu sẽ tự động cập nhật từ Firebase</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {phraseList.map((phrase, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg transition-colors ${
                      room.targetPhrase === phrase
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 break-words">
                          &quot;{phrase}&quot;
                        </div>
                        {room.targetPhrase === phrase && (
                          <div className="text-xs text-primary-600 mt-1 font-medium">
                            ✓ Đang sử dụng
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleSetActivePhrase(phrase, index)}
                          disabled={loading || room.targetPhrase === phrase}
                          className={`text-xs px-3 py-1.5 rounded transition-colors font-medium ${
                            room.targetPhrase === phrase
                              ? 'bg-primary-200 text-primary-700 cursor-not-allowed'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {loading && selectedPhraseIndex === index ? 'Đang đặt...' : 'Sử dụng'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="text-lg font-semibold text-primary-800 mb-3">
          Hướng dẫn cho Host
        </h3>
        <div className="space-y-2 text-sm text-primary-700">
          <div className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <span>Danh sách câu WFD được tải tự động từ Firebase (PTE Shadowing database)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">2.</span>
            <span>Chọn câu từ danh sách để người tham gia thực hành</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">3.</span>
            <span>Người tham gia sẽ không thấy câu mẫu và phải gõ từ trí nhớ</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">4.</span>
            <span>Theo dõi trạng thái thời gian thực và kết quả chi tiết</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">5.</span>
            <span>Có thể thay đổi câu bất cứ lúc nào để luyện tập liên tục</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">6.</span>
            <span>Sử dụng nút &quot;Phát lại&quot; để cho người tham gia nghe lại câu nếu cần</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">7.</span>
            <span>Dữ liệu tự động cập nhật khi có thay đổi trên Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
