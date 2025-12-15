import { useState } from 'react';
import { Room, ParticipantData, SubmissionHistory } from '@/types';

// Helper function to format time
const formatTime = (date: Date): string => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return 'N/A';
  }
};

interface DetailedStatisticsProps {
  room: Room;
  hostId: string;
}

export default function DetailedStatistics({ room, hostId }: DetailedStatisticsProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Get participants excluding host
  const participants = Object.entries(room.participants)
    .filter(([userId]) => userId !== hostId)
    .map(([userId, data]) => ({ userId, ...data }));

  // Debug logs
  console.log('🔍 DETAILED STATISTICS DEBUG:');
  console.log('Total participants:', participants.length);
  participants.forEach(p => {
    console.log(`Participant ${p.nickname}:`);
    console.log('- submissionHistory:', p.submissionHistory);
    console.log('- submissionHistory length:', p.submissionHistory?.length || 0);
  });

  // Calculate overall statistics
  const totalSubmissions = participants.reduce((sum, p) => sum + (p.submissionHistory?.length || 0), 0);
  const totalErrors = participants.reduce((sum, p) => 
    sum + (p.submissionHistory?.filter(s => !s.accuracy.isFullyCorrect).length || 0), 0);
  const errorRate = totalSubmissions > 0 ? (totalErrors / totalSubmissions * 100) : 0;

  // Find most difficult phrases (highest error rate)
  const phraseStats: Record<string, { total: number; errors: number; participants: Set<string> }> = {};
  
  participants.forEach(participant => {
    participant.submissionHistory?.forEach(submission => {
      if (!phraseStats[submission.phrase]) {
        phraseStats[submission.phrase] = { total: 0, errors: 0, participants: new Set() };
      }
      phraseStats[submission.phrase].total++;
      phraseStats[submission.phrase].participants.add(participant.userId);
      if (!submission.accuracy.isFullyCorrect) {
        phraseStats[submission.phrase].errors++;
      }
    });
  });

  const sortedPhrases = Object.entries(phraseStats)
    .map(([phrase, stats]) => ({
      phrase,
      errorRate: (stats.errors / stats.total) * 100,
      totalAttempts: stats.total,
      errors: stats.errors,
      participantCount: stats.participants.size
    }))
    .sort((a, b) => b.errorRate - a.errorRate);

  // Get participant's error details
  const getParticipantErrors = (participant: ParticipantData & { userId: string }) => {
    return participant.submissionHistory?.filter(s => !s.accuracy.isFullyCorrect) || [];
  };

  // Get participant's correct submissions
  const getParticipantCorrect = (participant: ParticipantData & { userId: string }) => {
    return participant.submissionHistory?.filter(s => s.accuracy.isFullyCorrect) || [];
  };

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="card bg-gradient-to-r from-white to-[#fedac2] border-2 border-[#fc5d01] shadow-lg">
        <h3 className="text-xl font-bold text-[#fc5d01] mb-4 flex items-center gap-2">
          📈 Thống kê tổng quan
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-gray-200">
            <div className="text-3xl font-bold text-gray-800 mb-1">{participants.length}</div>
            <div className="text-sm font-medium text-gray-600">Người tham gia</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-xl shadow-md border-2 border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">{totalSubmissions}</div>
            <div className="text-sm font-medium text-blue-600">Tổng lần gửi</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-xl shadow-md border-2 border-red-200">
            <div className="text-3xl font-bold text-red-600 mb-1">{totalErrors}</div>
            <div className="text-sm font-medium text-red-600">Tổng lỗi</div>
          </div>
          
          <div className="text-center p-4 bg-[#fedac2] rounded-xl shadow-md border-2 border-[#fdbc94]">
            <div className="text-3xl font-bold text-[#fc5d01] mb-1">{errorRate.toFixed(1)}%</div>
            <div className="text-sm font-medium text-[#fd7f33]">Tỷ lệ lỗi</div>
          </div>
        </div>
      </div>

      {/* Most Difficult Phrases */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🎯 Câu khó nhất (tỷ lệ lỗi cao)
        </h3>
        
        {sortedPhrases.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {sortedPhrases.slice(0, 10).map((phraseData, index) => (
              <div key={phraseData.phrase} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      phraseData.errorRate >= 70 ? 'bg-red-100 text-red-800' :
                      phraseData.errorRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {phraseData.errorRate.toFixed(1)}% lỗi
                    </span>
                    <span className="text-xs text-gray-500">
                      {phraseData.errors}/{phraseData.totalAttempts} lần
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-800 font-medium">
                  "{phraseData.phrase}"
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {phraseData.participantCount} người đã thử
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <p>Chưa có dữ liệu thống kê</p>
          </div>
        )}
      </div>

      {/* Individual Participant Statistics */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            👥 Thống kê từng người ({participants.length} người)
          </h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyErrors}
                onChange={(e) => setShowOnlyErrors(e.target.checked)}
                className="rounded"
              />
              Chỉ hiện lỗi
            </label>
          </div>
        </div>

        {participants.length > 0 ? (
          <div className="space-y-4">
            {participants.map((participant) => {
              const errors = getParticipantErrors(participant);
              const correct = getParticipantCorrect(participant);
              const totalSubmissions = participant.submissionHistory?.length || 0;
              const errorCount = errors.length;
              const participantErrorRate = totalSubmissions > 0 ? (errorCount / totalSubmissions * 100) : 0;

              if (showOnlyErrors && errorCount === 0) return null;

              return (
                <div key={participant.userId} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800">{participant.nickname}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          ✅ {correct.length} đúng
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                          ❌ {errorCount} sai
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium">
                          {participantErrorRate.toFixed(1)}% lỗi
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedParticipant(
                        selectedParticipant === participant.userId ? null : participant.userId
                      )}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      {selectedParticipant === participant.userId ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </button>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div className="text-center">
                      <div className="font-bold text-gray-800">{totalSubmissions}</div>
                      <div className="text-gray-600">Tổng lần gửi</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{participant.correctCount}</div>
                      <div className="text-gray-600">Câu hoàn hảo</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">
                        {participant.averageTime ? (participant.averageTime / 1000).toFixed(1) + 's' : 'N/A'}
                      </div>
                      <div className="text-gray-600">Thời gian TB</div>
                    </div>
                  </div>

                  {/* Detailed view - All submissions in chronological order */}
                  {selectedParticipant === participant.userId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          📋 Toàn bộ lịch sử làm bài ({totalSubmissions} lần):
                        </h5>
                        
                        {participant.submissionHistory && participant.submissionHistory.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {participant.submissionHistory
                              .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
                              .map((submission, index) => (
                              <div 
                                key={index} 
                                className={`p-4 rounded-lg border-2 ${
                                  submission.accuracy.isFullyCorrect 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-red-50 border-red-200'
                                }`}
                              >
                                {/* Header with result and time */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                      {submission.accuracy.isFullyCorrect ? '✅' : '❌'}
                                    </span>
                                    <span className="font-medium text-sm">
                                      Lần {index + 1}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      submission.accuracy.accuracy >= 90 ? 'bg-green-100 text-green-800' :
                                      submission.accuracy.accuracy >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {submission.accuracy.accuracy.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatTime(submission.submittedAt)}
                                  </div>
                                </div>

                                {/* Phrase and answer */}
                                <div className="space-y-2">
                                  <div className="p-2 bg-white rounded border">
                                    <div className="text-xs font-medium text-gray-600 mb-1">📝 Câu gốc:</div>
                                    <div className="text-sm font-medium text-gray-800">
                                      "{submission.phrase}"
                                    </div>
                                  </div>
                                  
                                  <div className="p-2 bg-white rounded border">
                                    <div className="text-xs font-medium text-gray-600 mb-1">💬 Câu trả lời:</div>
                                    <div className={`text-sm font-medium ${
                                      submission.accuracy.isFullyCorrect ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                      "{submission.answer}"
                                    </div>
                                  </div>
                                </div>

                                {/* Error details if incorrect */}
                                {!submission.accuracy.isFullyCorrect && (
                                  <div className="mt-3 pt-2 border-t border-gray-200">
                                    <div className="grid grid-cols-1 gap-2 text-xs">
                                      {submission.accuracy.correct.length > 0 && (
                                        <div className="flex items-start gap-2">
                                          <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs flex-shrink-0 mt-0.5">✓</span>
                                          <div>
                                            <span className="text-green-700 font-medium">Từ đúng:</span>
                                            <span className="text-green-600 ml-1">{submission.accuracy.correct.join(', ')}</span>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {submission.accuracy.incorrect.length > 0 && (
                                        <div className="flex items-start gap-2">
                                          <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs flex-shrink-0 mt-0.5">✗</span>
                                          <div>
                                            <span className="text-red-700 font-medium">Từ sai:</span>
                                            <span className="text-red-600 ml-1">{submission.accuracy.incorrect.join(', ')}</span>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {submission.accuracy.missing.length > 0 && (
                                        <div className="flex items-start gap-2">
                                          <span className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs flex-shrink-0 mt-0.5">⚠</span>
                                          <div>
                                            <span className="text-orange-700 font-medium">Từ thiếu:</span>
                                            <span className="text-orange-600 ml-1">{submission.accuracy.missing.join(', ')}</span>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {submission.accuracy.extra.length > 0 && (
                                        <div className="flex items-start gap-2">
                                          <span className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs flex-shrink-0 mt-0.5">+</span>
                                          <div>
                                            <span className="text-purple-700 font-medium">Từ thừa:</span>
                                            <span className="text-purple-600 ml-1">{submission.accuracy.extra.join(', ')}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Success message for correct answers */}
                                {submission.accuracy.isFullyCorrect && (
                                  <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                                    <span>🎉</span>
                                    <span>Hoàn hảo! Tất cả từ đều chính xác.</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <div className="text-2xl mb-2">📝</div>
                            <p>Chưa có lịch sử làm bài</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">👥</div>
            <p>Chưa có người tham gia</p>
          </div>
        )}
      </div>
    </div>
  );
}
