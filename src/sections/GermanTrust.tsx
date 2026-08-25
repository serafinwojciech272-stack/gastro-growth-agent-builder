import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';
import { Shield, Accessibility, MessageSquare, FileCheck, Clock, Server, FileText } from 'lucide-react';

const icons = [Shield, Accessibility, MessageSquare, FileCheck, Clock, Server, FileText];

export default function GermanTrust() {
  const { t } = useLanguage();

  const points = t('germanTrust.points') as string[];

  return (
    <section className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20 max-w-3xl">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#f97316' }}>
            {t('germanTrust.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('germanTrust.headline')}
          </h2>
        </SectionReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {points.map((point, i) => {
            const Icon = icons[i % icons.length];
            return (
              <SectionReveal key={point} delay={i * 0.08}>
                <div className="group flex items-start gap-4 p-5 sm:p-6 rounded-xl border border-[#27272a] bg-[#111113]/40 hover:bg-[#16161a]/60 hover:border-[#3f3f46] transition-all duration-300">
                  <div className="mt-0.5 w-9 h-9 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#f97316]/20 transition-colors">
                    <Icon size={16} className="text-[#f97316]" />
                  </div>
                  <span className="text-sm text-[#a1a1aa] leading-relaxed group-hover:text-[#d4d4d8] transition-colors">
                    {point}
                  </span>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
