import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';

export default function WhatWeBuild() {
  const { t } = useLanguage();

  const modules = t('whatWeBuild.modules') as Array<{
    num: string;
    title: string;
    desc: string;
    tech: string;
  }>;

  const moduleColors = [
    { num: '#f97316', icon: '#f97316' },
    { num: '#ef4444', icon: '#ef4444' },
    { num: '#eab308', icon: '#eab308' },
    { num: '#e11d48', icon: '#e11d48' },
    { num: '#a78bfa', icon: '#a78bfa' },
  ];

  return (
    <section className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4"
             style={{ color: '#f97316' }}>
            {t('whatWeBuild.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('whatWeBuild.headline')}
          </h2>
        </SectionReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {modules.map((mod, i) => (
            <SectionReveal key={mod.num} delay={i * 0.1}>
              <div className="group relative p-6 sm:p-8 rounded-xl border border-[#27272a] bg-[#111113]/50 hover:bg-[#16161a]/80 transition-all duration-300 h-full border-gradient-hover">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-[11px] font-semibold tracking-wider transition-colors"
                      style={{ color: moduleColors[i].num }}>
                      {mod.num}
                    </span>
                    <div className="w-6 h-6 rounded-full border border-[#27272a] group-hover:border-[#f97316]/40 flex items-center justify-center transition-all duration-300">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5h6M5 2v6" stroke="currentColor" strokeWidth="1" className="text-[#3f3f46] group-hover:text-[#f97316] transition-colors" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#f5f5f5] mb-3 group-hover:text-white transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed mb-4">
                    {mod.desc}
                  </p>
                  <p className="text-[11px] text-[#52525b] font-mono leading-relaxed">
                    {mod.tech}
                  </p>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
