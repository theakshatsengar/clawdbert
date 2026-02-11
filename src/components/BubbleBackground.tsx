import { useEffect, useState } from "react";

interface Bubble {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

export const BubbleBackground = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const generated: Bubble[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 20 + 4,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 20,
    }));
    setBubbles(generated);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep sea gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,50%,4%)] via-[hsl(210,45%,7%)] to-[hsl(195,40%,5%)]" />
      
      {/* Subtle underwater caustics */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(ellipse at 20% 50%, hsl(180 60% 30% / 0.15), transparent 50%), 
                           radial-gradient(ellipse at 80% 30%, hsl(200 50% 25% / 0.1), transparent 50%),
                           radial-gradient(ellipse at 50% 80%, hsl(0 60% 30% / 0.08), transparent 40%)`
        }}
      />

      {/* Bubbles */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.left}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
