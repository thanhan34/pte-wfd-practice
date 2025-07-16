'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">Lỗi</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Có lỗi xảy ra
        </h2>
        <p className="text-gray-600 mb-8">
          {error.message || 'Đã xảy ra lỗi không mong muốn'}
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
