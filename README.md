# Phòng luyện đánh máy nhóm thời gian thực

Ứng dụng web hỗ trợ luyện kỹ năng gõ chính xác cho PTE Write From Dictation (WFD) với tính năng thời gian thực.

## 🎯 Tính năng chính

### Host (Người tạo phòng)
- ✅ Tạo phòng và chia sẻ mã phòng
- ✅ Đặt câu mẫu cho người tham gia
- ✅ Theo dõi trạng thái thời gian thực của tất cả người tham gia
- ✅ Xem chi tiết kết quả và độ chính xác của từng người
- ✅ Thống kê tổng quan về tiến độ hoàn thành

### Người tham gia
- ✅ Tham gia phòng bằng mã phòng và nickname
- ✅ Gõ lại câu mẫu từ trí nhớ (không được xem câu gốc)
- ✅ Nhận phản hồi chi tiết về độ chính xác
- ✅ Xem phân tích từ đúng, sai, thiếu, thừa

### Hệ thống chấm điểm PTE WFD
- ✅ So sánh từng từ một cách chính xác
- ✅ Bỏ qua phân biệt hoa thường
- ✅ Phân loại: từ đúng, sai, thiếu, thừa
- ✅ Tính toán phần trăm độ chính xác

## 🚀 Công nghệ sử dụng

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase** - Authentication & Firestore database
- **Real-time updates** - Live status tracking

## 📦 Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd pte-wfd-practice
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình Firebase

Tạo project Firebase mới tại [Firebase Console](https://console.firebase.google.com/)

Bật các dịch vụ:
- Authentication (Anonymous)
- Firestore Database

Cập nhật file `src/lib/firebase.ts` với config của bạn:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 4. Chạy ứng dụng
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 🎮 Cách sử dụng

### Tạo phòng (Host)
1. Chọn "Tạo phòng (Host)"
2. Nhập nickname của bạn
3. Chia sẻ mã phòng với người tham gia
4. Đặt câu mẫu cho người tham gia gõ lại
5. Theo dõi trạng thái và kết quả thời gian thực

### Tham gia phòng
1. Chọn "Tham gia phòng"
2. Nhập mã phòng (6 ký tự)
3. Nhập nickname của bạn
4. Chờ Host đặt câu mẫu
5. Gõ lại câu từ trí nhớ và gửi
6. Xem kết quả chi tiết

## 📊 Hệ thống đánh giá

Ứng dụng sử dụng thuật toán chấm điểm tương tự PTE Write From Dictation:

- **Từ đúng** ✅: Từ có trong câu gốc và được gõ chính xác
- **Từ sai** ❌: Từ gõ sai chính tả hoặc không có trong câu gốc
- **Từ thiếu** ⚠️: Từ có trong câu gốc nhưng không được gõ
- **Từ thừa** ➕: Từ được gõ nhưng không có trong câu gốc

## 🎨 Giao diện

Ứng dụng sử dụng bảng màu cam chuyên nghiệp:
- `#fc5d01` - Cam đậm (Primary)
- `#fd7f33` - Cam rực
- `#ffac7b` - Cam sáng
- `#fdbc94` - Cam nhạt trung bình
- `#fedac2` - Cam nhạt rất nhẹ

## 🔧 Scripts

```bash
# Chạy development server
npm run dev

# Build production
npm run build

# Chạy production server
npm start

# Lint code
npm run lint
```

## 📝 Cấu trúc project

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Landing page
│   ├── globals.css     # Global styles
│   └── room/[roomId]/  # Room pages
├── components/         # React components
│   ├── HostControls.tsx
│   ├── ParticipantInterface.tsx
│   ├── ParticipantsList.tsx
│   └── LoadingSpinner.tsx
├── lib/               # Utilities
│   ├── firebase.ts    # Firebase config
│   ├── firestore.ts   # Database operations
│   └── utils.ts       # Helper functions
└── types/             # TypeScript types
    └── index.ts
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License.

## 🆘 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
