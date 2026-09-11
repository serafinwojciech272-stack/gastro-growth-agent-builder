export type ModelQuality = 'standard' | 'strong' | 'frontier';
export type ModelCost = 'free' | 'low' | 'medium' | 'high';
export type ModelCapability = 'reasoning' | 'structured_output' | 'fast' | 'vision';

export type RegisteredModel = {
  id: string;
  provider: string;
  quality: ModelQuality;
  cost: ModelCost;
  capabilities: ModelCapability[];
  enabled: boolean;
};

export const MODEL_REGISTRY: readonly RegisteredModel[] = [
  { id: 'deepseek/deepseek-v4-flash:free', provider: 'openrouter', quality: 'strong', cost: 'free', capabilities: ['reasoning', 'structured_output', 'fast'], enabled: true },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', provider: 'openrouter', quality: 'strong', cost: 'free', capabilities: ['reasoning', 'structured_output'], enabled: true },
];

export function getRegisteredModel(id: string): RegisteredModel | undefined {
  return MODEL_REGISTRY.find((model) => model.id === id);
}

export function enabledModels(): RegisteredModel[] {
  return MODEL_REGISTRY.filter((model) => model.enabled);
}
