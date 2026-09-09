import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, parseJson } from '../_shared/ai.ts';
import { evaluateStructuredOutput } from '../_shared/quality.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { buildServerWebsiteAudit } from '../_shared/websiteTrust.ts';

type Stage = 'Project' | 'Brand Extraction' | 'Content Intelligence' | 'Page Architecture' | 'Visual Direction';

type BuilderProject = {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  source_url: string;
  vertical: string;
  goal: string;
  status: string;
  active_stage: number;
  completed_stages: number[];
  artifacts: Record<string, unknown>;
  source_snapshot: Record<string, unknown> | null;
  version: number;
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401, cors);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) throw new Error('Supabase environment is incomplete');

    const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData } = await sb.auth.getUser();
    const user = authData.user;
    if (!user) return json({ error: 'Invalid session' }, 401, cors);

    const body = await req.json().catch(() => null);
    const action = body?.action;

    if (action === 'list') {
      const result = await sb.from('website_builder_projects').select('*').order('updated_at', { ascending: false }).limit(50);
      if (result.error) throw result.error;
      return json({ projects: result.data ?? [] }, 200, cors);
    }

    if (action === 'create') {
      const name = clean(body?.name, 160);
      const sourceUrl = normalizeUrl(body?.sourceUrl);
      const vertical = clean(body?.vertical, 120);
      const goal = clean(body?.goal, 1000);
      if (!name || !sourceUrl || !vertical) return json({ error: 'name, sourceUrl and vertical are required.' }, 400, cors);

      const membership = await sb.from('organization_members').select('organization_id').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (membership.error) throw membership.error;
      if (!membership.data?.organization_id) return json({ error: 'No organization membership found for this account.' }, 403, cors);

      const inserted = await sb.from('website_builder_projects').insert({
        organization_id: membership.data.organization_id,
        user_id: user.id,
        name,
        source_url: sourceUrl,
        vertical,
        goal,
        status: 'draft',
        active_stage: 0,
        completed_stages: [],
        artifacts: {},
        version: 1,
      }).select('*').single();
      if (inserted.error) throw inserted.error;
      return json({ project: inserted.data }, 201, cors);
    }

    const projectId = typeof body?.projectId === 'string' ? body.projectId : '';
    if (!projectId) return json({ error: 'projectId is required.' }, 400, cors);

    const projectResult = await sb.from('website_builder_projects').select('*').eq('id', projectId).single();
    if (projectResult.error) throw projectResult.error;
    const project = projectResult.data as BuilderProject;

    if (action === 'get') return json({ project }, 200, cors);

    if (action === 'run-stage') {
      const stage = body?.stage as Stage;
      if (!['Project', 'Brand Extraction', 'Content Intelligence', 'Page Architecture', 'Visual Direction'].includes(stage)) {
        return json({ error: 'Unsupported stage. The first five stages are currently server-executable.' }, 400, cors);
      }

      await sb.from('website_builder_projects').update({ status: 'running' }).eq('id', project.id);
      const result = await runStage(stage, project);
      const nextArtifacts = { ...project.artifacts, [stage]: result.artifact };
      const stageIndex = ['Project', 'Brand Extraction', 'Content Intelligence', 'Page Architecture', 'Visual Direction'].indexOf(stage);
      const completed = Array.from(new Set([...(project.completed_stages ?? []), stageIndex])).sort((a, b) => a - b);
      const updated = await sb.from('website_builder_projects').update({
        artifacts: nextArtifacts,
        source_snapshot: result.sourceSnapshot ?? project.source_snapshot,
        active_stage: Math.min(Math.max(stageIndex + 1, project.active_stage), 10),
        completed_stages: completed,
        status: 'ready',
        version: project.version + 1,
      }).eq('id', project.id).select('*').single();
      if (updated.error) throw updated.error;
      return json({ project: updated.data, stage, artifact: result.artifact, quality: result.quality }, 200, cors);
    }

    return json({ error: 'Unknown action.' }, 400, cors);
  } catch (error) {
    console.error('GGA Website Builder error', error);
    return json({ error: error instanceof Error ? error.message : 'Website Builder failed.' }, 502, cors);
  }
});

