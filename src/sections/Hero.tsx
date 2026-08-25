import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import ArchitectureVisualization from '../components/ArchitectureVisualization';
import GradientMesh from '../components/GradientMesh';
import TextReveal from '../components/TextReveal';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Animated gradient mesh background - ZASKAKUJĄCE */}
      <GradientMesh intensity={1.2} />

      {/* Subtle radial overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(10,10,11,0.4),_transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase mb-6"
              style={{ color: '#f97316' }}
            >
              {t('hero.eyebrow')}
            </motion.p>

            {/* TextReveal headline - ZASKAKUJĄCE */}
            <TextReveal
              tag="h1"
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] text-[#f5f5f5] mb-6"
              delay={0.2}
              staggerDelay={0.06}
            >
              {t('hero.headline')}
            </TextReveal>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-base sm:text-lg text-[#a1a1aa] leading-relaxed max-w-xl mb-8"
            >
              {t('hero.subheadline')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75 }}
              className="flex flex-wrap gap-3"
            >
              <a
                href="#contact"
                className="group relative px-6 py-3 text-sm font-medium bg-[#f5f5f5] text-[#0a0a0b] rounded-md hover:bg-white transition-all overflow-hidden"
              >
                <span className="relative z-10">{t('hero.ctaPrimary')}</span>
                {/* Animated border glow on hover */}
                <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ boxShadow: '0 0 30px rgba(249, 115, 22, 0.3), 0 0 60px rgba(239, 68, 68, 0.15)' }}
                />
              </a>
              <a
                href="#work"
                className="px-6 py-3 text-sm font-medium border border-[#3f3f46] text-[#f5f5f5] rounded-md hover:border-[#f97316]/40 hover:bg-[#f97316]/5 transition-all"
              >
                {t('hero.ctaSecondary')}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="order-1 lg:order-2"
          >
            <ArchitectureVisualization />
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0b] to-transparent" />
    </section>
  );
}
