export type ModelTask = "diagnosis" | "strategy" | "planning" | "critique" | "content" | "analysis" | "fast_classification";

export type ModelRoute = {
  provider: string;
  model: string;
  temperature: number;
  reason: string;
  fallbackModel?: string;
  costTier: "low" | "standard" | "premium";
  latencyTier: "fast" | "standard" | "deep";
  maxTokens?: number;
};

const ROUTES: Record<ModelTask, ModelRoute> = {
  diagnosis: { provider: "openrouter", model: "openai/gpt-5-mini", fallbackModel: "openai/gpt-5-mini", temperature: 0.2, reason: "Reliable structured reasoning", costTier: "standard", latencyTier: "standard", maxTokens: 1800 },
  strategy: { provider: "openrouter", model: "openai/gpt-5.6", fallbackModel: "openai/gpt-5-mini", temperature: 0.3, reason: "High quality strategic reasoning", costTier: "premium", latencyTier: "deep", maxTokens: 2400 },
  planning: { provider: "openrouter", model: "openai/gpt-5-mini", fallbackModel: "openai/gpt-5-mini", temperature: 0.2, reason: "Consistent structured planning", costTier: "standard", latencyTier: "standard", maxTokens: 2200 },
  critique: { provider: "openrouter", model: "openai/gpt-5-mini", fallbackModel: "openai/gpt-5-mini", temperature: 0.1, reason: "Deterministic quality review", costTier: "standard", latencyTier: "standard", maxTokens: 1800 },
  content: { provider: "openrouter", model: "openai/gpt-5-mini", fallbackModel: "openai/gpt-5-mini", temperature: 0.7, reason: "Creative generation with controlled cost", costTier: "standard", latencyTier: "standard", maxTokens: 2400 },
  analysis: { provider: "openrouter", model: "openai/gpt-5-mini", fallbackModel: "openai/gpt-5-mini", temperature: 0.1, reason: "Analytical consistency", costTier: "standard", latencyTier: "standard", maxTokens: 1800 },
  fast_classification: { provider: "openrouter", model: "openai/gpt-5-mini", fallbackModel: "openai/gpt-5-mini", temperature: 0, reason: "Low latency classification", costTier: "low", latencyTier: "fast", maxTokens: 700 },
};

export function routeModel(task: ModelTask, override?: Partial<ModelRoute>): ModelRoute {
  const route = ROUTES[task];
  if (!route) throw new Error(`Unsupported model task: ${task}`);
  return { ...route, ...override };
}

export function isPremiumTask(task: ModelTask): boolean {
  return ROUTES[task].costTier === "premium";
}
