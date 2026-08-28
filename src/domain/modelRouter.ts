export type ModelTask = "diagnosis" | "strategy" | "planning" | "critique" | "content" | "analysis" | "fast_classification";

export type ModelRoute = { provider: string; model: string; temperature: number; reason: string };

const ROUTES: Record<ModelTask, ModelRoute> = {
  diagnosis: { provider: "openrouter", model: "openai/gpt-5-mini", temperature: 0.2, reason: "Reliable structured reasoning" },
  strategy: { provider: "openrouter", model: "openai/gpt-5.6", temperature: 0.3, reason: "High quality strategic reasoning" },
  planning: { provider: "openrouter", model: "openai/gpt-5-mini", temperature: 0.2, reason: "Consistent structured planning" },
  critique: { provider: "openrouter", model: "openai/gpt-5-mini", temperature: 0.1, reason: "Deterministic quality review" },
  content: { provider: "openrouter", model: "openai/gpt-5-mini", temperature: 0.7, reason: "Creative generation with controlled cost" },
  analysis: { provider: "openrouter", model: "openai/gpt-5-mini", temperature: 0.1, reason: "Analytical consistency" },
  fast_classification: { provider: "openrouter", model: "openai/gpt-5-mini", temperature: 0, reason: "Low latency classification" },
};

export function routeModel(task: ModelTask, override?: Partial<ModelRoute>): ModelRoute {
  return { ...ROUTES[task], ...override };
}
