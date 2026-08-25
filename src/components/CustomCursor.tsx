import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], input, textarea, select, label, .cursor-pointer')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isVisible]);

  const glowSize = isHovering ? 40 : 20;
  const dotSize = isHovering ? 6 : 4;

  return (
    <>
      <div
        className="cursor-glow hidden md:block"
        style={{
          transform: `translate(${position.x - glowSize / 2}px, ${position.y - glowSize / 2}px)`,
          width: `${glowSize}px`,
          height: `${glowSize}px`,
          opacity: isVisible ? 1 : 0,
          transition: 'width 0.2s ease, height 0.2s ease, opacity 0.3s ease',
        }}
      />
      <div
        className="cursor-glow-dot hidden md:block"
        style={{
          transform: `translate(${position.x - dotSize / 2}px, ${position.y - dotSize / 2}px)`,
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          opacity: isVisible ? 1 : 0,
          transition: 'width 0.15s ease, height 0.15s ease, opacity 0.3s ease',
        }}
      />
    </>
  );
}
