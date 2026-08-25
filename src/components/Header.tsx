import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../i18n/translations';

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: t('nav.solutions'), href: '#solutions' },
    { label: t('nav.industries'), href: '#industries' },
    { label: t('nav.work'), href: '#work' },
    { label: t('nav.process'), href: '#process' },
    { label: t('nav.technology'), href: '#technology' },
    { label: t('nav.insights'), href: '#insights' },
  ];

  const langs: Language[] = ['de', 'en', 'pl'];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-[#27272a]/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md bg-[#16161a] border border-[#27272a] flex items-center justify-center group-hover:border-[#f97316]/40 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8h8M8 4v8" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#f5f5f5]">
              Digital Engineering
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-[13px] font-medium text-[#a1a1aa] hover:text-[#f5f5f5] transition-colors rounded-md hover:bg-[#1e1e22]/60"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#71717a]">
              {langs.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded transition-colors ${
                    lang === l
                      ? 'text-[#a78bfa] bg-[#a78bfa]/10'
                      : 'hover:text-[#a1a1aa] hover:bg-[#1e1e22]/60'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a
              href="#contact"
              className="px-4 py-2 text-[13px] font-medium bg-[#f5f5f5] text-[#0a0a0b] rounded-md hover:bg-white transition-colors"
            >
              {t('nav.cta')}
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-[#a1a1aa] hover:text-[#f5f5f5]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-[#27272a] bg-[#0a0a0b]/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-5 py-4 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-[#a1a1aa] hover:text-[#f5f5f5] rounded-md hover:bg-[#1e1e22]/60"
                >
                  {item.label}
                </a>
              ))}
              <div className="flex items-center gap-2 pt-3 pb-1 px-3">
                {langs.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
                      lang === l
                        ? 'text-[#a78bfa] bg-[#a78bfa]/10'
                        : 'text-[#71717a] hover:text-[#a1a1aa]'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="block mt-2 px-4 py-2.5 text-sm font-medium bg-[#f5f5f5] text-[#0a0a0b] rounded-md text-center"
              >
                {t('nav.cta')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
