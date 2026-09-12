import type { GrowthAction, GrowthKpi, GrowthMission } from "./growthTypes";

export type MarketingChannel = "google_business" | "facebook" | "instagram" | "tiktok" | "email" | "website";
export type MarketingObjective = "awareness" | "traffic" | "reservations" | "revenue" | "retention";

export type MarketingBrief = {
  id: string;
  businessId: string;
  objective: MarketingObjective;
  audience: string;
  offer: string;
  channels: MarketingChannel[];
  message: string;
  callToAction: string;
  kpis: GrowthKpi[];
};

export type MarketingPlan = {
  id: string;
  businessId: string;
  brief: MarketingBrief;
  actions: GrowthAction[];
  mission: GrowthMission;
};

export function buildMarketingBrief(input: Omit<MarketingBrief, "id">): MarketingBrief {
  if (!input.businessId.trim()) throw new Error("Marketing brief requires businessId");
  if (!input.audience.trim()) throw new Error("Marketing brief requires audience");
  if (!input.offer.trim()) throw new Error("Marketing brief requires offer");
  if (!input.message.trim()) throw new Error("Marketing brief requires message");
  if (!input.callToAction.trim()) throw new Error("Marketing brief requires callToAction");
  if (input.channels.length === 0) throw new Error("Marketing brief requires at least one channel");
  if (input.kpis.length === 0) throw new Error("Marketing brief requires at least one KPI");
  return { id: crypto.randomUUID(), ...input };
}

export function buildMarketingPlan(brief: MarketingBrief, mission: GrowthMission): MarketingPlan {
  if (mission.businessId !== brief.businessId) throw new Error("Marketing brief and mission businessId must match");
  const actions: GrowthAction[] = brief.channels.map((channel) => ({
    id: crypto.randomUUID(),
    title: `Prepare ${channel} campaign`,
    description: `${brief.message} CTA: ${brief.callToAction}`,
    risk: "low",
    autonomyLevel: 2,
    requiresApproval: true,
    expectedImpact: brief.objective,
    rollbackStrategy: "Disable or remove the campaign asset and restore the previous version."
  }));
  return { id: crypto.randomUUID(), businessId: brief.businessId, brief, actions, mission };
}
