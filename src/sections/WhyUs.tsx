import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';

export default function WhyUs() {
  const { t } = useLanguage();

  const points = t('whyUs.points') as Array<{
    title: string;
    desc: string;
  }>;

  return (
    <section className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20 max-w-3xl">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#f97316' }}>
            {t('whyUs.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('whyUs.headline')}
          </h2>
        </SectionReveal>

        <div className="grid sm:grid-cols-2 gap-5 lg:gap-6">
          {points.map((point, i) => (
            <SectionReveal key={point.title} delay={i * 0.1}>
              <div className="group p-6 sm:p-8 rounded-xl border border-[#27272a] bg-[#111113]/40 hover:bg-[#16161a]/60 hover:border-[#3f3f46] transition-all duration-300 h-full">
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#f97316]/20 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M7 2v10" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2 group-hover:text-white transition-colors">
                      {point.title}
                    </h3>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">
                      {point.desc}
                    </p>
                  </div>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
