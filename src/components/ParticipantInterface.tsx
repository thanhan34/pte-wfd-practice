import { useState, useEffect } from 'react';
import { Room, User, AccuracyResult } from '@/types';
import Countdown from './Countdown';

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

  // Save submission to history only when fully correct
  useEffect(() => {
    if (isSubmitted && accuracy && accuracy.isFullyCorrect && room.targetPhrase && currentParticipant?.submission) {
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
    const isTyping = value.length > 0 && !hasSubmitted;
    onTypingStatusChange(isTyping);
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
        {/* Overall result */}
        <div className={`p-4 rounded-lg text-center ${
          accuracy.isFullyCorrect 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="text-4xl mb-2">
            {accuracy.isFullyCorrect ? '✅' : '❌'}
          </div>
          <div className={`text-lg font-semibold ${
            accuracy.isFullyCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {accuracy.isFullyCorrect ? 'Hoàn hảo!' : 'Có sai sót'}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Độ chính xác: {accuracy.accuracy.toFixed(1)}%
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
      {/* Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Trạng thái của bạn
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            hasSubmitted 
              ? (accuracy?.isFullyCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
              : (answer.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')
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
                  : 'Host đã đặt một câu mẫu. Hãy gõ lại câu đó từ trí nhớ của bạn.'
                }
              </div>
              <div className="text-xs text-primary-600 mt-2">
                💡 Bạn không thể thấy câu mẫu. Hãy gõ chính xác những gì bạn nhớ được.
              </div>
            </div>
          )}

          {/* Always show input field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gõ câu trả lời của bạn:
            </label>
            <textarea
              value={answer}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                !room.targetPhrase 
                  ? "Chờ Host đặt câu mẫu..."
                  : hasSubmitted 
                    ? "Chờ câu mới từ Host..."
                    : "Gõ câu mà bạn nhớ được..."
              }
              className="input-field min-h-[120px] resize-none text-lg"
              disabled={loading || !room.targetPhrase || hasSubmitted}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                {answer.length}/500 ký tự
              </div>
              <div className="text-xs text-gray-500">
                {!hasSubmitted && room.targetPhrase && "Nhấn Enter để gửi"}
              </div>
            </div>
          </div>

          {/* Submit button - always visible */}
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || loading || !room.targetPhrase || hasSubmitted}
            className="w-full btn-primary py-3 text-lg"
          >
            {loading 
              ? 'Đang gửi...' 
              : !room.targetPhrase 
                ? 'Chờ câu mẫu...'
                : hasSubmitted 
                  ? 'Đã gửi - Chờ câu mới'
                  : 'Gửi câu trả lời'
            }
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

      {/* Submission History */}
      {submissionHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Lịch sử luyện tập ({submissionHistory.length} câu)
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {submissionHistory.map((submission, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  submission.accuracy.isFullyCorrect
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {submission.accuracy.isFullyCorrect ? '✅' : '❌'}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      Câu #{submissionHistory.length - index}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {submission.accuracy.accuracy.toFixed(1)}% chính xác
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Câu gốc:</strong> &quot;{submission.phrase}&quot;
                </div>
                
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Câu trả lời:</strong> &quot;{submission.answer}&quot;
                </div>
                
                {!submission.accuracy.isFullyCorrect && (
                  <div className="text-xs text-gray-600 mt-2">
                    {submission.accuracy.incorrect.length > 0 && (
                      <span className="text-red-600">
                        Sai: {submission.accuracy.incorrect.join(', ')}
                      </span>
                    )}
                    {submission.accuracy.missing.length > 0 && (
                      <span className="text-orange-600 ml-2">
                        Thiếu: {submission.accuracy.missing.join(', ')}
                      </span>
                    )}
                    {submission.accuracy.extra.length > 0 && (
                      <span className="text-purple-600 ml-2">
                        Thừa: {submission.accuracy.extra.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
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
