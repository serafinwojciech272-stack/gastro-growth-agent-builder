import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';

const flowItems = ['traffic', 'website', 'conversion', 'crm', 'commerce', 'analytics', 'growth'] as const;

export default function Problem() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const flowLabels = flowItems.map((key) => t(`problem.flow.${key}`));

  return (
    <section id="solutions" className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="max-w-3xl mb-16 lg:mb-24">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('problem.headline')}
          </h2>
        </SectionReveal>

        <div ref={ref} className="relative">
          {/* Flow diagram */}
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-0">
            {flowLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-4 lg:gap-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className={`relative px-4 py-2.5 rounded-md border text-xs sm:text-sm font-medium whitespace-nowrap ${
                    i === 0 || i === flowLabels.length - 1
                      ? 'border-[#f97316]/30 bg-[#f97316]/5 text-[#f97316]'
                      : 'border-[#27272a] bg-[#111113] text-[#a1a1aa]'
                  }`}
                >
                  {label}
                </motion.div>

                {i < flowLabels.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.2 }}
                    className="hidden lg:flex items-center justify-center w-8"
                  >
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                      <motion.path
                        d="M0 6h16M12 2l4 4-4 4"
                        stroke="#3f3f46"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={isInView ? { pathLength: 1 } : {}}
                        transition={{ duration: 0.5, delay: i * 0.15 + 0.3 }}
                      />
                    </svg>
                  </motion.div>
                )}

                {i < flowLabels.length - 1 && (
                  <div className="lg:hidden flex items-center justify-center py-1">
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                      <path d="M6 0v12M2 8l4 4 4-4" stroke="#3f3f46" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <SectionReveal delay={0.3} className="mt-12 lg:mt-16 max-w-2xl">
            <p className="text-base sm:text-lg text-[#a1a1aa] leading-relaxed">
              {t('problem.body')}
            </p>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
