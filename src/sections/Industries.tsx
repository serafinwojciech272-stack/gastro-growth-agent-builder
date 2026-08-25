import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';

export default function Industries() {
  const { t } = useLanguage();

  const gastronomy = t('industries.gastronomy') as { title: string; features: string[] };
  const retail = t('industries.retail') as { title: string; features: string[] };
  const b2b = t('industries.b2b') as { title: string; features: string[] };

  const industries = [
    { ...gastronomy, accent: true },
    { ...retail, accent: false },
    { ...b2b, accent: false },
  ];

  return (
    <section id="industries" className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#f97316' }}>
            {t('industries.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('industries.headline')}
          </h2>
        </SectionReveal>

        <div className="grid lg:grid-cols-3 gap-5 lg:gap-6">
          {industries.map((ind, i) => (
            <SectionReveal key={ind.title} delay={i * 0.12}>
              <div
                className={`relative p-6 sm:p-8 rounded-xl border h-full transition-all duration-300 ${
                  ind.accent
                    ? 'border-[#a78bfa]/30 bg-[#a78bfa]/[0.03] hover:border-[#a78bfa]/50'
                    : 'border-[#27272a] bg-[#111113]/50 hover:border-[#3f3f46]'
                }`}
              >
                {ind.accent && (
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#f97316]/40 to-transparent" />
                )}

                <h3 className="text-lg sm:text-xl font-semibold text-[#f5f5f5] mb-6">
                  {ind.title}
                </h3>

                <ul className="space-y-3">
                  {ind.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-[#a78bfa] flex-shrink-0" />
                      <span className="text-sm text-[#a1a1aa] leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
