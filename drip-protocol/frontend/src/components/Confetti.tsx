import { useEffect, useMemo } from "react";

const COLORS = [
  "hsl(36 100% 50%)",   // primary amber
  "hsl(43 96% 56%)",    // amber-400
  "hsl(48 97% 77%)",    // amber-200
  "hsl(199 89% 48%)",   // water-500
  "hsl(199 91% 64%)",   // water-400
  "hsl(142 71% 45%)",   // success
];

interface ConfettiProps {
  duration?: number;
  onComplete?: () => void;
}

export function Confetti({ duration = 2000, onComplete }: ConfettiProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        fallDuration: 1 + Math.random() * 1.5,
        rotation: Math.random() * 360,
        size: 6 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        drift: (Math.random() - 0.5) * 60,
      })),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) translateX(0) rotate(var(--rot)); opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(calc(var(--rot) + 720deg)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-particle { animation: none !important; opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle absolute top-0 rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            "--rot": `${p.rotation}deg`,
            "--drift": `${p.drift}px`,
            animation: `confetti-fall ${p.fallDuration}s ease-in ${p.delay}s forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
