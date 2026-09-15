/**
 * Core AI Engine public contract boundary.
 *
 * This module deliberately re-exports the existing canonical business-intelligence
 * contracts instead of creating a second semantic model. Domain applications may
 * add vertical fields around these contracts, but the Core owns the reasoning spine.
 */
export {
  UNIVERSAL_CORE_CONTRACT_VERSION,
  DEFAULT_PRIORITY_POLICY,
  rankOpportunities,
  scoreOpportunity,
  validatePriorityPolicy,
} from "../domain/universalBusinessCore";

export type {
  IsoDateTime,
  EpistemicStatus,
  Business,
  BusinessGoal,
  BusinessConstraint,
  BusinessBrand,
  BusinessEntity,
  BusinessEntityType,
  BusinessRelationship,
  BusinessRelationshipType,
  BusinessContext,
  BusinessSignal,
  SignalDirection,
  SignalType,
  Evidence,
  EvidenceType,
  Diagnosis,
  GrowthHypothesis,
  Opportunity,
  Recommendation,
  GrowthDecision,
  MissionProposal,
  GrowthAnalysis,
  PriorityPolicy,
  PriorityScore,
} from "../domain/universalBusinessCore";

export type CoreStage =
  | "context"
  | "signal"
  | "evidence"
  | "diagnosis"
  | "opportunity"
  | "recommendation"
  | "priority"
  | "mission_intent"
  | "approval"
  | "execution"
  | "measurement"
  | "outcome"
  | "learning";

export type TruthStatus = "observed" | "calculated" | "estimated" | "simulated" | "future";

export type Provenance = {
  source: string;
  sourceId?: string;
  observedAt?: IsoDateTime;
  truthStatus: TruthStatus;
  lineageIds?: string[];
};

export type CoreTraceEvent = {
  id: string;
  runId: string;
  stage: CoreStage;
  eventType: string;
  timestamp: IsoDateTime;
  provenance?: Provenance[];
  payload: Record<string, unknown>;
};

export type MissionIntent = {
  id: string;
  businessId: string;
  decisionId: string;
  objective: string;
  actions: string[];
  kpis: string[];
  expectedOutcome: string;
  risk: "low" | "medium" | "high";
  requiresApproval: boolean;
  sourceOpportunityId?: string;
  sourceRecommendationId?: string;
  policyVersion?: string;
  createdAt: IsoDateTime;
};

export type CoreRun = {
  id: string;
  businessId: string;
  contractVersion: string;
  startedAt: IsoDateTime;
  completedAt?: IsoDateTime;
  status: "running" | "completed" | "failed" | "insufficient_data";
  trace: CoreTraceEvent[];
};
