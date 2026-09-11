import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregatePredictionError, isMemoryReusable, memoryFromOutcome } from './businessMemory';
import type { GrowthOutcome } from './growthTypes';

test('business memory stores prediction error and measured outcome as reusable evidence', () => {
  const outcome: GrowthOutcome = { missionId: 'm1', status: 'success', measuredAt: '2026-09-11T10:00:00.000Z', metrics: { revenue: { before: 100, after: 120, delta: 20 } }, evidence: ['outcome:revenue'], confidence: 0.9, predictionErrors: [{ kpi: 'revenue', predictedDelta: 30, actualDelta: 20, absoluteError: 10, signedError: -10, directionCorrect: true, confidence: 0.8 }] };
  const memory = memoryFromOutcome('b1', outcome);
  assert.equal(memory.length, 2);
  assert.equal(memory.some((entry) => entry.kind === 'prediction_error' && isMemoryReusable(entry)), true);
});

test('business memory does not mark insufficient data as reusable', () => {
  const outcome: GrowthOutcome = { missionId: 'm2', status: 'insufficient_data', measuredAt: '2026-09-11T10:00:00.000Z', metrics: { revenue: { before: 100 } }, evidence: ['partial'], confidence: 0.9 };
  assert.equal(memoryFromOutcome('b1', outcome).every((entry) => !isMemoryReusable(entry)), true);
});

test('business memory aggregates prediction error and directional accuracy', () => {
  const outcome: GrowthOutcome = { missionId: 'm3', status: 'success', measuredAt: '2026-09-11T10:00:00.000Z', metrics: {}, evidence: ['e'], confidence: 0.9, predictionErrors: [{ kpi: 'revenue', predictedDelta: 10, actualDelta: 8, absoluteError: 2, signedError: -2, directionCorrect: true, confidence: 0.9 }, { kpi: 'revenue', predictedDelta: 5, actualDelta: -1, absoluteError: 6, signedError: -6, directionCorrect: false, confidence: 0.9 }] };
  const aggregate = aggregatePredictionError(memoryFromOutcome('b1', outcome), 'revenue');
  assert.equal(aggregate?.sampleSize, 2);
  assert.equal(aggregate?.meanAbsoluteError, 4);
  assert.equal(aggregate?.directionAccuracy, 0.5);
});
