import type { ReactNode } from 'react';
import { ArrowRight, CalendarDays, Check, ChevronDown, Clock3, Mail, MapPin, Phone, Quote, Star } from 'lucide-react';
import { BUILDER_COMPONENT_REGISTRY, type BuilderComponent, type ComponentInstance } from '../../domain/websiteBuilderSchema';

type RendererProps = {
  nodes: ComponentInstance[];
  content: Record<string, unknown>;
  accent?: string;
};

type Item = Record<string, unknown>;

const MAX_ITEMS = 6;

export function SchemaRenderer({ nodes, content, accent = '#7C3AED' }: RendererProps) {
  const safeAccent = isCssColor(accent) ? accent : '#7C3AED';

  return (
    <div className="min-h-full bg-white text-zinc-950 antialiased" style={{ '--builder-accent': safeAccent } as React.CSSProperties}>
      {nodes.map((node) => (
        <SchemaBlock key={node.id} node={node} content={content} accent={safeAccent} />
      ))}
    </div>
  );
}

function SchemaBlock({ node, content, accent }: { node: ComponentInstance; content: Record<string, unknown>; accent: string }): ReactNode {
  if (!(BUILDER_COMPONENT_REGISTRY as readonly string[]).includes(node.component)) return null;

  const refs = node.props?.contentRefs ?? [];
  const title = resolveTitle(node.component, content);
  const description = resolveDescription(content);
  const items = resolveItems(refs, content);
  const id = safeId(node.id);

  switch (node.component) {
    case 'SiteHeader':
      return (
        <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-8" aria-label="Site header">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <a href="#top" className="min-w-0 truncate text-base font-bold tracking-tight text-zinc-950 hover:opacity-80">
              {businessName(content)}
            </a>
            <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex" aria-label="Primary navigation">
              {['About', 'Offer', 'Contact'].map((label) => (
                <a key={label} href={`#${label.toLowerCase()}`} className="transition-colors hover:text-zinc-950">{label}</a>
              ))}
            </nav>
            <a href="#contact" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5" style={{ backgroundColor: accent }}>
              {cta(content)}
            </a>
          </div>
        </header>
      );

    case 'Hero':
      return (
        <section id="top" className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:py-36" aria-labelledby={`${id}-heading`}>
          <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 75% 20%, ${accent}22, transparent 45%)` }} />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.22em]" style={{ color: accent }}>{vertical(content)}</p>
              <h1 id={`${id}-heading`} className="mt-5 text-4xl font-black leading-[1.02] tracking-[-.035em] sm:text-6xl lg:text-7xl">{headline(content, title)}</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">{description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#contact" className="inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ backgroundColor: accent }}>
                  {cta(content)} <ArrowRight size={16} />
                </a>
                <a href="#about" className="rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">Explore</a>
              </div>
            </div>
            <div className="hidden min-h-[300px] rounded-[2rem] border border-zinc-200 bg-zinc-50 p-5 shadow-xl lg:block">
              <div className="flex h-full min-h-[260px] items-end rounded-[1.5rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 p-7 text-white">
                <div>
                  <div className="mb-3 flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-white/40" />)}</div>
                  <p className="text-sm text-white/60">{businessName(content)}</p>
                  <p className="mt-2 text-2xl font-bold">{title}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      );

    case 'Proof':
      return <ContentSection id="proof" node={node} title={title} description={description}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.length ? items.map((item, i) => <ProofCard key={i} item={item} accent={accent} />) : <ProofCard item={{ title: 'Built for trust', text: 'Clear information, credible proof and a focused customer journey.' }} accent={accent} />}</div></ContentSection>;

    case 'FeatureGrid':
      return <ContentSection id="features" node={node} title={title} description={description}><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{(items.length ? items : [{ title: 'Clear value', text: 'Make the most important information obvious.' }, { title: 'Fast journey', text: 'Reduce friction between intent and action.' }, { title: 'Responsive', text: 'A consistent experience across screen sizes.' }]).map((item, i) => <FeatureCard key={i} item={item} accent={accent} />)}</div></ContentSection>;

    case 'Offer':
      return <ContentSection id="offer" node={node} title={title} description={description}><div className="grid gap-4 md:grid-cols-2">{(items.length ? items : [{ title: 'Primary offer', text: description }]).map((item, i) => <article key={i} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8"><span className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: accent }}>Offer {i + 1}</span><h3 className="mt-3 text-xl font-bold">{itemText(item, 'title', title)}</h3><p className="mt-3 leading-7 text-zinc-600">{itemText(item, 'text', description)}</p><a href="#contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold" style={{ color: accent }}>Learn more <ArrowRight size={15} /></a></article>)}</div></ContentSection>;

    case 'Media':
      return <ContentSection id="media" node={node} title={title} description={description}><div className="grid gap-4 md:grid-cols-2">{(items.length ? items : [{ title: 'Featured experience', text: description }]).slice(0, 4).map((item, i) => <div key={i} className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50"><div className="aspect-[16/9] bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-950" /><div className="p-5"><h3 className="font-bold">{itemText(item, 'title', 'Featured')}</h3><p className="mt-2 text-sm leading-6 text-zinc-600">{itemText(item, 'text', description)}</p></div></div>)}</div></ContentSection>;

    case 'Timeline':
      return <ContentSection id="timeline" node={node} title={title} description={description}><ol className="mx-auto max-w-3xl">{(items.length ? items : [{ title: 'Start', text: 'Choose the next step.' }, { title: 'Build', text: 'Move through a clear process.' }, { title: 'Launch', text: 'Turn intent into action.' }]).map((item, i) => <li key={i} className="relative flex gap-5 pb-8 last:pb-0"><span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: accent }}>{i + 1}</span><div><h3 className="font-bold">{itemText(item, 'title', `Step ${i + 1}`)}</h3><p className="mt-1 leading-7 text-zinc-600">{itemText(item, 'text', description)}</p></div></li>)}</ol></ContentSection>;

    case 'Faq':
      return <ContentSection id="faq" node={node} title={title} description={description}><div className="mx-auto max-w-3xl divide-y divide-zinc-200 rounded-2xl border border-zinc-200">{(items.length ? items : [{ question: 'How does it work?', answer: description }, { question: 'How do I get started?', answer: cta(content) }]).map((item, i) => <details key={i} className="group p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{itemText(item, 'question', `Question ${i + 1}`)}<ChevronDown size={17} className="transition-transform group-open:rotate-180" /></summary><p className="mt-3 pr-8 leading-7 text-zinc-600">{itemText(item, 'answer', description)}</p></details>)}</div></ContentSection>;

    case 'Venue':
      return <ContentSection id="venue" node={node} title={title} description={description}><div className="grid gap-4 md:grid-cols-3">{[['Location', MapPin], ['Hours', Clock3], ['Date', CalendarDays]].map(([label, Icon], i) => <div key={String(label)} className="rounded-2xl border border-zinc-200 p-5"><Icon size={19} style={{ color: accent }} /><p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">{String(label)}</p><p className="mt-1 font-semibold">{items[i] ? itemText(items[i], 'text', itemText(items[i], 'value', 'Details')) : i === 0 ? 'See contact details' : 'See current availability'}</p></div>)}</div></ContentSection>;

    case 'About':
      return <ContentSection id="about" node={node} title={title} description={description}><div className="max-w-3xl rounded-3xl bg-zinc-50 p-7 sm:p-10"><p className="text-lg leading-8 text-zinc-700">{description}</p>{items.slice(0, 3).map((item, i) => <p key={i} className="mt-4 flex gap-3 text-sm leading-6 text-zinc-600"><Check size={17} className="mt-1 shrink-0" style={{ color: accent }} />{itemText(item, 'text', itemText(item, 'description', 'Trusted experience and customer focus.'))}</p>)}</div></ContentSection>;

    case 'Testimonials':
      return <ContentSection id="testimonials" node={node} title={title} description={description}><div className="grid gap-4 md:grid-cols-3">{(items.length ? items : [{ text: 'A clear, credible experience from first visit to action.', name: 'Customer' }]).map((item, i) => <blockquote key={i} className="rounded-3xl border border-zinc-200 p-6"><Quote size={22} style={{ color: accent }} /><p className="mt-4 leading-7 text-zinc-700">“{itemText(item, 'text', description)}”</p><footer className="mt-5 flex items-center gap-2 text-sm font-semibold"><Star size={14} fill="currentColor" style={{ color: accent }} />{itemText(item, 'name', 'Customer')}</footer></blockquote>)}</div></ContentSection>;

    case 'Contact':
      return <ContentSection id="contact" node={node} title={title} description={description}><div className="grid gap-4 sm:grid-cols-3">{[['Email', Mail, contactValue(content, 'email')], ['Phone', Phone, contactValue(content, 'phone')], ['Location', MapPin, contactValue(content, 'address')]].map(([label, Icon, value]) => <div key={String(label)} className="rounded-2xl border border-zinc-200 p-5"><Icon size={18} style={{ color: accent }} /><p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">{String(label)}</p><p className="mt-1 break-words font-semibold">{String(value || 'Available on request')}</p></div>)}</div></ContentSection>;

    case 'Cta':
      return <section id="cta" className="px-5 py-12 sm:px-8 sm:py-16" aria-labelledby={`${id}-heading`}><div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-8 text-white shadow-xl sm:p-12" style={{ background: `linear-gradient(135deg, ${accent}, #18181b)` }}><h2 id={`${id}-heading`} className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h2><p className="mt-4 max-w-2xl text-white/75">{description}</p><a href="#contact" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-zinc-950">{cta(content)} <ArrowRight size={16} /></a></div></section>;

    case 'Gallery':
      return <ContentSection id="gallery" node={node} title={title} description={description}><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{Array.from({ length: Math.min(Math.max(items.length, 3), 6) }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300" aria-label={`Gallery image ${i + 1}`} />)}</div></ContentSection>;

    case 'Stats':
      return <ContentSection id="stats" node={node} title={title} description={description}><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{(items.length ? items : [{ value: '100%', label: 'Focus' }, { value: '24/7', label: 'Access' }, { value: '1', label: 'Clear journey' }]).map((item, i) => <div key={i} className="rounded-2xl border border-zinc-200 p-5 text-center"><div className="text-3xl font-black" style={{ color: accent }}>{itemText(item, 'value', String(i + 1))}</div><div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{itemText(item, 'label', 'Key fact')}</div></div>)}</div></ContentSection>;

    case 'Footer':
      return <footer className="border-t border-zinc-200 px-5 py-10 sm:px-8" aria-label="Site footer"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between"><span>{businessName(content)}</span><a href="#top" className="hover:text-zinc-950">Back to top</a></div></footer>;

    default:
      return null;
  }
}

function ContentSection({ id, node, title, description, children }: { id: string; node: ComponentInstance; title: string; description: string; children: ReactNode }) {
  const Heading = node.accessibility?.headingLevel === 1 ? 'h1' : 'h2';
  return <section id={id} className="scroll-mt-24 px-5 py-14 sm:px-8 sm:py-20" aria-labelledby={`${safeId(node.id)}-heading`}><div className="mx-auto max-w-7xl"><Heading id={`${safeId(node.id)}-heading`} className="text-3xl font-black tracking-tight sm:text-4xl">{title}</Heading>{description && <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">{description}</p>}<div className="mt-8">{children}</div></div></section>;
}

function ProofCard({ item, accent }: { item: Item; accent: string }) {
  return <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="h-9 w-9 rounded-xl" style={{ backgroundColor: `${accent}18` }} /><h3 className="mt-4 font-bold">{itemText(item, 'title', 'Proof point')}</h3><p className="mt-2 text-sm leading-6 text-zinc-600">{itemText(item, 'text', 'Evidence that supports the decision.')}</p></article>;
}

function FeatureCard({ item, accent }: { item: Item; accent: string }) {
  return <article className="rounded-2xl border border-zinc-200 p-6 transition-transform hover:-translate-y-0.5"><div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundColor: accent }}><Check size={18} /></div><h3 className="mt-5 font-bold">{itemText(item, 'title', 'Feature')}</h3><p className="mt-2 text-sm leading-6 text-zinc-600">{itemText(item, 'text', itemText(item, 'description', 'Designed around the customer journey.'))}</p></article>;
}

function resolveItems(refs: string[], content: Record<string, unknown>): Item[] {
  const pools = ['entities', 'facts', 'claims', 'sections', 'offers', 'faqs', 'testimonials', 'stats', 'proposedCopy', 'content'];
  const result: Item[] = [];
  for (const pool of pools) {
    const value = content[pool];
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (!isItem(item)) continue;
      if (!refs.length || refs.some((ref) => ref === item.id || ref === item.key || ref === item.slug)) result.push(item);
    }
  }
  if (!result.length && refs.length) {
    for (const ref of refs.slice(0, MAX_ITEMS)) result.push({ text: ref, title: ref });
  }
  return dedupeItems(result).slice(0, MAX_ITEMS);
}

function resolveTitle(component: BuilderComponent, content: Record<string, unknown>): string {
  const titles: Partial<Record<BuilderComponent, string>> = {
    Hero: headline(content, 'A clearer digital experience.'),
    Proof: 'Why people trust the brand',
    FeatureGrid: 'What matters most',
    Offer: 'The offer',
    Media: 'Experience',
    Timeline: 'How it works',
    Faq: 'Frequently asked questions',
    Venue: 'Venue',
    About: 'About',
    Testimonials: 'What customers say',
    Contact: 'Contact',
    Cta: 'Ready to take the next step?',
    Gallery: 'Gallery',
    Stats: 'Key facts',
  };
  return titles[component] ?? businessName(content);
}

function businessName(content: Record<string, unknown>) { return stringValue(content.businessName, 'Growth Advisor'); }
function headline(content: Record<string, unknown>, fallback: string) { return stringValue(content.headline, stringValue(content.heroHeadline, fallback)); }
function cta(content: Record<string, unknown>) { return stringValue(content.primaryCta, 'Get started'); }
function vertical(content: Record<string, unknown>) { return stringValue(content.vertical, 'Growth Advisor'); }
function resolveDescription(content: Record<string, unknown>) { return stringValue(content.subheadline, stringValue(content.description, 'Clear, trustworthy and conversion-focused.')); }

function contactValue(content: Record<string, unknown>, key: string) {
  const direct = content[key];
  if (typeof direct === 'string' && direct.trim()) return direct;
  const contact = isItem(content.contact) ? content.contact : {};
  return stringValue(contact[key], '');
}

function itemText(item: Item, key: string, fallback: string) {
  const value = item[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function stringValue(value: unknown, fallback: string) { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function isItem(value: unknown): value is Item { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function dedupeItems(items: Item[]) {
  const seen = new Set<string>();
  return items.filter((item) => { const key = String(item.id ?? item.key ?? item.slug ?? item.title ?? item.text ?? Math.random()); if (seen.has(key)) return false; seen.add(key); return true; });
}
function safeId(value: string) { return value.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'section'; }
function isCssColor(value: string) { return /^#[0-9a-fA-F]{3,8}$/.test(value) || /^(rgb|hsl)a?\\(/.test(value); }
