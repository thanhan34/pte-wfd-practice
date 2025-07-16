export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            Phòng luyện đánh máy
          </h1>
          <h2 className="text-xl text-orange-500 mb-4">
            Nhóm thời gian thực
          </h2>
          <p className="text-gray-600">
            Luyện kỹ năng gõ chính xác cho PTE Write From Dictation
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-6">
              Chọn vai trò của bạn
            </h3>
            
            <button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-4 px-4 rounded-lg transition-colors duration-200 text-lg">
              🎯 Tạo phòng (Host)
            </button>
            
            <button className="w-full bg-orange-100 hover:bg-orange-200 text-orange-600 font-medium py-4 px-4 rounded-lg transition-colors duration-200 text-lg">
              👥 Tham gia phòng
            </button>

            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-600 mb-2">
                Cách sử dụng:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Host:</strong> Tạo phòng và đặt câu mẫu</li>
                <li>• <strong>Người tham gia:</strong> Nghe và gõ lại câu</li>
                <li>• Hệ thống sẽ chấm điểm theo chuẩn PTE WFD</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Ứng dụng luyện tập PTE Write From Dictation</p>
          <p className="mt-1">Phiên bản thời gian thực</p>
        </div>
      </div>
    </div>
  );
}
