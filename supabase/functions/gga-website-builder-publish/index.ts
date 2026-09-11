import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED = ['https://gastrogrowthadvisor.com', 'https://gastro-growth-agent-builder.vercel.app'];

function headers(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : 'https://gastrogrowthadvisor.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function out(body: unknown, status = 200, cors: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const cors = headers(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return out({ error: 'Method not allowed' }, 405, cors);

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return out({ error: 'Authentication required' }, 401, cors);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) throw new Error('Supabase environment is incomplete');

    const sb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData } = await sb.auth.getUser();
    const user = authData.user;
    if (!user) return out({ error: 'Invalid session' }, 401, cors);

    const body = await req.json().catch(() => null);
    const projectId = typeof body?.projectId === 'string' ? body.projectId : '';
    if (!projectId) return out({ error: 'projectId is required' }, 400, cors);

    const query = await sb.from('website_builder_projects').select('*').eq('id', projectId).eq('user_id', user.id).single();
    if (query.error) throw query.error;
    const project = query.data;
    const qa = project.artifacts?.QA as Record<string, unknown> | undefined;
    const completed = Array.isArray(project.completed_stages) ? project.completed_stages : [];

    if (!completed.includes(9)) return out({ error: 'QA must be completed before Publish.' }, 409, cors);
    if (qa?.releaseGate === 'BLOCKED') return out({ error: 'Publish blocked by QA release gate.' }, 409, cors);
    if (project.status === 'published') return out({ project, publish: project.artifacts?.Publish }, 200, cors);

    const publish = {
      schemaVersion: '1.0',
      type: 'publish-release',
      publishedAt: new Date().toISOString(),
      version: Number(project.version) + 1,
      qaGate: String(qa?.releaseGate || 'PASS'),
      qaScore: Number(qa?.score || 0),
      rollbackVersion: Number(project.version),
      releaseId: `rel_${project.id.slice(0, 8)}_${Date.now()}`,
    };

    const nextCompleted = Array.from(new Set([...completed, 10])).sort((a, b) => a - b);
    const update = await sb
      .from('website_builder_projects')
      .update({
        status: 'published',
        active_stage: 10,
        completed_stages: nextCompleted,
        artifacts: { ...project.artifacts, Publish: publish },
        version: Number(project.version) + 1,
      })
      .eq('id', project.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (update.error) throw update.error;
    return out({ project: update.data, publish }, 200, cors);
  } catch (error) {
    console.error('builder publish', error);
    return out({ error: error instanceof Error ? error.message : 'Publish failed' }, 502, cors);
  }
});
