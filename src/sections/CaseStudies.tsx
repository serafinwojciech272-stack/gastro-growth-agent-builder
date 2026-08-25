import { useLanguage } from '../context/LanguageContext';
import SectionReveal from '../components/SectionReveal';

export default function CaseStudies() {
  const { t } = useLanguage();

  const cases = t('caseStudies.cases') as Array<{
    client: string;
    industry: string;
    problem: string;
    solution: string;
    result: string;
    stack: string;
  }>;

  return (
    <section id="work" className="relative py-24 sm:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <SectionReveal className="mb-16 lg:mb-20">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#f97316' }}>
            {t('caseStudies.eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
            {t('caseStudies.headline')}
          </h2>
        </SectionReveal>

        <div className="space-y-8 lg:space-y-10">
          {cases.map((cs, i) => (
            <SectionReveal key={cs.client} delay={i * 0.15}>
              <div className="group relative grid lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-10 p-6 sm:p-8 lg:p-10 rounded-xl border border-[#27272a] bg-[#111113]/40 hover:bg-[#16161a]/60 hover:border-[#3f3f46] transition-all duration-300">
                {/* Left column */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase border border-[#f97316]/20 rounded" style={{ color: '#f97316' }}>
                        {cs.industry}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#f5f5f5] group-hover:text-white transition-colors">
                      {cs.client}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-semibold tracking-wider text-[#71717a] uppercase mb-1.5">Problem</h4>
                      <p className="text-sm text-[#a1a1aa] leading-relaxed">{cs.problem}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold tracking-wider text-[#71717a] uppercase mb-1.5">Solution</h4>
                      <p className="text-sm text-[#a1a1aa] leading-relaxed">{cs.solution}</p>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-6 lg:border-l lg:border-[#27272a] lg:pl-10">
                  <div>
                    <h4 className="text-[10px] font-semibold tracking-wider text-[#71717a] uppercase mb-1.5">Result</h4>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">{cs.result}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold tracking-wider text-[#71717a] uppercase mb-1.5">Stack</h4>
                    <p className="text-[11px] text-[#52525b] font-mono leading-relaxed">{cs.stack}</p>
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
