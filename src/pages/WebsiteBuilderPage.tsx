import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Circle, Loader2, Monitor, Play, Smartphone, Tablet, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requireSupabase } from '../lib/supabase';
import { WEBSITE_BUILDER_STAGE_DESCRIPTIONS, WEBSITE_BUILDER_STAGES, type WebsiteBuilderArtifact, type WebsiteBuilderProject } from '../domain/websiteBuilder';
import { SchemaRenderer } from '../components/website-builder/SchemaRenderer';
import type { ComponentManifest, RendererArtifact, ComponentInstance } from '../domain/websiteBuilderSchema';

type Viewport = 'desktop' | 'tablet' | 'mobile';
type JsonRecord = Record<string, unknown>;
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
  const [qa, setQa] = useState<JsonRecord | null>(null);

  const completed = project?.completed_stages ?? [];
  const artifacts = project?.artifacts ?? {};
  const stage = WEBSITE_BUILDER_STAGES[active];
  const progress = Math.round((completed.length / WEBSITE_BUILDER_STAGES.length) * 100);
  const brand = artifacts['Brand Extraction'] as WebsiteBuilderArtifact | undefined;
  const content = artifacts['Content Intelligence'] as WebsiteBuilderArtifact | undefined;
  const visual = artifacts['Visual Direction'] as WebsiteBuilderArtifact | undefined;
  const manifest = artifacts['Component Generation'] as unknown as ComponentManifest | undefined;
  const renderer = artifacts['Responsive Renderer'] as unknown as RendererArtifact | undefined;

  useEffect(() => { void loadProjects(); }, []);
  useEffect(() => { setQa((artifacts.QA as JsonRecord | undefined) ?? null); }, [artifacts.QA]);

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
      const next = data.project as WebsiteBuilderProject;
      setProject(next); setProjects((items) => [next, ...items]); setActive(0);
    } catch (e) { setError(e instanceof Error ? e.message : 'Project creation failed.'); }
    finally { setBusy(false); }
  }

  async function openProject(id: string) {
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', { body: { action: 'get', projectId: id } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const next = data.project as WebsiteBuilderProject;
      setProject(next); setActive(Math.min(next.active_stage, WEBSITE_BUILDER_STAGES.length - 1));
    } catch (e) { setError(e instanceof Error ? e.message : 'Project load failed.'); }
    finally { setBusy(false); }
  }

  async function runStage(index: number) {
    if (!project) return;
    if (SERVER_STAGES.has(index)) return runServerStage(index);
    if (LAYOUT_STAGES.has(index)) return runLayoutStage(index);
    if (index === 9) return runQa();
    if (index === 10) return runPublish();
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
    if (index === 5 && !completed.includes(4)) return setError('Visual Direction must pass before AI Layout Generation.');
    if (index === 6 && !artifacts['AI Layout Generation']) return setError('Run AI Layout Generation first.');
    if (index === 7 && !artifacts['Component Generation']) return setError('Run Component Generation first.');
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
    if (!artifacts['Component Generation'] || !artifacts['Responsive Renderer']) return setError('Complete Component Generation and Responsive Renderer before QA.');
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder-qa', { body: { projectId: project.id } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setQa(data.qa as JsonRecord); setProject(data.project as WebsiteBuilderProject); setActive(9); await loadProjects();
    } catch (e) { setError(e instanceof Error ? e.message : 'Automated QA failed.'); }
    finally { setBusy(false); }
  }

  async function runPublish() {
    if (!project) return;
    if (!completed.includes(9)) return setError('QA must pass before Publish.');
    if (String(qa?.releaseGate ?? '') === 'BLOCKED') return setError('Publish is blocked by the QA release gate.');
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await requireSupabase().functions.invoke('gga-website-builder', { body: { action: 'publish', projectId: project.id } });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      const next = data.project as WebsiteBuilderProject;
      setProject(next); setActive(10); await loadProjects();
    } catch (e) { setError(e instanceof Error ? e.message : 'Publish failed.'); }
    finally { setBusy(false); }
  }

  const previewContent = useMemo<JsonRecord>(() => ({ ...(content ?? {}), ...(brand ?? {}) }), [brand, content]);
  const previewPage = manifest?.pages?.find((page) => page.path === '/') ?? manifest?.pages?.[0];
  const previewNodes = (previewPage?.nodes ?? []) as ComponentInstance[];
  const gate = String(qa?.releaseGate ?? 'NOT_RUN');
  const score = Number(qa?.score ?? 0);

  if (!project) return <main className="min-h-screen bg-[#07080c] text-white"><div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8"><header className="flex items-center justify-between border-b border-white/10 pb-5"><Link to="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> Growth Advisor</Link><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-300"><WandSparkles size={14} /> Website Builder</span></header><div className="grid gap-6 py-10 lg:grid-cols-[1fr_340px] lg:py-16"><section className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-violet-300">Growth Advisor Website Builder</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Build production websites from structured intelligence.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">One persisted project. Typed artifacts. Explicit gates. AI generates data, not executable UI code.</p><form onSubmit={create} className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:p-7"><div className="grid gap-4 md:grid-cols-2"><label className="text-sm text-zinc-400">Project name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Metallica | Life Burns Faster" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label><label className="text-sm text-zinc-400">Source website<input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://www.metallica.com" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label></div><div className="grid gap-4 md:grid-cols-2"><label className="text-sm text-zinc-400">Vertical<select value={vertical} onChange={(e) => setVertical(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none">{verticals.map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-sm text-zinc-400">Primary goal<input value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none" /></label></div><button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />}Create project</button></form>{error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}</section><aside className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="text-xs uppercase tracking-[.18em] text-zinc-600">Recent projects</div><div className="mt-4 space-y-2">{projects.length === 0 ? <p className="text-sm text-zinc-500">No persisted projects yet.</p> : projects.slice(0, 8).map((item) => <button key={item.id} onClick={() => void openProject(item.id)} className="w-full rounded-xl border border-white/5 bg-black/20 p-3 text-left hover:bg-white/[.05]"><div className="text-sm font-medium">{item.name}</div><div className="mt-1 text-xs text-zinc-600">{item.vertical} · {Math.round((item.completed_stages.length / 11) * 100)}%</div></button>)}</div></aside></div></div></main>;

  return <main className="min-h-screen bg-[#07080c] text-white"><div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8"><header className="flex items-center justify-between border-b border-white/10 pb-5"><Link to="/app/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16} /> Growth Advisor</Link><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-300"><WandSparkles size={14} /> Website Builder</span></header><div className="grid gap-6 py-6 lg:grid-cols-[280px_1fr]"><aside className="lg:sticky lg:top-4 lg:self-start"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex justify-between text-xs uppercase tracking-[.18em] text-zinc-500"><span>Build pipeline</span><span>{progress}%</span></div><div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} /></div><div className="mt-5 space-y-1">{WEBSITE_BUILDER_STAGES.map((item, index) => { const done = completed.includes(index); const available = index <= 9 ? index === 0 || completed.includes(index - 1) || done : completed.includes(9); return <button key={item} disabled={!available} onClick={() => setActive(index)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${active === index ? 'bg-white text-black' : available ? 'text-zinc-400 hover:bg-white/[.05] hover:text-white' : 'cursor-not-allowed text-zinc-700'}`}>{done ? <Check size={15} /> : <Circle size={12} />}<span>{item}</span></button>; })}</div></div></aside><section className="min-w-0"><div className="mb-6 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6"><p className="text-xs uppercase tracking-[.18em] text-violet-300">{stage}</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{project.name}</h1><p className="mt-2 text-sm text-zinc-500">{WEBSITE_BUILDER_STAGE_DESCRIPTIONS[stage]}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500"><span className="rounded-full border border-white/10 px-3 py-1">v{project.version}</span><span className="rounded-full border border-white/10 px-3 py-1">{project.status}</span></div></div><div className="space-y-5">{active <= 7 && <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.16em] text-zinc-600">{SERVER_STAGES.has(active) ? 'Builder Engine' : 'Layout Engine'}</div><h2 className="mt-2 text-lg font-semibold">{stage}</h2></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Executable</span></div><button disabled={busy} onClick={() => void runStage(active)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}{busy ? 'Running...' : `Run ${stage}`}</button></div>}{active >= 8 && renderer && manifest && <div className="rounded-3xl border border-white/10 bg-zinc-950 p-3"><div className="mb-3 flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Browser Preview</div><div className="mt-1 text-sm text-zinc-300">Schema → controlled registry → responsive viewport</div></div><div className="flex gap-1 rounded-lg border border-white/10 p-1"><button aria-label="Desktop" onClick={() => setViewport('desktop')} className={viewport === 'desktop' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Monitor size={14} /></button><button aria-label="Tablet" onClick={() => setViewport('tablet')} className={viewport === 'tablet' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Tablet size={14} /></button><button aria-label="Mobile" onClick={() => setViewport('mobile')} className={viewport === 'mobile' ? 'rounded bg-white p-1.5 text-black' : 'p-1.5 text-zinc-500'}><Smartphone size={14} /></button></div></div><div className={`mx-auto overflow-hidden rounded-2xl bg-white shadow-2xl ${viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[820px]' : 'w-full'}`}><div className="min-h-[620px]"><SchemaRenderer nodes={previewNodes} content={previewContent} accent={String((visual?.color as JsonRecord | undefined)?.accent ?? '#7C3AED')} /></div></div></div>}{active === 8 && renderer && <button onClick={() => setActive(9)} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Open QA gate</button>}{active === 9 && <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="text-xs uppercase tracking-[.16em] text-zinc-600">Automated QA</div><div className="mt-3 text-3xl font-semibold">{gate}</div><div className="mt-1 text-sm text-zinc-500">Score: {score || '—'}</div><button disabled={busy} onClick={() => void runQa()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}Run automated QA</button>{qa && <pre className="mt-5 max-h-[420px] overflow-auto rounded-xl bg-black/30 p-4 text-xs text-zinc-400">{JSON.stringify(qa, null, 2)}</pre>}</div>}{active === 10 && <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[.05] p-6"><div className="text-xs uppercase tracking-[.16em] text-emerald-300">Production release</div><h2 className="mt-2 text-2xl font-semibold">Publish gate</h2><p className="mt-2 text-sm text-zinc-400">The website can be released only after the QA gate passes. Publish records the release state and version for this project.</p><div className="mt-5 flex flex-wrap items-center gap-3"><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">QA: {gate}</span><span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400">Version {project.version}</span></div><button disabled={busy || !completed.includes(9) || gate === 'BLOCKED'} onClick={() => void runPublish()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}{project.status === 'published' ? 'Published' : 'Publish release'}</button>{project.status === 'published' && <p className="mt-4 text-sm text-emerald-300">Release recorded successfully.</p>}</div>}{error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}</div></section></div></div></main>;
}