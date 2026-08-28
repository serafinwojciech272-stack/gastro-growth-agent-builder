import type { SupabaseClient } from "@supabase/supabase-js";

export type GrowthCommandCenterSnapshot = {
  missions: Array<{ id: string; objective: string; status: string; expectedImpact: string | null; confidence: number | null; createdAt: string }>;
  actions: Array<{ id: string; missionId: string; title: string; status: string; risk: string; autonomyLevel: number }>;
  events: Array<{ id: string; missionId: string; type: string; actor: string; createdAt: string }>;
  outcomes: Array<{ id: string; missionId: string; status: string; confidence: number; metrics: Record<string, unknown>; measuredAt: string }>;
};

export async function getGrowthCommandCenterSnapshot(
  supabase: SupabaseClient,
  businessId: string,
): Promise<GrowthCommandCenterSnapshot> {
  const missions = await supabase
    .from("growth_missions")
    .select("id, objective, status, expected_impact, confidence, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (missions.error) throw missions.error;

  const missionIds = (missions.data ?? []).map((m) => m.id);
  if (missionIds.length === 0) return { missions: [], actions: [], events: [], outcomes: [] };

  const [actions, events, outcomes] = await Promise.all([
    supabase.from("growth_actions").select("id, mission_id, title, status, risk, autonomy_level").in("mission_id", missionIds),
    supabase.from("growth_events").select("id, mission_id, type, actor, created_at").in("mission_id", missionIds).order("created_at", { ascending: false }).limit(50),
    supabase.from("growth_outcomes").select("id, mission_id, status, confidence, metrics, measured_at").in("mission_id", missionIds).order("measured_at", { ascending: false }).limit(50),
  ]);
  if (actions.error) throw actions.error;
  if (events.error) throw events.error;
  if (outcomes.error) throw outcomes.error;

  return {
    missions: (missions.data ?? []).map((m) => ({ id: m.id, objective: m.objective, status: m.status, expectedImpact: m.expected_impact, confidence: m.confidence, createdAt: m.created_at })),
    actions: (actions.data ?? []).map((a) => ({ id: a.id, missionId: a.mission_id, title: a.title, status: a.status, risk: a.risk, autonomyLevel: a.autonomy_level })),
    events: (events.data ?? []).map((e) => ({ id: e.id, missionId: e.mission_id, type: e.type, actor: e.actor, createdAt: e.created_at })),
    outcomes: (outcomes.data ?? []).map((o) => ({ id: o.id, missionId: o.mission_id, status: o.status, confidence: o.confidence, metrics: o.metrics, measuredAt: o.measured_at })),
  };
}
