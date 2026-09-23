import {
  buildBusinessIntelligence,
  type IntelligencePipelineInput,
  type IntelligencePipelineResult,
} from "../domain/businessIntelligencePipeline";

/**
 * Stable provider boundary between the reusable Core runtime and a vertical
 * application's reasoning implementation.
 *
 * Core consumes this contract; Growth Advisor is currently the default
 * provider. A future standalone package can supply another implementation
 * without changing Core engine orchestration.
 */
export type CoreReasoningProvider = (
  input: IntelligencePipelineInput,
) => IntelligencePipelineResult;

/**
 * Current Growth Advisor compatibility adapter.
 * Keeps the canonical Universal Business Intelligence pipeline authoritative
 * while removing its implementation detail from the Core engine facade.
 */
export const growthAdvisorReasoningProvider: CoreReasoningProvider = (input) =>
  buildBusinessIntelligence(input);
