import type { BusinessContext } from "./universalBusinessCore";
import type { WebsiteIntelligenceInput } from "./businessSignalProducers";

/**
 * Normalized shape accepted from the existing Website Audit layer.
 * The adapter is deliberately tolerant of common audit field names so the
 * intelligence core does not become coupled to one UI/service payload.
 */
export type WebsiteAuditSnapshot = {
  url?: string;
  performanceScore?: number;
  seoScore?: number;
  mobileScore?: number;
  accessibilityScore?: number;
  trustScore?: number;
  issues?: string[];
  scores?: {
    performance?: number;
    seo?: number;
    mobile?: number;
    accessibility?: number;
    trust?: number;
  };
};

function finiteScore(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return values.length ? values : undefined;
}

export function normalizeWebsiteAuditSnapshot(value: unknown): WebsiteIntelligenceInput | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as WebsiteAuditSnapshot;
  const scores = raw.scores ?? {};
  const normalized: WebsiteIntelligenceInput = {
    url: typeof raw.url === "string" ? raw.url : undefined,
    performanceScore: finiteScore(raw.performanceScore ?? scores.performance),
    seoScore: finiteScore(raw.seoScore ?? scores.seo),
    mobileScore: finiteScore(raw.mobileScore ?? scores.mobile),
    accessibilityScore: finiteScore(raw.accessibilityScore ?? scores.accessibility),
    trustScore: finiteScore(raw.trustScore ?? scores.trust),
    issues: stringArray(raw.issues),
  };

  const hasScore = [
    normalized.performanceScore,
    normalized.seoScore,
    normalized.mobileScore,
    normalized.accessibilityScore,
    normalized.trustScore,
  ].some((score) => score !== undefined);

  return hasScore || normalized.url || normalized.issues ? normalized : undefined;
}

/**
 * Resolve Website Audit data already carried by BusinessContext.
 * Explicit producer input remains preferred; this is only the organic bridge
 * from the business knowledge layer into the canonical signal producer.
 */
export function websiteAuditFromBusinessContext(context: BusinessContext): WebsiteIntelligenceInput | undefined {
  const candidate = context.verticalContext?.websiteAudit;
  const normalized = normalizeWebsiteAuditSnapshot(candidate);
  if (!normalized) return undefined;
  return {
    ...normalized,
    url: normalized.url ?? context.business.websiteUrl,
  };
}