async function runStage(stage: Stage, project: BuilderProject) {
  if (stage === 'Project') {
    return {
      artifact: {
        schemaVersion: '1.0', type: 'project', id: project.id,
        name: project.name, sourceUrl: project.source_url, vertical: project.vertical,
        goal: project.goal, createdBy: project.user_id,
      },
      quality: { score: 100, gate: 'PASS' },
      sourceSnapshot: project.source_snapshot,
    };
  }

  const source = await getSource(project);
  if (stage === 'Brand Extraction') {
    const system = `You are the Growth Advisor brand extraction engine. Analyze the supplied website evidence. Never invent facts. Separate observed facts from inferred design signals. Return JSON only: {businessName, vertical, positioning, headline, subheadline, primaryCta, trustSignals[], brand: {colors[], typography, imagery, tone, density, motion}, evidence[], confidence}. Keep evidence concise and traceable to the source. Use valid hex colors only when directly observed or strongly inferable.`;
    const ai = await callOpenRouter({ task: 'general', system, user: JSON.stringify({ url: project.source_url, vertical: project.vertical, page_text: source.text, audit: source.audit }), temperature: 0.1 });
    const parsed = parseJson<Record<string, unknown>>(ai.content);
    const artifact = normalizeBrand(parsed, project.source_url);
    const quality = evaluateStructuredOutput(artifact, { required: ['businessName', 'vertical', 'positioning', 'headline', 'subheadline', 'primaryCta', 'trustSignals', 'brand', 'evidence', 'confidence'], arrays: ['trustSignals', 'evidence'], minItems: { trustSignals: 1, evidence: 2 } });
    if (quality.score < 70) throw new Error(`Brand Extraction quality gate failed: ${quality.score}`);
    return { artifact, quality: { score: quality.score, gate: quality.score >= 85 ? 'PASS' : 'PASS_WITH_WARNINGS' }, sourceSnapshot: source.snapshot };
  }

  const prior = project.artifacts['Brand Extraction'] ?? {};
  if (stage === 'Content Intelligence') {
    const system = `You are the Growth Advisor content intelligence engine. Build a typed content model from verified website evidence and the extracted brand artifact. Facts must be source-grounded. Generated copy must be explicitly marked as proposed. Return JSON only: {entities[], facts[], claims[], sections[], ctas[], faqs[], contentGaps[], proposedCopy[], confidence}. Each fact must have source='website' or source='user_input'. Each proposedCopy item must have status='proposed'. Do not fabricate prices, dates, addresses, awards, testimonials or performance claims.`;
    const ai = await callOpenRouter({ task: 'general', system, user: JSON.stringify({ project: { name: project.name, vertical: project.vertical, goal: project.goal }, brand: prior, evidence: source.text, audit: source.audit }), temperature: 0.15 });
    const artifact = normalizeContent(parseJson<Record<string, unknown>>(ai.content));
    const quality = evaluateStructuredOutput(artifact, { required: ['entities', 'facts', 'claims', 'sections', 'ctas', 'faqs', 'contentGaps', 'proposedCopy', 'confidence'], arrays: ['entities', 'facts', 'claims', 'sections', 'ctas', 'faqs', 'contentGaps', 'proposedCopy'], minItems: { entities: 1, facts: 2, sections: 3, ctas: 1 } });
    if (quality.score < 70) throw new Error(`Content Intelligence quality gate failed: ${quality.score}`);
    return { artifact, quality: { score: quality.score, gate: quality.score >= 85 ? 'PASS' : 'PASS_WITH_WARNINGS' }, sourceSnapshot: project.source_snapshot };
  }

  const content = project.artifacts['Content Intelligence'] ?? {};
  if (stage === 'Page Architecture') {
    const system = `You are the Growth Advisor page architecture engine. Convert structured content into a deterministic information architecture. Return JSON only: {schemaVersion, pages[], primaryPage, navigation[], conversionPath[], globalSections[]}. Each page has id, path, purpose, sections[]. Each section has id, type, purpose, contentRefs[], priority, ctaRef?. Use a constrained section taxonomy: hero, proof, featureGrid, offer, media, timeline, faq, venue, about, testimonials, contact, cta, footer, gallery, stats. Do not output prose outside JSON.`;
    const ai = await callOpenRouter({ task: 'general', system, user: JSON.stringify({ project: { name: project.name, vertical: project.vertical, goal: project.goal }, brand: prior, content }), temperature: 0.1 });
    const artifact = normalizeArchitecture(parseJson<Record<string, unknown>>(ai.content));
    const quality = evaluateStructuredOutput(artifact, { required: ['schemaVersion', 'pages', 'primaryPage', 'navigation', 'conversionPath', 'globalSections'], arrays: ['pages', 'navigation', 'conversionPath', 'globalSections'], minItems: { pages: 1, navigation: 1, conversionPath: 2 } });
    if (quality.score < 70) throw new Error(`Page Architecture quality gate failed: ${quality.score}`);
    return { artifact, quality: { score: quality.score, gate: quality.score >= 85 ? 'PASS' : 'PASS_WITH_WARNINGS' }, sourceSnapshot: project.source_snapshot };
  }

  const architecture = project.artifacts['Page Architecture'] ?? {};
  const system = `You are the Growth Advisor visual direction engine. Create a production-ready design token system from brand evidence and page architecture. Return JSON only: {schemaVersion, color, typography, spacing, radius, shadow, motion, layout, imagery}. Colors must be hex or rgba. Typography must use named web-safe/system or Google-family names, never fabricated font files. Motion must include reducedMotionBehavior. Layout must include maxWidth, grid, breakpoints. Do not output CSS or JSX.`;
  const ai = await callOpenRouter({ task: 'general', system, user: JSON.stringify({ project: { name: project.name, vertical: project.vertical }, brand: prior, architecture }), temperature: 0.1 });
  const artifact = normalizeVisual(parseJson<Record<string, unknown>>(ai.content));
  const quality = evaluateStructuredOutput(artifact, { required: ['schemaVersion', 'color', 'typography', 'spacing', 'radius', 'shadow', 'motion', 'layout', 'imagery'] });
  if (quality.score < 70) throw new Error(`Visual Direction quality gate failed: ${quality.score}`);
  return { artifact, quality: { score: quality.score, gate: quality.score >= 85 ? 'PASS' : 'PASS_WITH_WARNINGS' }, sourceSnapshot: project.source_snapshot };
}

