import type { GrowthVerticalId } from "../config/verticals";

export type OutcomeStatus = "success" | "partial_success" | "no_impact" | "negative" | "insufficient_data";
export type ActionRisk = "low" | "medium" | "high";
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type MissionStatus = "draft" | "awaiting_approval" | "approved" | "executing" | "measuring" | "completed" | "cancelled" | "failed" | "human_review";

export type GrowthKpi = { key: string; label: string; unit: "currency" | "count" | "percentage" | "ratio" | "score" | "duration"; baseline?: number; current?: number; target?: number };
export type GrowthAction = { id: string; title: string; description: string; risk: ActionRisk; autonomyLevel: AutonomyLevel; requiresApproval: boolean; expectedImpact?: string; rollbackStrategy?: string };
export type GrowthMission = { id: string; businessId: string; vertical: GrowthVerticalId; objective: string; baseline?: string; target?: string; deadline?: string; expectedImpact?: string; confidence?: number; actions: GrowthAction[]; measurementKpis: GrowthKpi[]; status: MissionStatus };
export type GrowthOutcome = { missionId: string; actionId?: string; status: OutcomeStatus; measuredAt: string; metrics: Record<string, { baseline?: number; before?: number; after?: number; delta?: number }>; evidence?: string[]; confidence: number };
export type GrowthDecisionContext = { vertical: GrowthVerticalId; businessId: string; objective: string; kpis: GrowthKpi[]; recentOutcomes?: GrowthOutcome[] };
export type ActionPolicy = { risk: ActionRisk; autonomyLevel: AutonomyLevel; requiresApproval: boolean; maxFrequencyPerDay?: number; maxBudget?: number; allowedIntegrations?: readonly string[] };
export function isAutonomousAction(action: GrowthAction): boolean { return action.autonomyLevel >= 3 && !action.requiresApproval; }
export function classifyOutcome(confidence: number, delta: number | undefined): OutcomeStatus { if (delta === undefined || confidence < 0.5) return "insufficient_data"; if (delta > 0) return confidence >= 0.8 ? "success" : "partial_success"; if (delta === 0) return "no_impact"; return "negative"; }
