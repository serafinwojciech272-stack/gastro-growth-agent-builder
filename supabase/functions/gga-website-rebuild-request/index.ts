import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

type Snapshot = { score?: number; trust?: { eligible?: boolean; blockers?: string[]; confidence?: number } };
Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401, cors);
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) throw new Error('Supabase server environment is incomplete');
    const admin = createClient(url, serviceKey);
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') || '', { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Invalid session' }, 401, cors);
    const body = await req.json().catch(() => null);
    const sessionId = typeof body?.session_id === 'string' ? body.session_id : '';
    if (!sessionId) return json({ error: 'session_id is required' }, 400, cors);

    const { data: session, error: sessionError } = await admin.from('website_preview_sessions').select('id,user_id,audit_snapshot').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return json({ error: 'Preview session not found.' }, 404, cors);
    const audit = session.audit_snapshot as Snapshot | null;
    const eligible = Boolean(audit?.trust?.eligible) && Number(audit?.score) >= 45 && !(audit?.trust?.blockers?.length);
    if (!eligible) return json({ error: 'Rebuild request denied by server-side trust gate.', audit_score: audit?.score ?? null, blockers: audit?.trust?.blockers ?? ['Missing or invalid trust snapshot'] }, 422, cors);

    const { data: existing } = await admin.from('website_rebuild_requests').select('id,status').eq('preview_session_id', sessionId).in('status', ['queued','approved','running']).maybeSingle();
    if (existing) return json({ request_id: existing.id, status: existing.status, deduplicated: true }, 200, cors);

    const confidence = Math.max(0, Math.min(1, Number(audit?.trust?.confidence ?? 0)));
    const { data: request, error } = await admin.from('website_rebuild_requests').insert({ preview_session_id: sessionId, user_id: user.id, status: 'queued', audit_score: Number(audit?.score), trust_confidence: confidence }).select('id,status,created_at').single();
    if (error) throw error;
    return json({ request_id: request.id, status: request.status, created_at: request.created_at, gate: { eligible: true, audit_score: Number(audit?.score), confidence } }, 201, cors);
  } catch (e) {
    console.error('GGA website rebuild request error', e);
    return json({ error: e instanceof Error ? e.message : 'Rebuild request failed.' }, 502, cors);
  }
});
function json(body: unknown, status: number, cors: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } }); }
