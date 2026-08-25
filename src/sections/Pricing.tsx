import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';

export default function Pricing() {
  const { t } = useLanguage();

  const tiers = t('pricing.tiers') as Array<{
    name: string;
    price: string;
    desc: string;
  }>;

  return (
    <section id="solutions" className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20 max-w-3xl">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#f97316' }}>
            {t('pricing.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('pricing.headline')}
          </h2>
        </SectionReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {tiers.map((tier, i) => (
            <SectionReveal key={tier.name} delay={i * 0.1}>
              <div className="group relative p-6 sm:p-7 rounded-xl border border-[#27272a] bg-[#111113]/40 hover:bg-[#16161a]/60 hover:border-[#3f3f46] transition-all duration-300 h-full flex flex-col">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-[#f5f5f5] mb-2 group-hover:text-white transition-colors">
                    {tier.name}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f5f5]">
                    {tier.price}
                  </p>
                </div>
                <p className="text-sm text-[#a1a1aa] leading-relaxed flex-grow">
                  {tier.desc}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal delay={0.4} className="mt-10">
          <p className="text-xs text-[#52525b] text-center leading-relaxed">
            {t('pricing.disclaimer')}
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}
