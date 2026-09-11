import type { BusinessSignal } from "./universalBusinessCore";

export type RawBusinessSignal = Omit<BusinessSignal, "id" | "businessId"> & {
  id?: string;
  businessId?: string;
};

const clampConfidence = (value: number): number => Math.max(0, Math.min(1, value <= 1 ? value : value / 100));

export function normalizeBusinessSignals(
  businessId: string,
  signals: readonly RawBusinessSignal[],
): BusinessSignal[] {
  if (!businessId.trim()) throw new Error("Business id is required");

  return signals.map((signal, index) => {
    const source = signal.source.trim();
    const metric = signal.metric?.trim();
    if (!source) throw new Error(`Signal ${signal.id ?? index} has an empty source`);
    if (!signal.type) throw new Error(`Signal ${signal.id ?? index} has no type`);
    if (signal.value === "") throw new Error(`Signal ${signal.id ?? index} has an empty value`);

    return {
      ...signal,
      id: signal.id?.trim() || `${businessId}:signal:${index + 1}`,
      businessId,
      source,
      metric: metric || undefined,
      confidence: clampConfidence(signal.confidence),
      context: signal.context ?? {},
    };
  });
}
