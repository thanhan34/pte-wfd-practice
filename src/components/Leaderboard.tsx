import { ParticipantData } from '@/types';

interface LeaderboardEntry {
  id: string;
  nickname: string;
  correctCount: number;
  totalAttempts: number;
  accuracy: number;
  averageTime: number;
  fastestTime: number;
  isHost: boolean;
}

interface LeaderboardProps {
  participants: { [userId: string]: ParticipantData };
  hostId: string;
  currentUserId: string;
}

export default function Leaderboard({ participants, hostId, currentUserId }: LeaderboardProps) {
  // Convert participants to leaderboard entries and sort by correct count and speed
  const leaderboardEntries: LeaderboardEntry[] = Object.entries(participants)
    .map(([userId, participant]) => ({
      id: userId,
      nickname: participant.nickname,
      correctCount: participant.correctCount || 0,
      totalAttempts: participant.totalAttempts || 0,
      accuracy: participant.totalAttempts > 0 
        ? (participant.correctCount || 0) / participant.totalAttempts * 100 
        : 0,
      averageTime: participant.averageTime || 0,
      fastestTime: participant.fastestTime || 0,
      isHost: userId === hostId
    }))
    .sort((a, b) => {
      // Sort by correct count first (higher is better)
      if (b.correctCount !== a.correctCount) {
        return b.correctCount - a.correctCount;
      }
      
      // If same correct count, sort by average time (lower is better)
      if (a.correctCount > 0 && b.correctCount > 0) {
        if (a.averageTime !== b.averageTime) {
          return a.averageTime - b.averageTime;
        }
        // If same average time, sort by fastest time (lower is better)
        return a.fastestTime - b.fastestTime;
      }
      
      // Fallback to accuracy
      return b.accuracy - a.accuracy;
    });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2: return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3: return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🏆 Bảng xếp hạng thời gian thực
      </h3>
      
      {leaderboardEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Chưa có dữ liệu xếp hạng</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboardEntries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.id === currentUserId;
            
            return (
              <div
                key={entry.id}
                className={`p-3 border rounded-lg transition-colors ${
                  isCurrentUser 
                    ? 'border-primary-300 bg-primary-50' 
                    : getRankColor(rank)
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold min-w-[40px]">
                      {getRankIcon(rank)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          isCurrentUser ? 'text-primary-800' : 'text-gray-800'
                        }`}>
                          {entry.nickname}
                        </span>
                        {entry.isHost && (
                          <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded">
                            Host
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Bạn
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        {entry.correctCount} câu đúng / {entry.totalAttempts} lần thử
                        {entry.totalAttempts > 0 && (
                          <span className="ml-2">
                            ({entry.accuracy.toFixed(1)}% chính xác)
                          </span>
                        )}
                        {entry.correctCount > 0 && entry.averageTime > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            ⚡ TB: {(entry.averageTime / 1000).toFixed(1)}s
                            {entry.fastestTime > 0 && (
                              <span className="ml-2">
                                🚀 Nhanh nhất: {(entry.fastestTime / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      isCurrentUser ? 'text-primary-600' : 'text-gray-700'
                    }`}>
                      {entry.correctCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      điểm
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Summary stats */}
      {leaderboardEntries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-800">
                {leaderboardEntries.reduce((sum, entry) => sum + entry.correctCount, 0)}
              </div>
              <div className="text-xs text-gray-600">Tổng câu đúng</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-gray-800">
                {leaderboardEntries.reduce((sum, entry) => sum + entry.totalAttempts, 0)}
              </div>
              <div className="text-xs text-gray-600">Tổng lần thử</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-gray-800">
                {leaderboardEntries.length > 0 
                  ? (leaderboardEntries.reduce((sum, entry) => sum + entry.accuracy, 0) / leaderboardEntries.length).toFixed(1)
                  : 0
                }%
              </div>
              <div className="text-xs text-gray-600">Độ chính xác TB</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
