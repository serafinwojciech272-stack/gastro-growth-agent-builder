import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';
import GradientMesh from '../components/GradientMesh';
import TextReveal from '../components/TextReveal';

export default function FinalCTA() {
  const { t } = useLanguage();

  return (
    <section id="contact" className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
      {/* Gradient mesh - ZASKAKUJĄCE */}
      <GradientMesh intensity={1.5} />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 text-center">
        <TextReveal
          tag="h2"
          className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight text-[#f5f5f5] mb-6"
          delay={0.1}
          staggerDelay={0.06}
        >
          {t('finalCta.headline')}
        </TextReveal>

        <SectionReveal delay={0.4}>
          <p className="text-base sm:text-lg text-[#a1a1aa] leading-relaxed max-w-2xl mx-auto mb-10">
            {t('finalCta.subheadline')}
          </p>
        </SectionReveal>

        <SectionReveal delay={0.55}>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#"
              className="group relative px-8 py-3.5 text-sm font-medium bg-[#f5f5f5] text-[#0a0a0b] rounded-md hover:bg-white transition-all overflow-hidden"
            >
              <span className="relative z-10">{t('finalCta.ctaPrimary')}</span>
              <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: '0 0 40px rgba(249, 115, 22, 0.3), 0 0 80px rgba(239, 68, 68, 0.15)' }}
              />
            </a>
            <a
              href="#"
              className="px-8 py-3.5 text-sm font-medium border border-[#3f3f46] text-[#f5f5f5] rounded-md hover:border-[#f97316]/40 hover:bg-[#f97316]/5 transition-all"
            >
              {t('finalCta.ctaSecondary')}
            </a>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
