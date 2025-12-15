import { UserStatus } from '@/types';

interface ParticipantWithStatus {
  id: string;
  nickname: string;
  status: UserStatus;
}

interface StatisticsPanelProps {
  participants: ParticipantWithStatus[];
  hostId: string;
  currentPhraseIndex?: number;
  totalPhrases: number;
  targetPhrase?: string;
}

export default function StatisticsPanel({ 
  participants, 
  hostId, 
  currentPhraseIndex, 
  totalPhrases,
  targetPhrase 
}: StatisticsPanelProps) {
  // Statistics - Exclude host from all statistics
  const participantsOnly = participants.filter(p => p.id !== hostId);
  const totalParticipants = participantsOnly.length;
  const waitingCount = participantsOnly.filter(p => p.status === 'waiting').length;
  const typingCount = participantsOnly.filter(p => p.status === 'typing').length;
  const submittedCount = participantsOnly.filter(p => p.status === 'correct' || p.status === 'incorrect').length;
  const correctCount = participantsOnly.filter(p => p.status === 'correct').length;

  return (
    <div className="card bg-gradient-to-r from-white to-[#fedac2] border-2 border-[#fc5d01] shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#fc5d01] flex items-center gap-2">
          📊 Thống kê thời gian thực
        </h3>
        {targetPhrase && (
          <div className="text-xs text-[#fc5d01] bg-[#fedac2] px-3 py-1 rounded-full font-medium">
            Câu {currentPhraseIndex !== undefined ? currentPhraseIndex + 1 : '?'}/{totalPhrases}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-white rounded-xl shadow-md border-2 border-gray-200 hover:border-[#fc5d01] transition-colors">
          <div className="text-3xl font-bold text-gray-800 mb-1">{totalParticipants}</div>
          <div className="text-sm font-medium text-gray-600">Tổng số</div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-xl shadow-md border-2 border-blue-200 hover:border-blue-400 transition-colors">
          <div className="text-3xl font-bold text-blue-600 mb-1">{typingCount}</div>
          <div className="text-sm font-medium text-blue-600">Đang gõ</div>
        </div>
        
        <div className="text-center p-4 bg-[#fedac2] rounded-xl shadow-md border-2 border-[#fdbc94] hover:border-[#fc5d01] transition-colors">
          <div className="text-3xl font-bold text-[#fc5d01] mb-1">{submittedCount}</div>
          <div className="text-sm font-medium text-[#fd7f33]">Đã gửi</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-xl shadow-md border-2 border-green-200 hover:border-green-400 transition-colors">
          <div className="text-3xl font-bold text-green-600 mb-1">{correctCount}</div>
          <div className="text-sm font-medium text-green-600">Đúng hết</div>
        </div>
      </div>

      {/* Progress bar */}
      {totalParticipants > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Tiến độ hoàn thành</span>
            <span className="text-[#fc5d01] font-bold">{submittedCount}/{totalParticipants}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner border border-gray-300">
            <div
              className="bg-gradient-to-r from-[#fd7f33] to-[#fc5d01] h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${(submittedCount / totalParticipants) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center font-medium">
            {((submittedCount / totalParticipants) * 100).toFixed(1)}% hoàn thành
          </div>
        </div>
      )}

      {/* Accuracy summary */}
      {submittedCount > 0 && (
        <div className="pt-4 border-t-2 border-[#fdbc94]">
          <h4 className="text-sm font-semibold text-[#fc5d01] mb-3 flex items-center gap-2">
            🎯 Tóm tắt độ chính xác
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors">
              <div className="font-bold text-green-800 text-lg">{correctCount} người</div>
              <div className="text-green-600 font-medium">Đúng hoàn toàn ({((correctCount / submittedCount) * 100).toFixed(1)}%)</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border-2 border-red-200 hover:border-red-400 transition-colors">
              <div className="font-bold text-red-800 text-lg">{submittedCount - correctCount} người</div>
              <div className="text-red-600 font-medium">Có sai sót ({(((submittedCount - correctCount) / submittedCount) * 100).toFixed(1)}%)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
