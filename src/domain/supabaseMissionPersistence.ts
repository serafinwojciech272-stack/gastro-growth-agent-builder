import type { SupabaseClient } from "@supabase/supabase-js";
import type { GrowthAction, GrowthMission, GrowthOutcome } from "./growthTypes";
import type { MissionPersistence, MissionRecord } from "./missionPersistence";

type MissionRow = {
  id: string;
  business_id: string;
  vertical: GrowthMission["vertical"];
  objective: string;
  baseline: string | null;
  target: string | null;
  deadline: string | null;
  expected_impact: string | null;
  confidence: number | null;
  status: GrowthMission["status"];
};

type ActionRow = Omit<GrowthAction, "id"> & { id: string; mission_id: string };

export class SupabaseMissionPersistence implements MissionPersistence {
  constructor(private readonly supabase: SupabaseClient) {}

  async saveMission(mission: GrowthMission): Promise<void> {
    const { error } = await this.supabase.from("growth_missions").upsert({
      id: mission.id,
      business_id: mission.id,
      vertical: mission.vertical,
      objective: mission.objective,
      baseline: mission.baseline ?? null,
      target: mission.target ?? null,
      deadline: mission.deadline ?? null,
      expected_impact: mission.expectedImpact ?? null,
      confidence: mission.confidence ?? null,
      status: mission.status,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async saveActions(missionId: string, actions: readonly GrowthAction[]): Promise<void> {
    const rows = actions.map((action) => ({
      id: action.id,
      mission_id: missionId,
      title: action.title,
      description: action.description,
      risk: action.risk,
      autonomy_level: action.autonomyLevel,
      requires_approval: action.requiresApproval,
      expected_impact: action.expectedImpact ?? null,
      rollback_strategy: action.rollbackStrategy ?? null,
    }));
    const { error } = await this.supabase.from("growth_actions").upsert(rows);
    if (error) throw error;
  }

  async saveOutcome(outcome: GrowthOutcome): Promise<void> {
    const { error } = await this.supabase.from("growth_outcomes").insert({
      mission_id: outcome.missionId,
      action_id: outcome.actionId ?? null,
      status: outcome.status,
      confidence: outcome.confidence,
      metrics: outcome.metrics,
      evidence: outcome.evidence ?? [],
      measured_at: outcome.measuredAt,
    });
    if (error) throw error;
  }

  async getMission(missionId: string): Promise<MissionRecord | null> {
    const missionResult = await this.supabase.from("growth_missions").select("*").eq("id", missionId).maybeSingle();
    if (missionResult.error) throw missionResult.error;
    if (!missionResult.data) return null;

    const actionsResult = await this.supabase.from("growth_actions").select("*").eq("mission_id", missionId).order("created_at", { ascending: true });
    if (actionsResult.error) throw actionsResult.error;

    const row = missionResult.data as MissionRow;
    const actions = (actionsResult.data ?? []).map((action) => {
      const item = action as ActionRow;
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        risk: item.risk,
        autonomyLevel: item.autonomy_level,
        requiresApproval: item.requires_approval,
        expectedImpact: item.expected_impact ?? undefined,
        rollbackStrategy: item.rollback_strategy ?? undefined,
      } satisfies GrowthAction;
    });

    return {
      mission: {
        id: row.id,
        vertical: row.vertical,
        objective: row.objective,
        baseline: row.baseline ?? undefined,
        target: row.target ?? undefined,
        deadline: row.deadline ?? undefined,
        expectedImpact: row.expected_impact ?? undefined,
        confidence: row.confidence ?? undefined,
        actions,
        measurementKpis: [],
        status: row.status,
      },
      actions,
    };
  }
}