async function getSource(project: BuilderProject) {
  if (project.source_snapshot?.text && project.source_snapshot?.audit) return { text: String(project.source_snapshot.text), audit: project.source_snapshot.audit, snapshot: project.source_snapshot };
  const response = await fetch(project.source_url, { redirect: 'follow', headers: { 'User-Agent': 'Growth-Advisor-Builder/1.0', Accept: 'text/html,application/xhtml+xml' } });
  if (!response.ok) throw new Error(`Website returned HTTP ${response.status}.`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) throw new Error('The source URL is not an HTML page.');
  const html = (await response.text()).slice(0, 80000);
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 22000);
  if (text.length < 100) throw new Error('Not enough readable website content was found.');
  const audit = buildServerWebsiteAudit(project.source_url, html, text);
  return { text, audit, snapshot: { url: project.source_url, fetchedAt: new Date().toISOString(), text, audit } };
}

function normalizeBrand(value: Record<string, unknown>, sourceUrl: string) {
  const brand = isObject(value.brand) ? value.brand : {};
  return {
    schemaVersion: '1.0', type: 'brand-extraction', sourceUrl,
    businessName: text(value.businessName, 'Untitled business', 100),
    vertical: text(value.vertical, 'Local business', 100),
    positioning: text(value.positioning, 'Clear, conversion-focused digital presence.', 320),
    headline: text(value.headline, 'A clearer digital experience.', 180),
    subheadline: text(value.subheadline, 'Built around clarity, trust and action.', 320),
    primaryCta: text(value.primaryCta, 'Get started', 60),
    trustSignals: list(value.trustSignals, 6),
    brand: { colors: list(brand.colors, 8).filter((x) => /^#[0-9a-f]{6}$/i.test(x)), typography: text(brand.typography, 'System sans', 80), imagery: text(brand.imagery, 'Authentic brand imagery', 160), tone: text(brand.tone, 'Clear and confident', 120), density: text(brand.density, 'balanced', 40), motion: text(brand.motion, 'subtle', 60) },
    evidence: list(value.evidence, 8),
    confidence: number(value.confidence, 0.7),
  };
}
function normalizeContent(value: Record<string, unknown>) { return { schemaVersion: '1.0', type: 'content-intelligence', entities: list(value.entities, 20), facts: list(value.facts, 40), claims: list(value.claims, 30), sections: list(value.sections, 20), ctas: list(value.ctas, 12), faqs: list(value.faqs, 20), contentGaps: list(value.contentGaps, 20), proposedCopy: list(value.proposedCopy, 30), confidence: number(value.confidence, 0.7) }; }
function normalizeArchitecture(value: Record<string, unknown>) { return { schemaVersion: '1.0', type: 'page-architecture', pages: Array.isArray(value.pages) ? value.pages.slice(0, 20) : [], primaryPage: text(value.primaryPage, '/', 120), navigation: list(value.navigation, 12), conversionPath: list(value.conversionPath, 12), globalSections: list(value.globalSections, 12) }; }
function normalizeVisual(value: Record<string, unknown>) { return { schemaVersion: '1.0', type: 'visual-direction', color: isObject(value.color) ? value.color : {}, typography: isObject(value.typography) ? value.typography : {}, spacing: isObject(value.spacing) ? value.spacing : {}, radius: isObject(value.radius) ? value.radius : {}, shadow: isObject(value.shadow) ? value.shadow : {}, motion: isObject(value.motion) ? value.motion : {}, layout: isObject(value.layout) ? value.layout : {}, imagery: isObject(value.imagery) ? value.imagery : {} }; }
function list(value: unknown, max: number) { return Array.isArray(value) ? value.slice(0, max).map((x) => typeof x === 'string' ? x.slice(0, 500) : x) : []; }
function text(value: unknown, fallback: string, max: number) { return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback; }
function number(value: unknown, fallback: number) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback; }
function isObject(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function clean(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function normalizeUrl(value: unknown) { try { const url = new URL(clean(value, 500)); if (!['http:', 'https:'].includes(url.protocol)) return ''; const host = url.hostname.toLowerCase(); if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) return ''; return url.toString(); } catch { return ''; } }
function json(body: unknown, status: number, cors: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } }); }
