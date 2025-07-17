import { useState, useEffect } from 'react';
import { Room, User, AccuracyResult } from '@/types';
import Countdown from './Countdown';
import CelebrationEffect from './CelebrationEffect';

interface ParticipantInterfaceProps {
  room: Room;
  currentUser: User;
  onSubmitAnswer: (answer: string) => Promise<void>;
  onTypingStatusChange: (isTyping: boolean) => void;
}

export default function ParticipantInterface({
  room,
  currentUser,
  onSubmitAnswer,
  onTypingStatusChange
}: ParticipantInterfaceProps) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<Array<{
    phrase: string;
    answer: string;
    accuracy: AccuracyResult;
    timestamp: Date;
  }>>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const currentParticipant = room.participants[currentUser.id];
  const isSubmitted = currentParticipant?.status === 'submitted';
  const accuracy = currentParticipant?.accuracy;

  useEffect(() => {
    setHasSubmitted(isSubmitted);
    
    // Reset answer when target phrase changes (new round)
    if (room.targetPhrase && !isSubmitted) {
      // Only reset if this is a new phrase
      const lastSubmission = submissionHistory[submissionHistory.length - 1];
      if (!lastSubmission || lastSubmission.phrase !== room.targetPhrase) {
        setAnswer('');
        setHasSubmitted(false);
      }
    }
  }, [isSubmitted, room.targetPhrase, submissionHistory]);

  // Audio playback when host triggers
  useEffect(() => {
    if (room.shouldPlayAudio && room.targetPhrase) {
      speakPhrase(room.targetPhrase);
    }
  }, [room.shouldPlayAudio, room.targetPhrase]);

  // Text-to-speech function
  const speakPhrase = (phrase: string) => {
    if ('speechSynthesis' in window && phrase) {
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
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Save submission to history only when fully correct and trigger celebration
  useEffect(() => {
    if (isSubmitted && accuracy && accuracy.isFullyCorrect && room.targetPhrase && currentParticipant?.submission) {
      // Trigger celebration effect
      setShowCelebration(true);
      
      const newSubmission = {
        phrase: room.targetPhrase,
        answer: currentParticipant.submission,
        accuracy: accuracy,
        timestamp: new Date()
      };
      
      setSubmissionHistory(prev => {
        // Avoid duplicates
        const exists = prev.some(s => 
          s.phrase === newSubmission.phrase && 
          s.answer === newSubmission.answer &&
          Math.abs(s.timestamp.getTime() - newSubmission.timestamp.getTime()) < 1000
        );
        
        if (!exists) {
          return [...prev, newSubmission];
        }
        return prev;
      });
    }
  }, [isSubmitted, accuracy, room.targetPhrase, currentParticipant?.submission]);

  const handleInputChange = (value: string) => {
    setAnswer(value);
    
    // Update typing status
    const isTypingNow = value.length > 0 && !hasSubmitted;
    setIsTyping(isTypingNow);
    onTypingStatusChange(isTypingNow);
  };

  const handleSubmit = async () => {
    if (!answer.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmitAnswer(answer.trim());
      // Don't set hasSubmitted to true immediately - let the accuracy result determine if we continue
      onTypingStatusChange(false);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setAnswer('');
    setHasSubmitted(false);
    onTypingStatusChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderAccuracyResult = (accuracy: AccuracyResult) => {
    return (
      <div className="space-y-4">
        {/* Overall result with enhanced design */}
        <div className={`p-6 rounded-xl text-center relative overflow-hidden ${
          accuracy.isFullyCorrect 
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-lg' 
            : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 shadow-lg'
        }`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
          
          <div className="relative z-10">
            <div className="text-5xl mb-3 animate-bounce">
              {accuracy.isFullyCorrect ? '🎉' : '😔'}
            </div>
            <div className={`text-xl font-bold mb-2 ${
              accuracy.isFullyCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {accuracy.isFullyCorrect ? '🌟 Xuất sắc!' : '💪 Cố gắng thêm!'}
            </div>
            
            {/* Progress bar for accuracy */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  accuracy.accuracy >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  accuracy.accuracy >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  'bg-gradient-to-r from-red-400 to-red-600'
                }`}
                style={{ width: `${accuracy.accuracy}%` }}
              />
            </div>
            
            <div className="text-lg font-semibold text-gray-700">
              Độ chính xác: <span className={`${
                accuracy.accuracy >= 80 ? 'text-green-600' :
                accuracy.accuracy >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>{accuracy.accuracy.toFixed(1)}%</span>
            </div>
            
            {/* Motivational message */}
            <div className="text-sm text-gray-600 mt-2 italic">
              {accuracy.isFullyCorrect ? 
                '🎯 Bạn đã làm rất tốt! Tiếp tục phát huy!' :
                '📚 Đừng bỏ cuộc! Mỗi lần thử là một bước tiến!'
              }
            </div>
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accuracy.correct.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                ✅ Từ đúng ({accuracy.correct.length})
              </h4>
              <div className="text-sm text-green-700">
                {accuracy.correct.join(', ')}
              </div>
            </div>
          )}

          {accuracy.incorrect.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">
                ❌ Từ sai ({accuracy.incorrect.length})
              </h4>
              <div className="text-sm text-red-700">
                {accuracy.incorrect.join(', ')}
              </div>
            </div>
          )}

          {accuracy.missing.length > 0 && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">
                ⚠️ Từ thiếu ({accuracy.missing.length})
              </h4>
              <div className="text-sm text-orange-700">
                {accuracy.missing.join(', ')}
              </div>
            </div>
          )}

          {accuracy.extra.length > 0 && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">
                ➕ Từ thừa ({accuracy.extra.length})
              </h4>
              <div className="text-sm text-purple-700">
                {accuracy.extra.join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Your answer */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">
            Câu trả lời của bạn:
          </h4>
          <div className="text-sm text-gray-700 italic">
            &quot;{currentParticipant?.submission}&quot;
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Celebration Effect */}
      <CelebrationEffect 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      {/* Show countdown overlay when counting down */}
      {room.isCountingDown && room.countdownStartedAt && room.targetPhrase && (
        <Countdown
          targetPhrase={room.targetPhrase}
          countdownStartedAt={room.countdownStartedAt}
          onComplete={() => {
            // Countdown completed, user can now start typing
            console.log('Countdown completed');
          }}
        />
      )}
      
      <div className="space-y-6">
      {/* Status Card with enhanced design */}
      <div className="card bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 text-lg">👤</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Trạng thái của bạn
            </h3>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-md ${
            hasSubmitted 
              ? (accuracy?.isFullyCorrect ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 animate-celebration border border-green-300' : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300')
              : (answer.length > 0 ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 animate-typing border border-blue-300' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300')
          }`}>
            {hasSubmitted 
              ? (accuracy?.isFullyCorrect ? '✅ Đúng hết' : '❌ Có sai')
              : (answer.length > 0 ? '⌨️ Đang gõ' : '🕓 Chờ')
            }
          </div>
        </div>

        <div className="space-y-4">
          {/* Current phrase status */}
          {!room.targetPhrase ? (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">⏳</div>
              <p>Đang chờ Host đặt câu mẫu...</p>
            </div>
          ) : (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="text-sm text-primary-600 font-medium mb-1">
                {hasSubmitted ? '✅ Đã hoàn thành câu này' : '🎯 Câu hiện tại'}
              </div>
              <div className="text-primary-800">
                {hasSubmitted 
                  ? 'Bạn đã gửi câu trả lời. Chờ Host đặt câu mới để tiếp tục luyện tập.'
                  : room.showPhraseToParticipants
                    ? 'Host đã hiển thị câu mẫu bên dưới. Hãy gõ lại câu đó chính xác.'
                    : 'Host đã đặt một câu mẫu. Hãy gõ lại câu đó từ trí nhớ của bạn.'
                }
              </div>
              
              {/* Show target phrase if host enabled it */}
              {room.showPhraseToParticipants && room.targetPhrase && (
                <div className="mt-4 p-4 bg-white border-2 border-[#fc5d01] rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-[#fc5d01] mb-2 flex items-center gap-2">
                    👁️ Câu mẫu (Host đã hiển thị):
                  </div>
                  <div className="text-lg font-bold text-gray-800 bg-[#fedac2] p-3 rounded-lg border border-[#fdbc94]">
                    &quot;{room.targetPhrase}&quot;
                  </div>
                  <div className="text-xs text-[#fd7f33] mt-2 font-medium">
                    {hasSubmitted 
                      ? '✅ Đây là câu bạn vừa làm'
                      : '💡 Hãy gõ lại câu này chính xác vào ô bên dưới'
                    }
                  </div>
                </div>
              )}
              
              <div className="text-xs text-primary-600 mt-2">
                {room.showPhraseToParticipants 
                  ? '💡 Host đã cho phép bạn xem câu mẫu để tham khảo'
                  : '💡 Bạn không thể thấy câu mẫu. Hãy gõ chính xác những gì bạn nhớ được.'
                }
              </div>
            </div>
          )}

          {/* Enhanced input field */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs">✏️</span>
              Gõ câu trả lời của bạn:
            </label>
            <div className="relative">
              <textarea
                value={answer}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !room.targetPhrase 
                    ? "⏳ Chờ Host đặt câu mẫu..."
                    : hasSubmitted 
                      ? "✅ Chờ câu mới từ Host..."
                      : "💭 Gõ câu mà bạn nhớ được..."
                }
                className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 min-h-[140px] resize-none text-lg shadow-sm ${
                  loading || !room.targetPhrase || hasSubmitted 
                    ? 'bg-gray-50 border-gray-200 text-gray-500' 
                    : 'bg-white border-gray-300 text-gray-900 hover:border-primary-300'
                } ${
                  answer.length > 0 && !hasSubmitted ? 'border-blue-300 bg-blue-50/30' : ''
                }`}
                disabled={loading || !room.targetPhrase || hasSubmitted}
                maxLength={500}
              />
              
              {/* Typing indicator */}
              {answer.length > 0 && !hasSubmitted && (
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1 text-blue-500 text-xs animate-pulse">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <div className={`text-xs font-medium ${
                answer.length > 450 ? 'text-red-500' : 
                answer.length > 400 ? 'text-yellow-500' : 'text-gray-500'
              }`}>
                <span className="inline-flex items-center gap-1">
                  📝 {answer.length}/500 ký tự
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                {!hasSubmitted && room.targetPhrase && (
                  <>
                    <span>⌨️</span>
                    <span>Nhấn Enter để gửi</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced submit button */}
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || loading || !room.targetPhrase || hasSubmitted}
            className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg transform ${
              !answer.trim() || loading || !room.targetPhrase || hasSubmitted
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang gửi...</span>
                </>
              ) : !room.targetPhrase ? (
                <>
                  <span>⏳</span>
                  <span>Chờ câu mẫu...</span>
                </>
              ) : hasSubmitted ? (
                <>
                  <span>✅</span>
                  <span>Đã gửi - Chờ câu mới</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Gửi câu trả lời</span>
                </>
              )}
            </div>
          </button>

          {/* Show result if submitted */}
          {hasSubmitted && accuracy && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Kết quả câu vừa rồi:
              </h4>
              {renderAccuracyResult(accuracy)}
              
              {/* Try again button if not fully correct */}
              {!accuracy.isFullyCorrect && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleTryAgain}
                    className="btn-secondary px-6 py-2"
                  >
                    🔄 Thử lại câu này
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Bạn có thể thử lại cho đến khi đúng hoàn toàn
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          Hướng dẫn cho người tham gia
        </h3>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <span>Chờ Host đặt câu mẫu</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">2.</span>
            <span>Gõ lại câu đó từ trí nhớ (không được xem câu gốc)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">3.</span>
            <span>Hệ thống sẽ chấm điểm theo chuẩn PTE WFD</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">4.</span>
            <span>Nếu sai, bạn có thể thử lại cho đến khi đúng hoàn toàn</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">5.</span>
            <span>Chỉ câu đúng 100% mới được lưu vào lịch sử</span>
          </div>
        </div>
      </div>

      {/* Enhanced Submission History */}
      {submissionHistory.length > 0 && (
        <div className="card bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">📚</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Lịch sử luyện tập ({submissionHistory.length} câu hoàn thành)
            </h3>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {submissionHistory.map((submission, index) => (
              <div
                key={index}
                className={`p-5 border-2 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${
                  submission.accuracy.isFullyCorrect
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100'
                    : 'border-red-200 bg-gradient-to-br from-red-50 to-red-100'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                      submission.accuracy.isFullyCorrect ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {submission.accuracy.isFullyCorrect ? '🎉' : '💪'}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-700">
                        Câu #{submissionHistory.length - index}
                      </span>
                      <div className="text-xs text-gray-500">
                        {submission.timestamp.toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    submission.accuracy.accuracy >= 90 ? 'bg-green-200 text-green-800' :
                    submission.accuracy.accuracy >= 70 ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {submission.accuracy.accuracy.toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-1">📝 Câu gốc:</div>
                    <div className="text-sm text-gray-800 font-medium">
                      &quot;{submission.phrase}&quot;
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white/70 rounded-lg border border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-1">💬 Câu trả lời:</div>
                    <div className="text-sm text-gray-800">
                      &quot;{submission.answer}&quot;
                    </div>
                  </div>
                </div>
                
                {!submission.accuracy.isFullyCorrect && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {submission.accuracy.incorrect.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs">❌</span>
                          <span className="text-red-700 font-medium">Sai:</span>
                          <span className="text-red-600">{submission.accuracy.incorrect.join(', ')}</span>
                        </div>
                      )}
                      {submission.accuracy.missing.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs">⚠️</span>
                          <span className="text-orange-700 font-medium">Thiếu:</span>
                          <span className="text-orange-600">{submission.accuracy.missing.join(', ')}</span>
                        </div>
                      )}
                      {submission.accuracy.extra.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs">➕</span>
                          <span className="text-purple-700 font-medium">Thừa:</span>
                          <span className="text-purple-600">{submission.accuracy.extra.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Summary stats */}
          <div className="mt-6 pt-4 border-t-2 border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{submissionHistory.length}</div>
                <div className="text-xs text-green-700 font-medium">Câu hoàn thành</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {submissionHistory.length > 0 
                    ? (submissionHistory.reduce((sum, s) => sum + s.accuracy.accuracy, 0) / submissionHistory.length).toFixed(1)
                    : 0
                  }%
                </div>
                <div className="text-xs text-blue-700 font-medium">Độ chính xác TB</div>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">
                  {submissionHistory.filter(s => s.accuracy.isFullyCorrect).length}
                </div>
                <div className="text-xs text-primary-700 font-medium">Câu hoàn hảo</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PTE WFD Tips */}
      <div className="card bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">
          💡 Mẹo cho PTE Write From Dictation
        </h3>
        <div className="space-y-2 text-sm text-yellow-700">
          <div>• <strong>Nghe kỹ:</strong> Tập trung vào từng từ</div>
          <div>• <strong>Ghi nhớ:</strong> Nhớ thứ tự và chính tả</div>
          <div>• <strong>Viết chính xác:</strong> Mỗi từ sai sẽ bị trừ điểm</div>
          <div>• <strong>Kiểm tra:</strong> Đọc lại trước khi gửi</div>
          <div>• <strong>Luyện tập liên tục:</strong> Khung nhập luôn sẵn sàng cho câu tiếp theo</div>
        </div>
      </div>
    </div>
    </>
  );
}
