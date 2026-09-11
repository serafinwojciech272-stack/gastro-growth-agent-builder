import type {
  Business,
  BusinessBrand,
  BusinessConstraint,
  BusinessGoal,
  BusinessModel,
} from "./universalBusinessCore";

type JsonObject = Record<string, unknown>;

export type BusinessProfileRecord = {
  id: string;
  organization_id: string;
  workspace_id?: string | null;
  name: string;
  legal_name?: string | null;
  industry: string;
  business_model: BusinessModel;
  website_url?: string | null;
  locale?: string | null;
  timezone?: string | null;
  metadata?: JsonObject | null;
  created_at: string;
  updated_at: string;
};

export type BusinessProfileAdapterOptions = {
  workspaceId: string;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asBusinessBrand(value: unknown): BusinessBrand | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const brand = value as JsonObject;
  return {
    name: typeof brand.name === "string" ? brand.name : undefined,
    positioning: typeof brand.positioning === "string" ? brand.positioning : undefined,
    tone: asStringArray(brand.tone),
    colors: asStringArray(brand.colors),
    languages: asStringArray(brand.languages),
  };
}

function asGoals(value: unknown, businessId: string): BusinessGoal[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const goal = item as JsonObject;
    if (typeof goal.title !== "string") return [];
    const priority = typeof goal.priority === "number" ? Math.max(0, Math.min(100, goal.priority)) : 50;
    const status = ["active", "paused", "completed", "cancelled"].includes(String(goal.status))
      ? (goal.status as BusinessGoal["status"])
      : "active";
    return [{
      id: typeof goal.id === "string" ? goal.id : `${businessId}:goal:${index}`,
      businessId,
      title: goal.title,
      description: typeof goal.description === "string" ? goal.description : undefined,
      metric: typeof goal.metric === "string" ? goal.metric : undefined,
      baseline: typeof goal.baseline === "number" ? goal.baseline : undefined,
      target: typeof goal.target === "number" ? goal.target : undefined,
      unit: typeof goal.unit === "string" ? goal.unit : undefined,
      priority,
      status,
      deadline: typeof goal.deadline === "string" ? goal.deadline : undefined,
    }];
  });
}

function asConstraints(value: unknown): BusinessConstraint[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const constraint = item as JsonObject;
    if (typeof constraint.description !== "string") return [];
    const types = ["budget", "capacity", "time", "compliance", "brand", "technology", "strategic", "other"];
    const type = types.includes(String(constraint.type)) ? (constraint.type as BusinessConstraint["type"]) : "other";
    const severity = constraint.severity === "hard" ? "hard" : "soft";
    return [{ type, description: constraint.description, severity }];
  });
}

export function businessFromProfile(
  profile: BusinessProfileRecord,
  options: BusinessProfileAdapterOptions,
): Business {
  const metadata = profile.metadata ?? {};

  return {
    id: profile.id,
    organizationId: profile.organization_id,
    workspaceId: profile.workspace_id ?? options.workspaceId,
    name: profile.name,
    legalName: profile.legal_name ?? undefined,
    industry: profile.industry,
    businessModel: profile.business_model,
    websiteUrl: profile.website_url ?? undefined,
    locale: profile.locale ?? undefined,
    timezone: profile.timezone ?? undefined,
    locations: asStringArray(metadata.locations),
    products: asStringArray(metadata.products),
    services: asStringArray(metadata.services),
    customerSegments: asStringArray(metadata.customerSegments),
    competitors: asStringArray(metadata.competitors),
    goals: asGoals(metadata.goals, profile.id),
    constraints: asConstraints(metadata.constraints),
    brand: asBusinessBrand(metadata.brand),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}
