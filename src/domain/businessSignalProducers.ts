import type { BusinessContext, BusinessSignal, Evidence } from "./universalBusinessCore";
import { createEvidence, createSignal } from "./universalBusinessIntelligence";

export type SignalProducerKind =
  | "website"
  | "reviews"
  | "menu"
  | "analytics"
  | "competitor";

export type SignalProducerInput = {
  business: BusinessContext;
  observedAt?: string;
};

export type SignalProducerResult = {
  producer: SignalProducerKind;
  signals: BusinessSignal[];
  evidence: Evidence[];
  warnings: string[];
};

export interface BusinessSignalProducer<TInput = unknown> {
  readonly kind: SignalProducerKind;
  produce(input: SignalProducerInput, sourceData: TInput): SignalProducerResult;
}

export type WebsiteIntelligenceInput = {
  url?: string;
  performanceScore?: number;
  seoScore?: number;
  mobileScore?: number;
  accessibilityScore?: number;
  trustScore?: number;
  issues?: string[];
};

export type ReviewIntelligenceInput = {
  averageRating?: number;
  reviewCount?: number;
  recentAverageRating?: number;
  negativeThemes?: string[];
  positiveThemes?: string[];
};

export type MenuProductIntelligenceInput = {
  itemCount?: number;
  averagePrice?: number;
  topItems?: Array<{ name: string; salesShare?: number; margin?: number }>;
  lowPerformers?: string[];
  categoryGaps?: string[];
};

export type AnalyticsKpiInput = {
  revenue?: number;
  revenueBaseline?: number;
  averageOrderValue?: number;
  averageOrderValueBaseline?: number;
  conversionRate?: number;
  conversionRateBaseline?: number;
  occupancyRate?: number;
  occupancyRateBaseline?: number;
  traffic?: number;
  trafficBaseline?: number;
};

export type CompetitorIntelligenceInput = {
  competitors?: Array<{
    name: string;
    rating?: number;
    priceLevel?: number;
    positioning?: string;
    observedAt?: string;
  }>;
  pricingGaps?: string[];
  positioningGaps?: string[];
};

function uuid(): string {
  const value = globalThis.crypto?.randomUUID?.();
  if (!value) throw new Error("Secure UUID generation is unavailable in this runtime.");
  return value;
}

function confidence(value: number | undefined, fallback = 0.65): number {
  return Math.max(0, Math.min(1, value ?? fallback));
}

function result(producer: SignalProducerKind, signals: BusinessSignal[], evidence: Evidence[], warnings: string[] = []): SignalProducerResult {
  return { producer, signals, evidence, warnings };
}

export const websiteSignalProducer: BusinessSignalProducer<WebsiteIntelligenceInput> = {
  kind: "website",
  produce({ business, observedAt = new Date().toISOString() }, data) {
    const signals: BusinessSignal[] = [];
    const evidence: Evidence[] = [];
    const scores: Array<[string, number | undefined]> = [
      ["website.performance", data.performanceScore],
      ["website.seo", data.seoScore],
      ["website.mobile", data.mobileScore],
      ["website.accessibility", data.accessibilityScore],
      ["website.trust", data.trustScore],
    ];
    for (const [metric, value] of scores) {
      if (value === undefined) continue;
      const direction = value < 60 ? "negative" : value >= 80 ? "positive" : "neutral";
      const signal = createSignal({
        id: uuid(), businessId: business.business.id,
        type: value < 60 ? "threshold_breach" : "metric_change", source: "website-intelligence", metric,
        value, direction, confidence: 0.85, context: { url: data.url ?? business.business.websiteUrl, issues: data.issues ?? [] }, observedAt,
      });
      signals.push(signal);
      evidence.push(createEvidence({ id: uuid(), businessId: business.business.id, type: "observation", source: "website-intelligence", observation: `${metric} scored ${value}/100.`, data: { value, issues: data.issues ?? [] }, supportingSignalIds: [signal.id], confidence: 0.85, observedAt }));
    }
    return result("website", signals, evidence, scores.every(([, value]) => value === undefined) ? ["No website audit scores supplied."] : []);
  },
};

