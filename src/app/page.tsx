export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
        <h1 style={{ color: '#ea580c', fontSize: '2rem', marginBottom: '1rem' }}>
          Phòng luyện đánh máy
        </h1>
        <h2 style={{ color: '#fb923c', fontSize: '1.5rem', marginBottom: '1rem' }}>
          Nhóm thời gian thực
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Luyện kỹ năng gõ chính xác cho PTE Write From Dictation
        </p>
        
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            Chọn vai trò của bạn
          </h3>
          
          <button style={{
            width: '100%',
            backgroundColor: '#ea580c',
            color: 'white',
            padding: '1rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            marginBottom: '1rem',
            cursor: 'pointer'
          }}>
            🎯 Tạo phòng (Host)
          </button>
          
          <button style={{
            width: '100%',
            backgroundColor: '#fed7aa',
            color: '#ea580c',
            padding: '1rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            cursor: 'pointer'
          }}>
            👥 Tham gia phòng
          </button>
        </div>

        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          <p>Ứng dụng luyện tập PTE Write From Dictation</p>
          <p>Phiên bản thời gian thực</p>
        </div>
      </div>
    </div>
  );
}
