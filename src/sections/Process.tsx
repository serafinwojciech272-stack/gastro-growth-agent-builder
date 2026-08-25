import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';

export default function Process() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const steps = t('process.steps') as Array<{
    num: string;
    title: string;
    desc: string;
  }>;

  return (
    <section id="process" className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#f97316' }}>
            {t('process.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('process.headline')}
          </h2>
        </SectionReveal>

        <div ref={ref} className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-[#27272a] lg:-translate-x-px" />

          <div className="space-y-8 lg:space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={`relative lg:grid lg:grid-cols-2 lg:gap-12 ${
                  i > 0 ? 'lg:mt-12' : ''
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-4 lg:left-1/2 top-0 w-2 h-2 rounded-full -translate-x-[3px] z-10" style={{ backgroundColor: '#f97316', boxShadow: '0 0 12px rgba(249, 115, 22, 0.4)' }} />

                {/* Content */}
                <div className={`pl-12 lg:pl-0 ${i % 2 === 0 ? 'lg:pr-16 lg:text-right' : 'lg:col-start-2 lg:pl-16'}`}>
                  <div className={`inline-flex items-center gap-3 mb-3 ${i % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}>
                    <span className="text-[10px] font-semibold tracking-wider" style={{ color: '#f97316' }}>
                      {step.num}
                    </span>
                    <span className="text-lg font-semibold text-[#f5f5f5]">{step.title}</span>
                  </div>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed max-w-md lg:max-w-sm">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
