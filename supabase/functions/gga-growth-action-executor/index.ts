import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const externalTypes = new Set(['publish_social', 'publish_google_business', 'send_email', 'launch_ad']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Invalid session' }, 401);
    const body = await req.json().catch(() => null);
    const actionId = typeof body?.actionId === 'string' ? body.actionId : '';
    if (!actionId) return json({ error: 'actionId is required' }, 400);

    const { data: action, error } = await supabase.from('growth_actions').select('*').eq('id', actionId).single();
    if (error || !action) return json({ error: 'Action not found or access denied' }, 404);
    if (action.status !== 'approved') return json({ error: 'Action requires customer approval before execution' }, 409);

    await supabase.from('growth_actions').update({ status: 'in_progress' }).eq('id', actionId).eq('status', 'approved');
    await supabase.from('growth_action_events').insert({ action_id: action.id, restaurant_id: action.restaurant_id, event_type: 'started', created_by: user.id });

    if (externalTypes.has(action.action_type)) {
      const result = { state: 'awaiting_integration', reason: 'External provider authorization is required.', provider_action: action.action_type };
      await supabase.from('growth_actions').update({ status: 'approved', metadata: { ...(action.metadata ?? {}), execution: result } }).eq('id', actionId);
      await supabase.from('growth_action_events').insert({ action_id: action.id, restaurant_id: action.restaurant_id, event_type: 'failed', metadata: result, created_by: user.id });
      return json({ status: 'awaiting_integration', result });
    }

    const result = { state: 'completed', execution_type: 'internal', completed_at: new Date().toISOString() };
    const { error: updateError } = await supabase.from('growth_actions').update({ status: 'completed', completed_at: result.completed_at, metadata: { ...(action.metadata ?? {}), execution: result } }).eq('id', actionId);
    if (updateError) throw updateError;
    await supabase.from('growth_action_events').insert({ action_id: action.id, restaurant_id: action.restaurant_id, event_type: 'completed', metadata: result, created_by: user.id });
    return json({ status: 'completed', result });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Growth action execution failed' }, 400); }
});

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } }); }
