export type AiBudget = {
  maxInputChars: number;
  maxOutputTokens: number;
  maxTemperature: number;
};

export const AI_BUDGETS: Record<string, AiBudget> = {
  advisor: { maxInputChars: 24000, maxOutputTokens: 2200, maxTemperature: 0.7 },
  menu: { maxInputChars: 30000, maxOutputTokens: 2600, maxTemperature: 0.4 },
  reviews: { maxInputChars: 30000, maxOutputTokens: 2400, maxTemperature: 0.5 },
  recommendations: { maxInputChars: 24000, maxOutputTokens: 2200, maxTemperature: 0.6 },
  general: { maxInputChars: 24000, maxOutputTokens: 2200, maxTemperature: 0.7 },
};

export function getAiBudget(task: string): AiBudget {
  return AI_BUDGETS[task] || AI_BUDGETS.general;
}

export function assertAiInput(task: string, system: string, user: string, temperature: number): void {
  const budget = getAiBudget(task);
  const inputChars = system.length + user.length;
  if (inputChars > budget.maxInputChars) throw new Error(`AI input exceeds ${budget.maxInputChars} character safety budget`);
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > budget.maxTemperature) {
    throw new Error(`AI temperature exceeds ${task} safety budget`);
  }
}