export const reviewSignalProducer: BusinessSignalProducer<ReviewIntelligenceInput> = {
  kind: "reviews",
  produce({ business, observedAt = new Date().toISOString() }, data) {
    const signals: BusinessSignal[] = [];
    const evidence: Evidence[] = [];
    const rating = data.recentAverageRating ?? data.averageRating;
    if (rating !== undefined) {
      const signal = createSignal({ id: uuid(), businessId: business.business.id, type: rating < 4 ? "threshold_breach" : "metric_change", source: "review-intelligence", metric: "reviews.rating", value: rating, direction: rating < 4 ? "negative" : "positive", confidence: confidence(data.reviewCount ? Math.min(1, data.reviewCount / 100) : undefined), context: { reviewCount: data.reviewCount ?? 0, negativeThemes: data.negativeThemes ?? [], positiveThemes: data.positiveThemes ?? [] }, observedAt });
      signals.push(signal);
      evidence.push(createEvidence({ id: uuid(), businessId: business.business.id, type: "review", source: "review-intelligence", observation: `Observed review rating ${rating.toFixed(2)}.`, data: { reviewCount: data.reviewCount ?? 0, negativeThemes: data.negativeThemes ?? [], positiveThemes: data.positiveThemes ?? [] }, supportingSignalIds: [signal.id], confidence: signal.confidence, observedAt }));
    }
    return result("reviews", signals, evidence, rating === undefined ? ["No review rating supplied."] : []);
  },
};

export const menuSignalProducer: BusinessSignalProducer<MenuProductIntelligenceInput> = {
  kind: "menu",
  produce({ business, observedAt = new Date().toISOString() }, data) {
    const signals: BusinessSignal[] = [];
    const evidence: Evidence[] = [];
    if (data.lowPerformers?.length) {
      const signal = createSignal({ id: uuid(), businessId: business.business.id, type: "opportunity", source: "menu-intelligence", metric: "menu.low_performers", value: data.lowPerformers.length, direction: "negative", confidence: 0.75, context: { items: data.lowPerformers }, observedAt });
      signals.push(signal);
      evidence.push(createEvidence({ id: uuid(), businessId: business.business.id, type: "observation", source: "menu-intelligence", observation: `${data.lowPerformers.length} low-performing menu items identified.`, data: { items: data.lowPerformers }, supportingSignalIds: [signal.id], confidence: 0.75, observedAt }));
    }
    if (data.categoryGaps?.length) {
      const signal = createSignal({ id: uuid(), businessId: business.business.id, type: "opportunity", source: "menu-intelligence", metric: "menu.category_gaps", value: data.categoryGaps.length, direction: "negative", confidence: 0.7, context: { gaps: data.categoryGaps }, observedAt });
      signals.push(signal);
      evidence.push(createEvidence({ id: uuid(), businessId: business.business.id, type: "observation", source: "menu-intelligence", observation: `${data.categoryGaps.length} category gaps identified.`, data: { gaps: data.categoryGaps }, supportingSignalIds: [signal.id], confidence: 0.7, observedAt }));
    }
    return result("menu", signals, evidence, signals.length ? [] : ["No actionable menu signals supplied."]);
  },
};

