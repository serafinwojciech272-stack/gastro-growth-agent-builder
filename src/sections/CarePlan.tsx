import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';
import { Check } from 'lucide-react';

export default function CarePlan() {
  const { t } = useLanguage();

  const tiers = t('carePlan.tiers') as Array<{
    name: string;
    price: string;
    features: string[];
  }>;

  return (
    <section className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#f97316' }}>
            {t('carePlan.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('carePlan.headline')}
          </h2>
        </SectionReveal>

        <div className="grid lg:grid-cols-3 gap-5 lg:gap-6">
          {tiers.map((tier, i) => (
            <SectionReveal key={tier.name} delay={i * 0.12}>
              <div className={`group relative p-6 sm:p-8 rounded-xl border h-full transition-all duration-300 ${
                i === 1
                  ? 'border-[#a78bfa]/30 bg-[#a78bfa]/[0.03]'
                  : 'border-[#27272a] bg-[#111113]/40 hover:bg-[#16161a]/60 hover:border-[#3f3f46]'
              }`}>
                {i === 1 && (
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#f97316]/40 to-transparent" />
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">{tier.name}</h3>
                  <p className="text-2xl font-bold tracking-tight text-[#f5f5f5]">{tier.price}</p>
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check size={14} className="mt-0.5 text-[#a78bfa] flex-shrink-0" />
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
