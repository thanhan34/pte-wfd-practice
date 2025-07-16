import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Phòng luyện đánh máy nhóm thời gian thực',
  description: 'Ứng dụng luyện kỹ năng gõ chính xác cho PTE Write From Dictation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
