export type BusinessId = string;
export type SignalId = string;
export type EvidenceId = string;
export type DiagnosisId = string;
export type OpportunityId = string;
export type RecommendationId = string;

export type Confidence = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type LifecycleStatus = "draft" | "active" | "resolved" | "archived";

export interface BusinessContext {
  businessId: BusinessId;
  name: string;
  industry: string;
  vertical?: string;
  businessModel?: string;
  products?: string[];
  services?: string[];
  customerSegments?: string[];
  competitors?: string[];
  pricingModel?: string;
  goals?: string[];
  constraints?: string[];
  channels?: string[];
  operatingRegions?: string[];
  brandPositioning?: string;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export type SignalSource =
  | "website"
  | "seo"
  | "ads"
  | "reviews"
  | "sales"
  | "customers"
  | "operations"
  | "finance"
  | "content"
  | "market"
  | "manual"
  | "integration";

export interface BusinessSignal {
  id: SignalId;
  businessId: BusinessId;
  source: SignalSource;
  metric: string;
  value: number | string | boolean;
  unit?: string;
  baseline?: number;
  delta?: number;
  deltaPercent?: number;
  observedAt: string;
  periodStart?: string;
  periodEnd?: string;
  confidence: Confidence;
  metadata?: Record<string, unknown>;
}

export interface Evidence {
  id: EvidenceId;
  businessId: BusinessId;
  signalIds: SignalId[];
  claim: string;
  observation: string;
  source: SignalSource | "derived";
  strength: number;
  confidence: Confidence;
  capturedAt: string;
  metadata?: Record<string, unknown>;
}

export interface Diagnosis {
  id: DiagnosisId;
  businessId: BusinessId;
  title: string;
  problem: string;
  mechanism: string;
  evidenceIds: EvidenceId[];
  confidence: Confidence;
  confidenceScore: number;
  affectedDomains: string[];
  status: LifecycleStatus;
  createdAt: string;
}

export interface Opportunity {
  id: OpportunityId;
  businessId: BusinessId;
  diagnosisId: DiagnosisId;
  title: string;
  desiredOutcome: string;
  impactScore: number;
  confidenceScore: number;
  effortScore: number;
  riskScore: number;
  urgencyScore: number;
  affectedDomains: string[];
  status: LifecycleStatus;
  createdAt: string;
}

export interface Recommendation {
  id: RecommendationId;
  businessId: BusinessId;
  opportunityId: OpportunityId;
  title: string;
  rationale: string;
  actions: string[];
  expectedOutcome: string;
  priorityScore: number;
  confidence: Confidence;
  risk: RiskLevel;
  requiresApproval: boolean;
  createdAt: string;
}

export interface PriorityDecision {
  recommendationId: RecommendationId;
  score: number;
  rank: number;
  factors: {
    impact: number;
    confidence: number;
    effort: number;
    risk: number;
    urgency: number;
  };
  rationale: string;
}

export const calculatePriorityScore = (factors: {
  impact: number;
  confidence: number;
  effort: number;
  risk: number;
  urgency: number;
}): number => {
  const { impact, confidence, effort, risk, urgency } = factors;
  const score = impact * 0.35 + confidence * 0.25 + urgency * 0.2 - effort * 0.1 - risk * 0.1;
  return Math.max(0, Math.min(100, Math.round(score)));
};

export const shouldRequireApproval = (risk: RiskLevel, irreversible = false): boolean =>
  irreversible || risk === "high" || risk === "critical";
