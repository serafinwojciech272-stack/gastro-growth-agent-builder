import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Circle, Loader2, Monitor, Smartphone, Tablet, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requireSupabase } from '../lib/supabase';
import { WEBSITE_BUILDER_STAGE_DESCRIPTIONS, WEBSITE_BUILDER_STAGES, type WebsiteBuilderArtifact, type WebsiteBuilderProject } from '../domain/websiteBuilder';

type Viewport = 'desktop' | 'tablet' | 'mobile';
const verticals = ['Music / Concert', 'Restaurant', 'Hotel', 'Barber', 'Beauty', 'Professional services', 'Other'];
const SERVER_STAGES = new Set([0, 1, 2, 3, 4]);

export default function WebsiteBuilderPage() {
  const [project, setProject] = useState<WebsiteBuilderProject | null>(null);
  const [projects, setProjects] = useState<WebsiteBuilderProject[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [vertical, setVertical] = useState(verticals[0]);
  const [goal, setGoal] = useState('Build a high-conversion flagship website');
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewport, setViewport] = useState<Viewport>('desktop');

  const completed = project?.completed_stages ?? [];
  const progress = Math.round((completed.length / WEBSITE_BUILDER_STAGES.length) * 100);
  const stage = WEBSITE_BUILDER_STAGES[active];
  const artifacts = project?.artifacts ?? {};
  const currentArtifact = artifacts[stage];
  const brand = artifacts['Brand Extraction'] as WebsiteBuilderArtifact | undefined;
  const architecture = artifacts['Page Architecture'] as WebsiteBuilderArtifact | undefined;
  const visual = artifacts['Visual Direction'] as WebsiteBuilderArtifact | undefined;
  const content = artifacts['Content Intelligence'] as WebsiteBuilderArtifact | undefined;

  useEffect(() => {
    void loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', { body: { action: 'list' } });
      if (invokeError) throw invokeError;
      setProjects((data?.projects ?? []) as WebsiteBuilderProject[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load projects.');
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', {
        body: { action: 'create', name, sourceUrl: url, vertical, goal },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const created = data.project as WebsiteBuilderProject;
      setProject(created); setActive(0); setProjects((current) => [created, ...current]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Project creation failed.');
    } finally { setBusy(false); }
  }

  async function openProject(id: string) {
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', { body: { action: 'get', projectId: id } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const loaded = data.project as WebsiteBuilderProject;
      setProject(loaded); setActive(Math.min(loaded.active_stage, WEBSITE_BUILDER_STAGES.length - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Project load failed.');
    } finally { setBusy(false); }
  }

  async function runStage(index: number) {
    if (!project || !SERVER_STAGES.has(index)) return;
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', {
        body: { action: 'run-stage', projectId: project.id, stage: WEBSITE_BUILDER_STAGES[index] },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setProject(data.project as WebsiteBuilderProject);
      setActive(Math.min(index + 1, WEBSITE_BUILDER_STAGES.length - 1));
      await loadProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${WEBSITE_BUILDER_STAGES[index]} failed.`);
    } finally { setBusy(false); }
  }

  const previewData = useMemo(() => ({
    businessName: String(brand?.businessName ?? project?.name ?? 'Growth Advisor'),
    vertical: String(brand?.vertical ?? project?.vertical ?? ''),
    headline: String(brand?.headline ?? 'A clearer digital experience.'),
    subheadline: String(brand?.subheadline ?? 'Source-grounded content, structured into a production-ready system.'),
    primaryCta: String(brand?.primaryCta ?? 'Get started'),
    accent: String((visual?.color as Record<string, unknown> | undefined)?.accent ?? '#7C3AED'),
  }), [brand, project, visual]);

  if (!project) return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link to="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> Growth Advisor</Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-300"><WandSparkles size={14} /> Website Builder</span>
        </header>
        <div className="grid gap-6 py-10 lg:grid-cols-[1fr_340px] lg:py-16">
          <section className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-violet-300">Growth Advisor Website Builder</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Build production websites from structured intelligence.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">One persisted project. Typed artifacts. Explicit gates. AI generates data, not executable code.</p>
            <form onSubmit={create} className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:p-7">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-zinc-400">Project name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Metallica | Life Burns Faster" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label>
                <label className="text-sm text-zinc-400">Source website<input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://www.metallica.com" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-zinc-400">Vertical<select value={vertical} onChange={(e) => setVertical(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none">{verticals.map((v) => <option key={v}>{v}</option>)}</select></label>
                <label className="text-sm text-zinc-400">Primary goal<input value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label>
              </div>
              <button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />}Create project</button>
            </form>
            {error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          </section>
          <aside className="rounded-3xl border border-white/10 bg-white/[.025] p-5">
            <div className="text-xs uppercase tracking-[.18em] text-zinc-600">Recent projects</div>
            <div className="mt-4 space-y-2">{projects.length === 0 ? <p className="text-sm text-zinc-500">No persisted projects yet.</p> : projects.slice(0, 8).map((item) => <button key={item.id} onClick={() => void openProject(item.id)} className="w-full rounded-xl border border-white/5 bg-black/20 p-3 text-left hover:bg-white/[.05]"><div className="text-sm font-medium">{item.name}</div><div className="mt-1 text-xs text-zinc-600">{item.vertical} · {Math.round((item.completed_stages.length / 11) * 100)}%</div></button>)}</div>
          </aside>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5"><Link to="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> Growth Advisor</Link><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-300"><WandSparkles size={14} /> Website Builder</span></header>
        <div className="grid gap-6 py-6 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-4 lg:self-start"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex justify-between text-xs uppercase tracking-[.18em] text-zinc-500"><span>Build pipeline</span><span>{progress}%</span></div><div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} /></div><div className="mt-5 space-y-1">{WEBSITE_BUILDER_STAGES.map((item, index) => <button key={item} onClick={() => setActive(index)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${active === index ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[.05] hover:text-white'}`}>{completed.includes(index) ? <Check size={15} /> : active === index ? <Loader2 size={15} /> : <Circle size={12} />}<span>{item}</span></button>)}</div></div></aside>
          <section className="min-w-0">
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6"><p className="text-xs uppercase tracking-[.18em] text-violet-300">{stage}</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{project.name}</h1><p className="mt-2 text-sm text-zinc-500">{WEBSITE_BUILDER_STAGE_DESCRIPTIONS[stage]}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500"><span className="rounded-full border border-white/10 px-3 py-1">v{project.version}</span><span className="rounded-full border border-white/10 px-3 py-1">{project.status}</span><span className="rounded-full border border-white/10 px-3 py-1">{project.source_url}</span></div></div>
            <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
              <div className="space-y-5">
                <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5">
                  <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Server stage engine</div><h2 className="mt-2 text-lg font-semibold">{stage}</h2></div>{SERVER_STAGES.has(active) ? <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Executable</span> : <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">Schema next</span>}</div>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">The engine persists the project state and writes versioned structured artifacts. AI is constrained to JSON contracts and cannot emit executable UI code.</p>
                  {SERVER_STAGES.has(active) && <button disabled={busy} onClick={() => void runStage(active)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />}{busy ? 'Running...' : `Run ${stage}`}</button>}
                </div>

                {active >= 1 && brand && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[['Business', brand.businessName], ['Positioning', brand.positioning], ['CTA', brand.primaryCta], ['Confidence', `${Math.round(Number(brand.confidence ?? 0) * 100)}%`]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="text-[10px] uppercase tracking-[.16em] text-zinc-600">{label}</div><div className="mt-2 text-sm text-zinc-200">{String(value)}</div></div>)}</div>}

                {active >= 2 && content && <ArtifactPanel title="Content Intelligence" artifact={content} />}
                {active >= 3 && architecture && <ArtifactPanel title="Page Architecture" artifact={architecture} />}
                {active >= 4 && visual && <ArtifactPanel title="Visual Direction" artifact={visual} />}

                {active >= 4 && <div className="rounded-3xl border border-white/10 bg-zinc-950 p-3"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-zinc-500">Schema preview</span><div className="flex gap-1 rounded-lg border border-white/10 p-1"><button onClick={() => setViewport('desktop')} className={viewport === 'desktop' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Monitor size={14} /></button><button onClick={() => setViewport('tablet')} className={viewport === 'tablet' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Tablet size={14} /></button><button onClick={() => setViewport('mobile')} className={viewport === 'mobile' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Smartphone size={14} /></button></div></div><div className={`mx-auto overflow-hidden rounded-2xl bg-white text-zinc-900 ${viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[820px]' : 'w-full'}`}><div className="min-h-[520px] px-7 py-8 sm:px-12"><div className="flex justify-between"><span className="font-bold">{previewData.businessName}</span><span className="rounded-full px-3 py-1 text-xs text-white" style={{ background: previewData.accent }}>{previewData.primaryCta}</span></div><div className="mx-auto max-w-3xl py-24 text-center"><p className="text-[10px] uppercase tracking-[.22em] opacity-50">{previewData.vertical}</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{previewData.headline}</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-6 opacity-65">{previewData.subheadline}</p><button className="mt-8 rounded-xl px-6 py-3 text-sm font-bold text-white" style={{ background: previewData.accent }}>{previewData.primaryCta}</button></div></div></div></div>}

                {currentArtifact && <details className="rounded-2xl border border-white/10 bg-black/20 p-4"><summary className="cursor-pointer text-xs uppercase tracking-[.16em] text-zinc-500">Inspect raw {stage} schema</summary><pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-400">{JSON.stringify(currentArtifact, null, 2)}</pre></details>}
              </div>
              <aside className="space-y-4"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Project state</div><div className="mt-3 text-3xl font-semibold">{completed.length}/11</div><p className="mt-2 text-xs leading-5 text-zinc-500">Completed stages are persisted in Supabase. Reopening the project restores the exact state.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Architecture rule</div><p className="mt-2 text-sm leading-6 text-zinc-400">No arbitrary AI JSX. The future renderer will consume a controlled component schema and design tokens.</p></div></aside>
            </div>
            {error && <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}

function ArtifactPanel({ title, artifact }: { title: string; artifact: WebsiteBuilderArtifact }) {
  const entries = Object.entries(artifact).filter(([key]) => !['schemaVersion', 'type'].includes(key)).slice(0, 8);
  return <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="text-xs uppercase tracking-[.16em] text-zinc-600">{title}</div><div className="mt-4 grid gap-3 md:grid-cols-2">{entries.map(([key, value]) => <div key={key} className="rounded-xl border border-white/5 bg-black/20 p-3"><div className="text-[10px] uppercase tracking-[.12em] text-zinc-600">{key}</div><div className="mt-2 max-h-24 overflow-hidden text-xs leading-5 text-zinc-400">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div></div>)}</div></div>;
}
