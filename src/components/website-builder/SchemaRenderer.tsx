import type { ReactNode } from 'react';
import { BUILDER_COMPONENT_REGISTRY, type BuilderComponent, type ComponentInstance } from '../../domain/websiteBuilderSchema';

type RendererProps = {
  nodes: ComponentInstance[];
  content: Record<string, unknown>;
  accent?: string;
};

export function SchemaRenderer({ nodes, content, accent = '#7C3AED' }: RendererProps) {
  return (
    <div className="min-h-full bg-white text-zinc-950">
      {nodes.map((node) => (
        <SchemaBlock key={node.id} node={node} content={content} accent={accent} />
      ))}
    </div>
  );
}

function SchemaBlock({ node, content, accent }: { node: ComponentInstance; content: Record<string, unknown>; accent: string }): ReactNode {
  if (!(BUILDER_COMPONENT_REGISTRY as readonly string[]).includes(node.component)) return null;
  const title = resolveTitle(node.component, content);
  const refs = node.props.contentRefs;
  const items = refs.map((ref) => resolveContent(ref, content)).filter(Boolean).slice(0, 6);

  switch (node.component) {
    case 'SiteHeader':
      return <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur"><strong>{title}</strong><nav className="hidden gap-5 text-sm text-zinc-500 sm:flex">{items.slice(0, 4).map((item, i) => <span key={i}>{item}</span>)}</nav></header>;
    case 'Hero':
      return <section className="px-6 py-24 sm:px-12 sm:py-32"><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.2em]" style={{ color: accent }}>{String(content.vertical ?? '')}</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">{String(content.subheadline ?? '')}</p><button className="mt-8 rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>{String(content.primaryCta ?? 'Get started')}</button></div></section>;
    case 'Cta':
      return <section className="px-6 py-16"><div className="rounded-3xl p-8 text-white sm:p-12" style={{ backgroundColor: accent }}><h2 className="text-3xl font-bold">{title}</h2><button className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-950">{String(content.primaryCta ?? 'Get started')}</button></div></section>;
    case 'Footer':
      return <footer className="border-t border-zinc-200 px-6 py-10 text-sm text-zinc-500"><span>{title}</span></footer>;
    default:
      return <section className="border-t border-zinc-100 px-6 py-14 sm:px-12"><div className="mx-auto max-w-6xl"><h2 className="text-2xl font-bold tracking-tight">{title}</h2>{items.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, i) => <article key={i} className="rounded-2xl border border-zinc-200 p-5"><p className="text-sm leading-6 text-zinc-600">{item}</p></article>)}</div>}</div></section>;
}

function resolveTitle(component: BuilderComponent, content: Record<string, unknown>) {
  const titles: Partial<Record<BuilderComponent, string>> = {
    Hero: String(content.headline ?? 'A clearer digital experience.'),
    Proof: 'Why people trust the brand',
    FeatureGrid: 'What matters most',
    Offer: 'The offer',
    Media: 'Experience',
    Timeline: 'Timeline',
    Faq: 'Frequently asked questions',
    Venue: 'Venue',
    About: 'About',
    Testimonials: 'What customers say',
    Contact: 'Contact',
    Cta: 'Ready to take the next step?',
    Gallery: 'Gallery',
    Stats: 'Key facts',
  };
  return titles[component] ?? String(content.businessName ?? 'Growth Advisor');
}

function resolveContent(ref: string, content: Record<string, unknown>) {
  const value = content[ref];
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'text' in value) return String((value as { text?: unknown }).text ?? '');
  return '';
}
