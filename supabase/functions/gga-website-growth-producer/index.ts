import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401, cors);
    const url = Deno.env.get('SUPABASE_URL'); const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !anonKey) return json({ error: 'Supabase environment is incomplete' }, 500, cors);
    const sb = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: 'Invalid session' }, 401, cors);
    const body = await req.json().catch(() => null);
    const projectId = typeof body?.projectId === 'string' ? body.projectId : '';
    if (!projectId) return json({ error: 'projectId is required.' }, 400, cors);

    const { data: membership, error: membershipError } = await sb.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return json({ error: 'No business workspace found.' }, 404, cors);
    const { data: project, error: projectError } = await sb.from('website_builder_projects').select('id,organization_id,name,source_url,vertical,goal,status,active_stage,completed_stages,artifacts').eq('id', projectId).eq('organization_id', membership.organization_id).maybeSingle();
    if (projectError) throw projectError;
    if (!project) return json({ error: 'Website Builder project not found.' }, 404, cors);

    const artifacts = project.artifacts && typeof project.artifacts === 'object' ? project.artifacts as Record<string, unknown> : {};
    const qa = artifacts.QA && typeof artifacts.QA === 'object' ? artifacts.QA as Record<string, unknown> : {};
    if (String(qa.releaseGate ?? '') === 'BLOCKED') return json({ error: 'Website QA release gate is blocked. Fix QA findings before producing a growth mission.' }, 409, cors);
    if ((project.completed_stages ?? []).length < 8) return json({ error: 'Complete the core Website Builder intelligence and layout stages before producing a growth mission.' }, 409, cors);

    const brand = artifacts['Brand Extraction']; const content = artifacts['Content Intelligence']; const architecture = artifacts['Page Architecture']; const visual = artifacts['Visual Direction'];
    const problem = `Website growth opportunity for ${project.name}. Primary goal: ${project.goal || 'improve business growth'}. Source website: ${project.source_url}. Vertical: ${project.vertical}. Use the persisted Website Builder evidence and artifacts to identify the highest-value conversion or demand opportunity. Treat generated copy as proposed, not factual. Brand evidence: ${JSON.stringify(brand).slice(0, 5000)}. Content intelligence: ${JSON.stringify(content).slice(0, 5000)}. Page architecture: ${JSON.stringify(architecture).slice(0, 5000)}. Visual direction: ${JSON.stringify(visual).slice(0, 3000)}.`;

    const growthLoopUrl = `${url.replace(/\/$/, '')}/functions/v1/gga-growth-loop`;
    const response = await fetch(growthLoopUrl, { method: 'POST', headers: { Authorization: authorization, apikey: anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ problem, source: 'website_builder', source_project_id: project.id }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return json({ error: payload?.error || 'Canonical growth mission pipeline rejected the Website Builder proposal.', status: response.status }, response.status >= 400 && response.status < 500 ? response.status : 502, cors);
    return json({ producer: 'website_builder', pipeline: 'canonical-growth-loop', project_id: project.id, ...payload }, 200, cors);
  } catch (error) {
    console.error('GA Website Growth Producer error', error);
    return json({ error: error instanceof Error ? error.message : 'Website Growth Producer failed.' }, 502, cors);
  }
});

function json(body: unknown, status: number, cors: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } }); }
