import type { BusinessSignal, SignalSource } from "./businessIntelligenceContracts";

export type RawBusinessSignal = Omit<BusinessSignal, "id" | "businessId"> & { id?: string; businessId?: string };

const VALID_SOURCES: readonly SignalSource[] = ["website", "seo", "ads", "reviews", "sales", "customers", "operations", "finance", "content", "market", "manual", "integration"];

export function normalizeBusinessSignals(businessId: string, signals: readonly RawBusinessSignal[]): BusinessSignal[] {
  return signals.map((signal, index) => {
    if (!VALID_SOURCES.includes(signal.source)) throw new Error(`Unsupported signal source: ${signal.source}`);
    const value = typeof signal.value === "string" ? signal.value.trim() : signal.value;
    if (value === "") throw new Error(`Signal ${signal.id ?? index} has an empty value`);
    return {
      ...signal,
      id: signal.id ?? `${businessId}:signal:${index + 1}`,
      businessId,
      metric: signal.metric.trim(),
      value,
      confidence: signal.confidence,
    };
  });
}
