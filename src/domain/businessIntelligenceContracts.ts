/**
 * Compatibility surface for the Universal Business Intelligence layer.
 *
 * The canonical domain contracts live in universalBusinessCore.ts. Keep this
 * module as a stable import boundary for consumers while avoiding a second
 * competing set of Business/Evidence/Opportunity semantics.
 */
export type {
  Business,
  BusinessBrand,
  BusinessConstraint,
  BusinessContext,
  BusinessEntity,
  BusinessEntityType,
  BusinessGoal,
  BusinessModel,
  BusinessRelationship,
  BusinessRelationshipType,
  BusinessSignal,
  Evidence,
  EvidenceType,
  Diagnosis,
  Opportunity,
  Recommendation,
  PriorityPolicy,
  PriorityScore,
  SignalDirection,
  SignalType,
} from "./universalBusinessCore";

export type BusinessId = string;
export type SignalId = string;
export type EvidenceId = string;
export type DiagnosisId = string;
export type OpportunityId = string;
export type RecommendationId = string;
export type Confidence = number;
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type PriorityDecision = import("./universalBusinessCore").PriorityScore;

export { DEFAULT_PRIORITY_POLICY, rankOpportunities, scoreOpportunity } from "./universalBusinessCore";

export const shouldRequireApproval = (risk: RiskLevel, irreversible = false): boolean =>
  irreversible || risk === "high" || risk === "critical";
