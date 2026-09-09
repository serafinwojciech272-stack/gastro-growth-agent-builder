import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Circle, Loader2, Monitor, Smartphone, Tablet, WandSparkles, ShieldCheck, AlertTriangle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requireSupabase } from '../lib/supabase';
import { WEBSITE_BUILDER_STAGE_DESCRIPTIONS, WEBSITE_BUILDER_STAGES, type WebsiteBuilderArtifact, type WebsiteBuilderProject } from '../domain/websiteBuilder';
import { SchemaRenderer } from '../components/website-builder/SchemaRenderer';
import type { ComponentManifest, RendererArtifact } from '../domain/websiteBuilderSchema';

type Viewport = 'desktop' | 'tablet' | 'mobile';
const verticals = ['Music / Concert', 'Restaurant', 'Hotel', 'Barber', 'Beauty', 'Professional services', 'Other'];
const SERVER_STAGES = new Set([0, 1, 2, 3, 4]);
const LAYOUT_STAGES = new Set([5, 6, 7]);

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
  const [qa, setQa] = useState<Record<string, unknown> | null>(null);

  const completed = project?.completed_stages ?? [];
  const progress = Math.round((completed.length / WEBSITE_BUILDER_STAGES.length) * 100);
  const stage = WEBSITE_BUILDER_STAGES[active];
  const artifacts = project?.artifacts ?? {};
  const currentArtifact = artifacts[stage];
  const brand = artifacts['Brand Extraction'] as WebsiteBuilderArtifact | undefined;
  const architecture = artifacts['Page Architecture'] as WebsiteBuilderArtifact | undefined;
  const visual = artifacts['Visual Direction'] as WebsiteBuilderArtifact | undefined;
  const content = artifacts['Content Intelligence'] as WebsiteBuilderArtifact | undefined;
  const manifest = artifacts['Component Generation'] as unknown as ComponentManifest | undefined;
  const renderer = artifacts['Responsive Renderer'] as unknown as RendererArtifact | undefined;

  useEffect(() => { void loadProjects(); }, []);

  useEffect(() => {
    const saved = artifacts.QA as Record<string, unknown> | undefined;
    setQa(saved ?? null);
  }, [artifacts.QA]);

  async function loadProjects() {
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', { body: { action: 'list' } });
      if (invokeError) throw invokeError;
      setProjects((data?.projects ?? []) as WebsiteBuilderProject[]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load projects.'); }
  }

  async function create(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', { body: { action: 'create', name, sourceUrl: url, vertical, goal } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const created = data.project as WebsiteBuilderProject;
      setProject(created); setActive(0); setProjects((current) => [created, ...current]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Project creation failed.'); }
    finally { setBusy(false); }
  }

  async function openProject(id: string) {
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', { body: { action: 'get', projectId: id } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const loaded = data.project as WebsiteBuilderProject;
      setProject(loaded); setActive(Math.min(loaded.active_stage, WEBSITE_BUILDER_STAGES.length - 1));
      setQa((loaded.artifacts?.QA as Record<string, unknown>) ?? null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Project load failed.'); }
    finally { setBusy(false); }
  }

  async function runStage(index: number) {
    if (!project) return;
    if (SERVER_STAGES.has(index)) return runServerStage(index);
    if (LAYOUT_STAGES.has(index)) return runLayoutStage(index);
  }

  async function runServerStage(index: number) {
    if (!project) return;
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', { body: { action: 'run-stage', projectId: project.id, stage: WEBSITE_BUILDER_STAGES[index] } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const next = data.project as WebsiteBuilderProject;
      setProject(next); setActive(Math.min(index + 1, WEBSITE_BUILDER_STAGES.length - 1)); await loadProjects();
    } catch (e) { setError(e instanceof Error ? e.message : `${WEBSITE_BUILDER_STAGES[index]} failed.`); }
    finally { setBusy(false); }
  }

  async function runLayoutStage(index: number) {
    if (!project) return;
    if (index === 5 && !completed.includes(4)) { setError('Visual Direction must pass before AI Layout Generation.'); return; }
    if (index === 6 && !artifacts['AI Layout Generation']) { setError('Run AI Layout Generation first.'); return; }
    if (index === 7 && !artifacts['Component Generation']) { setError('Run Component Generation first.'); return; }
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder-layout', { body: { action: 'run-stage', projectId: project.id, stage: WEBSITE_BUILDER_STAGES[index] } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const next = data.project as WebsiteBuilderProject;
      setProject(next); setActive(Math.min(index + 1, WEBSITE_BUILDER_STAGES.length - 1)); await loadProjects();
    } catch (e) { setError(e instanceof Error ? e.message : `${WEBSITE_BUILDER_STAGES[index]} failed.`); }
    finally { setBusy(false); }
  }

  async function runQa() {
    if (!project) return;
    if (!artifacts['Component Generation'] || !artifacts['Responsive Renderer']) { setError('Complete Component Generation and Responsive Renderer before QA.'); return; }
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder-qa', { body: { projectId: project.id } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setQa(data.qa as Record<string, unknown>);
      setProject(data.project as WebsiteBuilderProject);
      setActive(9); await loadProjects();
    } catch (e) { setError(e instanceof Error ? e.message : 'Automated QA failed.'); }
    finally { setBusy(false); }
  }

  const previewContent = useMemo(() => {
    const base: Record<string, unknown> = { ...((content ?? {}) as Record<string, unknown>), ...((brand ?? {}) as Record<string, unknown>) };
    return base;
  }, [brand, content]);

  const previewPages = manifest?.pages ?? [];
  const previewPage = previewPages.find((page) => page.path === '/') ?? previewPages[0];
  const previewNodes = previewPage?.nodes ?? [];
  const gate = String(qa?.releaseGate ?? 'NOT_RUN');
  const score = Number(qa?.score ?? 0);

  if (!project) return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5"><Link to="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> Growth Advisor</Link><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-300"><WandSparkles size={14} /> Website Builder</span></header>
        <div className="grid gap-6 py-10 lg:grid-cols-[1fr_340px] lg:py-16">
          <section className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-violet-300">Growth Advisor Website Builder</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Build production websites from structured intelligence.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">One persisted project. Typed artifacts. Explicit gates. AI generates data, not executable UI code.</p>
            <form onSubmit={create} className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:p-7"><div className="grid gap-4 md:grid-cols-2"><label className="text-sm text-zinc-400">Project name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Metallica | Life Burns Faster" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label><label className="text-sm text-zinc-400">Source website<input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://www.metallica.com" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label></div><div className="grid gap-4 md:grid-cols-2"><label className="text-sm text-zinc-400">Vertical<select value={vertical} onChange={(e) => setVertical(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none">{verticals.map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-sm text-zinc-400">Primary goal<input value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label></div><button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />}Create project</button></form>
            {error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          </section>
          <aside className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="text-xs uppercase tracking-[.18em] text-zinc-600">Recent projects</div><div className="mt-4 space-y-2">{projects.length === 0 ? <p className="text-sm text-zinc-500">No persisted projects yet.</p> : projects.slice(0, 8).map((item) => <button key={item.id} onClick={() => void openProject(item.id)} className="w-full rounded-xl border border-white/5 bg-black/20 p-3 text-left hover:bg-white/[.05]"><div className="text-sm font-medium">{item.name}</div><div className="mt-1 text-xs text-zinc-600">{item.vertical} · {Math.round((item.completed_stages.length / 11) * 100)}%</div></button>)}</div></aside>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#07080c] text-white"><div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-white/10 pb-5"><Link to="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> Growth Advisor</Link><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-300"><WandSparkles size={14} /> Website Builder</span></header>
      <div className="grid gap-6 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex justify-between text-xs uppercase tracking-[.18em] text-zinc-500"><span>Build pipeline</span><span>{progress}%</span></div><div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} /></div><div className="mt-5 space-y-1">{WEBSITE_BUILDER_STAGES.map((item, index) => { const done=completed.includes(index); const available=index<=8 ? (index===0 || completed.includes(index-1) || done) : index===9; return <button key={item} disabled={!available} onClick={() => setActive(index)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${active === index ? 'bg-white text-black' : available ? 'text-zinc-400 hover:bg-white/[.05] hover:text-white' : 'cursor-not-allowed text-zinc-700'}`}>{done ? <Check size={15} /> : active === index ? <Loader2 size={15} /> : <Circle size={12} />}<span>{item}</span></button>; })}</div></div></aside>
        <section className="min-w-0"><div className="mb-6 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6"><p className="text-xs uppercase tracking-[.18em] text-violet-300">{stage}</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{project.name}</h1><p className="mt-2 text-sm text-zinc-500">{WEBSITE_BUILDER_STAGE_DESCRIPTIONS[stage]}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500"><span className="rounded-full border border-white/10 px-3 py-1">v{project.version}</span><span className="rounded-full border border-white/10 px-3 py-1">{project.status}</span><span className="rounded-full border border-white/10 px-3 py-1">{project.source_url}</span></div></div>
          <div className="grid gap-5 xl:grid-cols-[1fr_320px]"><div className="space-y-5">
            {active <= 7 && <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.16em] text-zinc-600">{SERVER_STAGES.has(active) ? 'Builder Engine' : 'Layout Engine'}</div><h2 className="mt-2 text-lg font-semibold">{stage}</h2></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Executable</span></div><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{active <= 4 ? 'Server-side source intelligence produces persisted, typed artifacts.' : 'The Layout Engine converts approved intelligence into a constrained schema consumed by the controlled renderer.'}</p><button disabled={busy} onClick={() => void runStage(active)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}{busy ? 'Running...' : `Run ${stage}`}</button></div>}

            {active >= 1 && brand && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[['Business', brand.businessName], ['Positioning', brand.positioning], ['CTA', brand.primaryCta], ['Confidence', `${Math.round(Number(brand.confidence ?? 0) * 100)}%`]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="text-[10px] uppercase tracking-[.16em] text-zinc-600">{label}</div><div className="mt-2 text-sm text-zinc-200">{String(value)}</div></div>)}</div>}
            {active >= 2 && content && <ArtifactPanel title="Content Intelligence" artifact={content} />}
            {active >= 3 && architecture && <ArtifactPanel title="Page Architecture" artifact={architecture} />}
            {active >= 4 && visual && <ArtifactPanel title="Visual Direction" artifact={visual} />}

            {active >= 8 && renderer && manifest && <div className="rounded-3xl border border-white/10 bg-zinc-950 p-3"><div className="mb-3 flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Browser Preview</div><div className="mt-1 text-sm text-zinc-300">Schema → controlled registry → responsive viewport</div></div><div className="flex gap-1 rounded-lg border border-white/10 p-1"><button aria-label="Desktop" onClick={() => setViewport('desktop')} className={viewport === 'desktop' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Monitor size={14} /></button><button aria-label="Tablet" onClick={() => setViewport('tablet')} className={viewport === 'tablet' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Tablet size={14} /></button><button aria-label="Mobile" onClick={() => setViewport('mobile')} className={viewport === 'mobile' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Smartphone size={14} /></button></div></div><div className={`mx-auto overflow-hidden rounded-2xl bg-white shadow-2xl ${viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[820px]' : 'w-full'}`}><div className="min-h-[620px]"><SchemaRenderer nodes={previewNodes} content={previewContent} accent={String((visual?.color as Record<string, unknown> | undefined)?.accent ?? '#7C3AED')} /></div></div></div>}

            {active === 9 && <QaPanel qa={qa} busy={busy} onRun={runQa} />}
            {active === 8 && renderer && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center gap-2 text-sm text-emerald-300"><Check size={16} /> Browser Preview ready</div><p className="mt-2 text-xs leading-5 text-zinc-500">Preview is rendered from the persisted Component Generation manifest. Next gate: Automated QA.</p><button onClick={() => setActive(9)} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Open QA gate</button></div>}
            {currentArtifact && active < 8 && <details className="rounded-2xl border border-white/10 bg-black/20 p-4"><summary className="cursor-pointer text-xs uppercase tracking-[.16em] text-zinc-500">Inspect raw {stage} schema</summary><pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-400">{JSON.stringify(currentArtifact, null, 2)}</pre></details>}
          </div>
          <aside className="space-y-4"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Project state</div><div className="mt-3 text-3xl font-semibold">{completed.length}/11</div><p className="mt-2 text-xs leading-5 text-zinc-500">Persisted in Supabase. Reopening restores the project state and artifacts.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Release Gate</div><div className={`mt-3 text-2xl font-semibold ${gate === 'PASS' ? 'text-emerald-300' : gate === 'BLOCKED' ? 'text-red-300' : 'text-amber-300'}`}>{gate}</div><div className="mt-1 text-sm text-zinc-500">QA score: {score || '—'}</div>{qa && <p className="mt-3 text-xs leading-5 text-zinc-500">A blocked gate prevents production publish.</p>}</div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Architecture rule</div><p className="mt-2 text-sm leading-6 text-zinc-400">AI emits structured data only. Preview executes a fixed component registry, not generated code.</p></div></aside>
          </div>
          {error && <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        </section>
      </div>
    </div></main>
  );
}

function ArtifactPanel({ title, artifact }: { title: string; artifact: WebsiteBuilderArtifact }) {
  const entries = Object.entries(artifact).filter(([key]) => !['schemaVersion', 'type'].includes(key)).slice(0, 8);
  return <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="text-xs uppercase tracking-[.16em] text-zinc-600">{title}</div><div className="mt-4 grid gap-3 md:grid-cols-2">{entries.map(([key, value]) => <div key={key} className="rounded-xl border border-white/5 bg-black/20 p-3"><div className="text-[10px] uppercase tracking-[.12em] text-zinc-600">{key}</div><div className="mt-2 max-h-24 overflow-hidden text-xs leading-5 text-zinc-400">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div></div>)}</div></div>;
}

function QaPanel({ qa, busy, onRun }: { qa: Record<string, unknown> | null; busy: boolean; onRun: () => Promise<void> }) {
  const checks = Array.isArray(qa?.checks) ? qa.checks as Array<Record<string, unknown>> : [];
  const gate = String(qa?.releaseGate ?? 'NOT_RUN');
  const score = Number(qa?.score ?? 0);
  return <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Automated QA</div><h2 className="mt-2 text-xl font-semibold">Production readiness gate</h2></div><div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${gate === 'PASS' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : gate === 'BLOCKED' ? 'border-red-400/20 bg-red-400/10 text-red-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'}`}>{gate === 'PASS' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}{gate}</div></div><div className="mt-5 grid gap-3 sm:grid-cols-5">{checks.map((check) => <div key={String(check.check)} className="rounded-xl border border-white/5 bg-black/20 p-3"><div className="text-[10px] uppercase tracking-[.12em] text-zinc-600">{String(check.check)}</div><div className={`mt-2 text-sm font-semibold ${check.status === 'pass' ? 'text-emerald-300' : 'text-red-300'}`}>{String(check.status).toUpperCase()}</div><div className="mt-1 text-xs text-zinc-600">{Number(check.score ?? 0)}/100</div></div>)}</div><div className="mt-5 flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4"><div><div className="text-xs uppercase tracking-[.14em] text-zinc-600">Release score</div><div className="mt-1 text-3xl font-semibold">{qa ? score : '—'}</div></div><button disabled={busy} onClick={() => void onRun()} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}{busy ? 'Running QA...' : 'Run automated QA'}</button></div>{qa && <details className="mt-4"><summary className="cursor-pointer text-xs uppercase tracking-[.16em] text-zinc-500">Inspect QA report</summary><pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-zinc-500">{JSON.stringify(qa, null, 2)}</pre></details>}</div>;
}
