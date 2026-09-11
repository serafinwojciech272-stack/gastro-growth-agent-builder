import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401, corsHeaders);
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anonKey || !serviceRoleKey) return json({ error: 'Supabase environment is incomplete' }, 500, corsHeaders);

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(url, serviceRoleKey);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'Invalid session' }, 401, corsHeaders);

    const body = await req.json().catch(() => null);
    const missionId = typeof body?.mission_id === 'string' ? body.mission_id.trim() : '';
    if (!missionId) return json({ error: 'mission_id is required' }, 400, corsHeaders);

    const { data: membership, error: membershipError } = await userClient.from('organization_members').select('organization_id,role').eq('user_id', user.id).limit(1).maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return json({ error: 'No business workspace found.' }, 404, corsHeaders);

    const { data: mission, error: missionError } = await userClient.from('growth_mission_runs').select('id,business_id,status,approved_at,mission_json,decision_json').eq('id', missionId).maybeSingle();
    if (missionError) throw missionError;
    if (!mission) return json({ error: 'Mission not found or not accessible.' }, 404, corsHeaders);
    if (mission.status !== 'awaiting_approval') return json({ error: `Mission cannot be approved from status: ${mission.status}` }, 409, corsHeaders);

    const { data: business, error: businessError } = await userClient.from('business_profiles').select('id,organization_id').eq('id', mission.business_id).eq('organization_id', membership.organization_id).maybeSingle();
    if (businessError) throw businessError;
    if (!business) return json({ error: 'Mission does not belong to your workspace.' }, 403, corsHeaders);

    const approvedAt = new Date().toISOString();
    const decision = { ...(mission.decision_json ?? {}), requires_approval: false, approved_by_user_id: user.id, approved_at: approvedAt, governance: 'mission-approval-gate-v1' };
    const missionJson = { ...(mission.mission_json ?? {}), governance: { ...(typeof mission.mission_json?.governance === 'object' && mission.mission_json.governance !== null ? mission.mission_json.governance : {}), approval: 'approved', approved_at: approvedAt } };

    const { data: updated, error: updateError } = await adminClient.from('growth_mission_runs').update({ status: 'approved', approved_at: approvedAt, decision_json: decision, mission_json: missionJson, updated_at: approvedAt }).eq('id', missionId).eq('status', 'awaiting_approval').select('id,business_id,status,approved_at,updated_at').maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return json({ error: 'Mission approval conflict. Reload and try again.' }, 409, corsHeaders);

    return json({ mission: updated, next_step: 'execution' }, 200, corsHeaders);
  } catch (error) {
    console.error('GA mission approval error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected mission approval error.' }, 502, corsHeaders);
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
