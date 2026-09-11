import { describe, expect, it } from 'vitest';
import { aggregatePredictionError, isMemoryReusable, memoryFromOutcome } from './businessMemory';
import type { GrowthOutcome } from './growthTypes';

describe('business memory', () => {
  it('stores prediction error and measured outcome as reusable evidence when confidence is sufficient', () => {
    const outcome: GrowthOutcome = {
      missionId: 'm1',
      status: 'success',
      measuredAt: '2026-09-11T10:00:00.000Z',
      metrics: { revenue: { before: 100, after: 120, delta: 20 } },
      evidence: ['outcome:revenue'],
      confidence: 0.9,
      predictionErrors: [{ kpi: 'revenue', predictedDelta: 30, actualDelta: 20, absoluteError: 10, signedError: -10, directionCorrect: true, confidence: 0.8 }],
    };
    const memory = memoryFromOutcome('b1', outcome);
    expect(memory).toHaveLength(2);
    expect(memory.some((entry) => entry.kind === 'prediction_error' && isMemoryReusable(entry))).toBe(true);
  });

  it('does not mark insufficient data as reusable', () => {
    const outcome: GrowthOutcome = { missionId: 'm2', status: 'insufficient_data', measuredAt: '2026-09-11T10:00:00.000Z', metrics: { revenue: { before: 100 } }, evidence: ['partial'], confidence: 0.9 };
    expect(memoryFromOutcome('b1', outcome).every((entry) => !isMemoryReusable(entry))).toBe(true);
  });

  it('aggregates prediction error without losing directional accuracy', () => {
    const outcome: GrowthOutcome = { missionId: 'm3', status: 'success', measuredAt: '2026-09-11T10:00:00.000Z', metrics: {}, evidence: ['e'], confidence: 0.9, predictionErrors: [{ kpi: 'revenue', predictedDelta: 10, actualDelta: 8, absoluteError: 2, signedError: -2, directionCorrect: true, confidence: 0.9 }, { kpi: 'revenue', predictedDelta: 5, actualDelta: -1, absoluteError: 6, signedError: -6, directionCorrect: false, confidence: 0.9 }] };
    const aggregate = aggregatePredictionError(memoryFromOutcome('b1', outcome), 'revenue');
    expect(aggregate?.sampleSize).toBe(2);
    expect(aggregate?.meanAbsoluteError).toBe(4);
    expect(aggregate?.directionAccuracy).toBe(0.5);
  });
});
