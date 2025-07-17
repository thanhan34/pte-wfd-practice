import { useEffect, useState } from 'react';

interface CelebrationEffectProps {
  show: boolean;
  onComplete?: () => void;
}

export default function CelebrationEffect({ show, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Tạo particles cho hiệu ứng
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);

      // Tự động ẩn sau 2 giây
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Background overlay với animation */}
      <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
      
      {/* Celebration text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-celebration text-6xl font-bold text-green-600 drop-shadow-lg">
          🎉 CHÍNH XÁC! 🎉
        </div>
      </div>

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute celebration-particle text-2xl"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`
          }}
        >
          {['🎊', '✨', '🌟', '💫', '🎈'][particle.id % 5]}
        </div>
      ))}

      {/* Confetti effect */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full celebration-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#fc5d01', '#fedac2', '#ffac7b', '#fd7f33', '#22c55e'][i % 5],
              animationDelay: `${Math.random() * 1}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
