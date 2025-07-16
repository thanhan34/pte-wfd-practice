export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Trang không tìm thấy
        </h2>
        <p className="text-gray-600 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <a
          href="/"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