export const analyticsKpiSignalProducer: BusinessSignalProducer<AnalyticsKpiInput> = {
  kind: "analytics",
  produce({ business, observedAt = new Date().toISOString() }, data) {
    const signals: BusinessSignal[] = [];
    const evidence: Evidence[] = [];
    const pairs: Array<[string, number | undefined, number | undefined]> = [
      ["revenue", data.revenue, data.revenueBaseline],
      ["average_order_value", data.averageOrderValue, data.averageOrderValueBaseline],
      ["conversion_rate", data.conversionRate, data.conversionRateBaseline],
      ["occupancy_rate", data.occupancyRate, data.occupancyRateBaseline],
      ["traffic", data.traffic, data.trafficBaseline],
    ];
    for (const [metric, value, baseline] of pairs) {
      if (value === undefined) continue;
      const deviation = baseline === undefined || baseline === 0 ? undefined : ((value - baseline) / Math.abs(baseline)) * 100;
      const direction = deviation === undefined ? "unknown" : deviation < -5 ? "negative" : deviation > 5 ? "positive" : "neutral";
      const signal = createSignal({ id: uuid(), businessId: business.business.id, type: Math.abs(deviation ?? 0) >= 10 ? "anomaly" : "metric_change", source: "analytics-kpi", metric: `kpi.${metric}`, value, baseline, deviation, direction, confidence: baseline === undefined ? 0.65 : 0.9, context: {}, observedAt });
      signals.push(signal);
      evidence.push(createEvidence({ id: uuid(), businessId: business.business.id, type: "measurement", source: "analytics-kpi", observation: baseline === undefined ? `${metric} measured at ${value}.` : `${metric} changed ${deviation!.toFixed(1)}% versus baseline.`, data: { value, baseline, deviation }, supportingSignalIds: [signal.id], confidence: signal.confidence, observedAt }));
    }
    return result("analytics", signals, evidence, signals.length ? [] : ["No KPI measurements supplied."]);
  },
};

export const competitorSignalProducer: BusinessSignalProducer<CompetitorIntelligenceInput> = {
  kind: "competitor",
  produce({ business, observedAt = new Date().toISOString() }, data) {
    const signals: BusinessSignal[] = [];
    const evidence: Evidence[] = [];
    if (data.pricingGaps?.length) {
      const signal = createSignal({ id: uuid(), businessId: business.business.id, type: "opportunity", source: "competitor-intelligence", metric: "competitor.pricing_gaps", value: data.pricingGaps.length, direction: "negative", confidence: 0.7, context: { gaps: data.pricingGaps }, observedAt });
      signals.push(signal);
      evidence.push(createEvidence({ id: uuid(), businessId: business.business.id, type: "observation", source: "competitor-intelligence", observation: `${data.pricingGaps.length} competitor pricing gaps observed.`, data: { gaps: data.pricingGaps, competitors: data.competitors ?? [] }, supportingSignalIds: [signal.id], confidence: 0.7, observedAt }));
    }
    if (data.positioningGaps?.length) {
      const signal = createSignal({ id: uuid(), businessId: business.business.id, type: "opportunity", source: "competitor-intelligence", metric: "competitor.positioning_gaps", value: data.positioningGaps.length, direction: "negative", confidence: 0.65, context: { gaps: data.positioningGaps, competitors: data.competitors ?? [] }, observedAt });
      signals.push(signal);
      evidence.push(createEvidence({ id: uuid(), businessId: business.business.id, type: "observation", source: "competitor-intelligence", observation: `${data.positioningGaps.length} competitor positioning gaps observed.`, data: { gaps: data.positioningGaps, competitors: data.competitors ?? [] }, supportingSignalIds: [signal.id], confidence: 0.65, observedAt }));
    }
    return result("competitor", signals, evidence, signals.length ? [] : ["No actionable competitor signals supplied."]);
  },
};

export const DEFAULT_SIGNAL_PRODUCERS = [websiteSignalProducer, reviewSignalProducer, menuSignalProducer, analyticsKpiSignalProducer, competitorSignalProducer] as const;

export function collectBusinessSignals(input: SignalProducerInput, sources: Partial<Record<SignalProducerKind, unknown>>, producers = DEFAULT_SIGNAL_PRODUCERS): SignalProducerResult {
  const results = producers.map((producer) => producer.produce(input, sources[producer.kind] ?? {}));
  return {
    producer: "analytics",
    signals: results.flatMap((item) => item.signals),
    evidence: results.flatMap((item) => item.evidence),
    warnings: results.flatMap((item) => item.warnings.map((warning) => `${item.producer}: ${warning}`)),
  };
}
