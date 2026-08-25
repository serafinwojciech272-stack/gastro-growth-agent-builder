import { useEffect, useState } from 'react';

export default function NoiseOverlay() {
  const [opacity, setOpacity] = useState(0.022);

  useEffect(() => {
    // Slightly vary opacity for "living film grain" effect
    let frame: number;
    const animate = () => {
      setOpacity(0.018 + Math.random() * 0.008);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
        mixBlendMode: 'overlay',
      }}
      aria-hidden="true"
    />
  );
}
