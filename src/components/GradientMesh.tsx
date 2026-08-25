import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface GradientMeshProps {
  className?: string;
  intensity?: number;
}

export default function GradientMesh({ className = '', intensity = 1 }: GradientMeshProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        style={{ y: y1, opacity: isVisible ? opacity : 0 }}
        className="absolute inset-0"
      >
        {/* Orange blob */}
        <div
          className="mesh-blob mesh-blob-1"
          style={{
            width: '45%',
            height: '45%',
            top: '10%',
            left: '5%',
            background: `radial-gradient(circle, rgba(249, 115, 22, ${0.12 * intensity}) 0%, transparent 70%)`,
          }}
        />
        {/* Red blob */}
        <div
          className="mesh-blob mesh-blob-2"
          style={{
            width: '40%',
            height: '40%',
            top: '40%',
            right: '10%',
            background: `radial-gradient(circle, rgba(239, 68, 68, ${0.10 * intensity}) 0%, transparent 70%)`,
          }}
        />
        {/* Yellow blob */}
        <div
          className="mesh-blob mesh-blob-3"
          style={{
            width: '35%',
            height: '35%',
            bottom: '15%',
            left: '25%',
            background: `radial-gradient(circle, rgba(234, 179, 8, ${0.08 * intensity}) 0%, transparent 70%)`,
          }}
        />
        {/* Magenta blob */}
        <div
          className="mesh-blob mesh-blob-1"
          style={{
            width: '30%',
            height: '30%',
            top: '20%',
            right: '25%',
            background: `radial-gradient(circle, rgba(225, 29, 72, ${0.09 * intensity}) 0%, transparent 70%)`,
            animationDelay: '5s',
          }}
        />
        {/* Purple accent blob */}
        <div
          className="mesh-blob mesh-blob-2"
          style={{
            width: '25%',
            height: '25%',
            bottom: '5%',
            right: '5%',
            background: `radial-gradient(circle, rgba(167, 139, 250, ${0.10 * intensity}) 0%, transparent 70%)`,
            animationDelay: '8s',
          }}
        />
      </motion.div>

      {/* Subtle grid lines overlay for premium feel */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(245, 245, 245, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 245, 245, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
