import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const solutions = t('footer.solutions') as string[];
  const industries = t('footer.industries') as string[];
  const company = t('footer.company') as string[];
  const legal = t('footer.legal') as string[];

  return (
    <footer className="border-t border-[#27272a] bg-[#0a0a0b]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <a href="#" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-md bg-[#16161a] border border-[#27272a] flex items-center justify-center group-hover:border-[#f97316]/40 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8h8M8 4v8" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-tight text-[#f5f5f5]">
                Digital Engineering
              </span>
            </a>
            <p className="text-xs text-[#71717a] leading-relaxed max-w-xs">
              High-performance digital systems for ambitious businesses in Germany and Europe.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">Solutions</h4>
            <ul className="space-y-2.5">
              {solutions.map((s) => (
                <li key={s}>
                  <span className="text-[13px] text-[#71717a] hover:text-[#a1a1aa] transition-colors cursor-default">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">Industries</h4>
            <ul className="space-y-2.5">
              {industries.map((i) => (
                <li key={i}>
                  <span className="text-[13px] text-[#71717a] hover:text-[#a1a1aa] transition-colors cursor-default">
                    {i}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              {company.map((c) => (
                <li key={c}>
                  <span className="text-[13px] text-[#71717a] hover:text-[#a1a1aa] transition-colors cursor-default">
                    {c}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {legal.map((l) => (
                <li key={l}>
                  <span className="text-[13px] text-[#71717a] hover:text-[#a1a1aa] transition-colors cursor-default">
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#27272a] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-[#52525b]">{t('footer.copyright')}</p>
          <p className="text-[11px] text-[#52525b]">Germany · Europe</p>
        </div>
      </div>
    </footer>
  );
}
