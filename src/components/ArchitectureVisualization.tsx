import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';

const nodes = [
  { id: 'web', label: 'Web', x: 50, y: 20, color: '#f97316', glowColor: 'rgba(249,115,22,0.3)' },
  { id: 'commerce', label: 'Commerce', x: 20, y: 45, color: '#ef4444', glowColor: 'rgba(239,68,68,0.3)' },
  { id: 'api', label: 'APIs', x: 80, y: 45, color: '#eab308', glowColor: 'rgba(234,179,8,0.3)' },
  { id: 'analytics', label: 'Analytics', x: 35, y: 75, color: '#e11d48', glowColor: 'rgba(225,29,72,0.3)' },
  { id: 'ai', label: 'AI', x: 65, y: 75, color: '#a78bfa', glowColor: 'rgba(167,139,250,0.3)' },
  { id: 'data', label: 'Data', x: 50, y: 55, color: '#f5f5f5', glowColor: 'rgba(245,245,245,0.2)' },
];

const connections = [
  ['web', 'data'],
  ['commerce', 'data'],
  ['api', 'data'],
  ['analytics', 'data'],
  ['ai', 'data'],
  ['web', 'api'],
  ['commerce', 'api'],
  ['analytics', 'ai'],
];

export default function ArchitectureVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const parallaxX = useTransform(springX, [-0.5, 0.5], [-8, 8]);
  const parallaxY = useTransform(springY, [-0.5, 0.5], [-8, 8]);
  const parallaxX2 = useTransform(springX, [-0.5, 0.5], [-12, 12]);
  const parallaxY2 = useTransform(springY, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="relative w-full aspect-square max-w-lg mx-auto">
      <div className="absolute inset-0 rounded-2xl border border-[#27272a]/60 bg-[#111113]/80 backdrop-blur-sm overflow-hidden">
        {/* Grid background with colored dots */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, #f5f5f5 0.5px, transparent 0.5px), radial-gradient(circle, #f5f5f5 0.5px, transparent 0.5px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px',
          }}
        />

        <motion.svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{
          x: isMobile ? 0 : parallaxX,
          y: isMobile ? 0 : parallaxY,
        }}>
          {/* Connections with animated glow */}
          {connections.map(([from, to], i) => {
            const n1 = nodes.find((n) => n.id === from)!;
            const n2 = nodes.find((n) => n.id === to)!;
            return (
              <motion.line
                key={`${from}-${to}`}
                x1={`${n1.x}%`}
                y1={`${n1.y}%`}
                x2={`${n2.x}%`}
                y2={`${n2.y}%`}
                stroke="url(#lineGrad)"
                strokeWidth="0.4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.35 }}
                transition={{ duration: 1.5, delay: 0.8 + i * 0.15, ease: 'easeInOut' }}
              />
            );
          })}

          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Animated pulse along paths */}
          <circle r="0.8" fill="#f97316">
            <animateMotion
              dur="4s"
              repeatCount="indefinite"
              path="M50,20 Q30,35 50,55 Q70,70 50,75"
            />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
          </circle>
          <circle r="0.8" fill="#ef4444">
            <animateMotion
              dur="5s"
              repeatCount="indefinite"
              path="M20,45 Q35,50 50,55 Q65,60 80,45"
            />
            <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="1.2s" />
          </circle>
          <circle r="0.8" fill="#eab308">
            <animateMotion
              dur="3.5s"
              repeatCount="indefinite"
              path="M80,45 Q65,60 50,55 Q35,70 65,75"
            />
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.8s" />
          </circle>
        </motion.svg>

        {/* Nodes with parallax */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${node.x}%`, 
              top: `${node.y}%`,
              x: isMobile ? 0 : (i % 2 === 0 ? parallaxX : parallaxX2),
              y: isMobile ? 0 : (i % 2 === 0 ? parallaxY : parallaxY2),
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <div
                  className="w-3 h-3 rounded-full glow-subtle"
                  style={{ 
                    backgroundColor: node.color, 
                    boxShadow: `0 0 20px ${node.glowColor}, 0 0 40px ${node.glowColor}`,
                  }}
                />
                {/* Subtle ring pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: node.color, opacity: 0.3 }}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-medium tracking-wide uppercase"
                style={{ color: node.color, opacity: 0.7 }}>
                {node.label}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Corner accents with color */}
        <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-[#f97316]/30" />
        <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-[#ef4444]/30" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-[#eab308]/30" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-[#a78bfa]/30" />
      </div>
    </div>
  );
}
