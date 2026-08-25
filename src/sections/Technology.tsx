import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';

const layers = ['experience', 'commerce', 'data', 'business', 'ai', 'infrastructure'] as const;

const layerTech: Record<string, string[]> = {
  experience: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Framer Motion', 'Three.js'],
  commerce: ['WooCommerce', 'Shopify', 'Stripe', 'Next.js Commerce', 'Payment APIs'],
  data: ['PostgreSQL', 'Supabase', 'REST APIs', 'GraphQL', 'Webhooks'],
  business: ['CRM', 'ERP', 'PIM', 'Auth', 'RBAC'],
  ai: ['OpenAI', 'LLMs', 'Vector DBs', 'LangChain', 'n8n'],
  infrastructure: ['Vercel', 'Cloud', 'CI/CD', 'Monitoring', 'CDN'],
};

export default function Technology() {
  const { t } = useLanguage();
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const layerLabels = t('technology.layers') as Record<string, string>;

  return (
    <section id="technology" className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#a78bfa] uppercase mb-4">
            {t('technology.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('technology.headline')}
          </h2>
        </SectionReveal>

        <div ref={ref} className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Architecture diagram */}
          <div className="relative">
            <div className="relative p-6 sm:p-8 rounded-xl border border-[#27272a] bg-[#111113]/60">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {layers.map((layer, i) => (
                  <motion.button
                    key={layer}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    onClick={() => setActiveLayer(activeLayer === layer ? null : layer)}
                    onMouseEnter={() => setActiveLayer(layer)}
                    onMouseLeave={() => setActiveLayer(null)}
                    className={`relative p-4 rounded-lg border text-left transition-all duration-300 ${
                      activeLayer === layer
                        ? 'border-[#a78bfa]/40 bg-[#a78bfa]/[0.06]'
                        : 'border-[#27272a] bg-[#16161a]/60 hover:border-[#3f3f46]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold tracking-wider text-[#71717a] uppercase block mb-1">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-[#f5f5f5] block">
                      {layerLabels[layer] || layer}
                    </span>
                    {activeLayer === layer && (
                      <motion.div
                        layoutId="techHighlight"
                        className="absolute inset-0 rounded-lg border border-[#a78bfa]/30"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Connection lines between layers */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
                <motion.line
                  x1="50%" y1="33%" x2="50%" y2="67%"
                  stroke="#a78bfa"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.5, delay: 0.8 }}
                />
                <motion.line
                  x1="33%" y1="33%" x2="50%" y2="67%"
                  stroke="#a78bfa"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.5, delay: 1.0 }}
                />
                <motion.line
                  x1="66%" y1="33%" x2="50%" y2="67%"
                  stroke="#a78bfa"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.5, delay: 1.2 }}
                />
              </svg>
            </div>
          </div>

          {/* Tech details */}
          <div className="space-y-6">
            {layers.map((layer, i) => (
              <motion.div
                key={layer}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  activeLayer === layer
                    ? 'border-[#a78bfa]/30 bg-[#a78bfa]/[0.04]'
                    : 'border-transparent hover:border-[#27272a]'
                }`}
                onMouseEnter={() => setActiveLayer(layer)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#f5f5f5]">
                    {layerLabels[layer] || layer}
                  </span>
                  <span className="text-[10px] font-semibold text-[#71717a] tracking-wider">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {layerTech[layer].map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 text-[11px] font-medium text-[#a1a1aa] bg-[#16161a] border border-[#27272a] rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <SectionReveal delay={0.4} className="mt-12 lg:mt-16">
          <p className="text-sm text-[#52525b] font-mono leading-relaxed text-center">
            {t('technology.techList')}
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}
