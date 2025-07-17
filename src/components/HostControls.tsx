import { useState, useEffect } from 'react';
import { Room, ParticipantData, UserStatus, AccuracyResult } from '@/types';
import { setNextPhrase, triggerAudioPlayback } from '@/lib/phrase-management';
import { getGlobalPhrases, addGlobalPhrases, removeGlobalPhrase, updateGlobalPhrases } from '@/lib/global-phrases';
import { parseCSV, validateCSVFile, downloadSampleCSV } from '@/lib/csv-parser';

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
  onSetTargetPhrase: (phrase: string) => Promise<void>;
  onToggleShowPhrase: (show: boolean) => Promise<void>;
}

export default function HostControls({ 
  room, 
  participants, 
  onSetTargetPhrase,
  onToggleShowPhrase
}: HostControlsProps) {
  const [targetPhrase, setTargetPhrase] = useState('');
  const [phraseList, setPhraseList] = useState<string[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState<number | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvError, setCsvError] = useState('');

  // Load global phrases
  useEffect(() => {
    const loadPhrases = async () => {
      try {
        const phrases = await getGlobalPhrases();
        setPhraseList(phrases);
      } catch (error) {
        console.error('Error loading global phrases:', error);
      }
    };
    
    loadPhrases();
  }, []);

  const handleSetActivePhrase = async (phrase: string, index: number) => {
    setLoading(true);
    setSelectedPhraseIndex(index);
    try {
      await onSetTargetPhrase(phrase);
    } catch (error) {
      console.error('Error setting target phrase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhrase = async () => {
    if (!newPhrase.trim()) return;
    
    try {
      await addGlobalPhrases([newPhrase.trim()]);
      setNewPhrase('');
      // Reload phrases
      const updatedPhrases = await getGlobalPhrases();
      setPhraseList(updatedPhrases);
    } catch (error) {
      console.error('Error adding phrase:', error);
    }
  };

  const handleRemovePhrase = async (index: number) => {
    try {
      const phraseToRemove = phraseList[index];
      await removeGlobalPhrase(phraseToRemove);
      
      // Reload phrases
      const updatedPhrases = await getGlobalPhrases();
      setPhraseList(updatedPhrases);
      
      // Reset selected index if removed phrase was selected
      if (selectedPhraseIndex === index) {
        setSelectedPhraseIndex(null);
      } else if (selectedPhraseIndex !== null && selectedPhraseIndex > index) {
        setSelectedPhraseIndex(selectedPhraseIndex - 1);
      }
    } catch (error) {
      console.error('Error removing phrase:', error);
    }
  };

  const handleEditPhrase = async (index: number, newText: string) => {
    try {
      const updatedList = [...phraseList];
      updatedList[index] = newText;
      await updateGlobalPhrases(updatedList);
      setPhraseList(updatedList);
    } catch (error) {
      console.error('Error editing phrase:', error);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    
    setLoading(true);
    try {
      // Split by lines and filter out empty lines
      const newPhrases = bulkText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => line.length <= 200); // Max length check
      
      if (newPhrases.length === 0) return;
      
      // Add to global phrases
      await addGlobalPhrases(newPhrases);
      
      // Reload phrases
      const updatedPhrases = await getGlobalPhrases();
      setPhraseList(updatedPhrases);
      
      setBulkText('');
      setShowBulkAdd(false);
    } catch (error) {
      console.error('Error bulk adding phrases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearBulk = () => {
    setBulkText('');
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvImporting(true);
    setCsvError('');

    try {
      // Validate and read CSV file
      const csvContent = await validateCSVFile(file);
      
      // Parse CSV content
      const parsedPhrases = parseCSV(csvContent);
      
      if (parsedPhrases.length === 0) {
        setCsvError('Không tìm thấy câu hợp lệ trong file CSV');
        return;
      }

      // Add to global phrases
      await addGlobalPhrases(parsedPhrases);
      
      // Reload phrases
      const updatedPhrases = await getGlobalPhrases();
      setPhraseList(updatedPhrases);
      
      // Reset file input
      event.target.value = '';
      
      // Show success message (you could add a toast here)
      console.log(`✅ Đã import ${parsedPhrases.length} câu từ CSV`);
      
    } catch (error: any) {
      setCsvError(error.message || 'Lỗi khi import CSV');
      console.error('CSV import error:', error);
    } finally {
      setCsvImporting(false);
    }
  };

  const handleDownloadSample = () => {
    downloadSampleCSV();
  };

  const handleNextPhrase = async () => {
    if (phraseList.length === 0) return;
    
    setLoading(true);
    try {
      await setNextPhrase(room.id);
    } catch (error) {
      console.error('Error setting next phrase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplayForParticipants = async () => {
    try {
      await triggerAudioPlayback(room.id);
    } catch (error) {
      console.error('Error triggering audio playback:', error);
    }
  };

  // Text-to-speech function for host to replay phrase
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

  // Statistics - Exclude host from all statistics
  const participantsOnly = participants.filter(p => p.id !== room.hostId);
  const totalParticipants = participantsOnly.length;
  const waitingCount = participantsOnly.filter(p => p.status === 'waiting').length;
  const typingCount = participantsOnly.filter(p => p.status === 'typing').length;
  const submittedCount = participantsOnly.filter(p => p.status === 'correct' || p.status === 'incorrect').length;
  const correctCount = participantsOnly.filter(p => p.status === 'correct').length;

  // Statistics Component
  const StatisticsPanel = () => (
    <div className="card bg-gradient-to-r from-white to-[#fedac2] border-2 border-[#fc5d01] shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#fc5d01] flex items-center gap-2">
          📊 Thống kê thời gian thực
        </h3>
        {room.targetPhrase && (
          <div className="text-xs text-[#fc5d01] bg-[#fedac2] px-3 py-1 rounded-full font-medium">
            Câu {room.currentPhraseIndex !== undefined ? room.currentPhraseIndex + 1 : '?'}/{phraseList.length}
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

  return (
    <div className="space-y-6">
      {/* Statistics Panel - Moved to top */}
      <StatisticsPanel />
      {/* WFD Phrase Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Quản lý danh sách câu WFD
        </h3>

        {/* CSV Import Section */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-green-800">
              📄 Import từ file CSV
            </h4>
            <button
              onClick={handleDownloadSample}
              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
            >
              📥 Tải file mẫu
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                disabled={csvImporting}
                className="text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
              />
              {csvImporting && (
                <div className="text-xs text-green-600">
                  Đang import...
                </div>
              )}
            </div>
            
            {csvError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                ❌ {csvError}
              </div>
            )}
            
            <div className="text-xs text-green-700">
              💡 <strong>Hướng dẫn:</strong> File CSV phải có câu WFD ở cột đầu tiên, mỗi câu một dòng. 
              Tải file mẫu để xem định dạng chính xác.
            </div>
          </div>
        </div>

        {/* Add new phrase */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Thêm câu WFD:
            </label>
            <button
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              {showBulkAdd ? 'Thêm từng câu' : 'Thêm hàng loạt'}
            </button>
          </div>

          {!showBulkAdd ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Nhập câu WFD mới..."
                className="input-field flex-1"
                maxLength={200}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPhrase()}
              />
              <button
                onClick={handleAddPhrase}
                disabled={!newPhrase.trim()}
                className="btn-primary whitespace-nowrap"
              >
                Thêm
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              placeholder="Nhập nhiều câu WFD, mỗi câu một dòng:&#10;&#10;The lecture was about climate change&#10;Students should submit their assignments on time&#10;Technology has revolutionized modern education"
                className="input-field min-h-[120px] resize-none text-sm"
                maxLength={5000}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {bulkText.split('\n').filter(line => line.trim()).length} câu sẽ được thêm
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearBulk}
                    disabled={!bulkText.trim()}
                    className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400"
                  >
                    Xóa hết
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    disabled={!bulkText.trim()}
                    className="btn-primary text-xs px-4 py-1"
                  >
                    Thêm tất cả
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current active phrase */}
        {room.targetPhrase && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-primary-600 font-medium">
                🎯 Câu đang sử dụng:
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => speakPhrase(room.targetPhrase)}
                  className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors"
                >
                  🔊 Host nghe
                </button>
                <button
                  onClick={handleReplayForParticipants}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                >
                  📢 Phát cho tất cả
                </button>
                <button
                  onClick={handleNextPhrase}
                  disabled={loading || phraseList.length === 0}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Đang chuyển...' : '⏭️ Câu tiếp theo'}
                </button>
              </div>
            </div>
            <div className="text-lg font-medium text-primary-800">
              &quot;{room.targetPhrase}&quot;
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-primary-600">
                Người tham gia đang thực hành với câu này
              </div>
              {room.currentPhraseIndex !== undefined && phraseList.length > 0 && (
                <div className="text-xs text-primary-500">
                  Câu {room.currentPhraseIndex + 1}/{phraseList.length}
                </div>
              )}
            </div>
            
            {/* Toggle show phrase to participants */}
            <div className="mt-4 pt-4 border-t border-primary-200">
              <div className="flex items-center justify-between">
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
                  className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
                    room.showPhraseToParticipants
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {room.showPhraseToParticipants ? '🙈 Ẩn câu' : '👁️ Hiện câu'}
                </button>
              </div>
              <div className="text-xs text-primary-600 mt-2">
                {room.showPhraseToParticipants 
                  ? '💡 Người tham gia có thể thấy câu mẫu để tham khảo'
                  : '💡 Người tham gia không thể thấy câu mẫu, phải gõ từ trí nhớ'
                }
              </div>
            </div>
          </div>
        )}

        {/* Phrase list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Danh sách câu WFD ({phraseList.length} câu):
          </h4>
          
          {phraseList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>Chưa có câu nào trong danh sách</p>
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
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          room.targetPhrase === phrase
                            ? 'bg-primary-200 text-primary-700 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {loading && selectedPhraseIndex === index ? 'Đang đặt...' : 'Sử dụng'}
                      </button>
                      
                      <button
                        onClick={() => handleRemovePhrase(index)}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Instructions */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="text-lg font-semibold text-primary-800 mb-3">
          Hướng dẫn cho Host
        </h3>
        <div className="space-y-2 text-sm text-primary-700">
          <div className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <span>Tạo danh sách các câu WFD để luyện tập</span>
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
        </div>
      </div>
    </div>
  );
}
