export type QualityResult = {
  score: number;
  checks: Record<string, boolean>;
};

export function evaluateStructuredOutput(value: unknown, rules: {
  required: string[];
  arrays?: string[];
  minItems?: Record<string, number>;
  maxItems?: Record<string, number>;
  maxStringLength?: Record<string, number>;
}): QualityResult {
  const record = isRecord(value) ? value : {};
  const checks: Record<string, boolean> = {};

  for (const key of rules.required) {
    const present = record[key] !== undefined && record[key] !== null && record[key] !== '';
    checks[`required:${key}`] = present;
  }

  for (const key of rules.arrays ?? []) {
    checks[`array:${key}`] = Array.isArray(record[key]);
  }

  for (const [key, minimum] of Object.entries(rules.minItems ?? {})) {
    checks[`minItems:${key}`] = Array.isArray(record[key]) && record[key].length >= minimum;
  }

  for (const [key, maximum] of Object.entries(rules.maxItems ?? {})) {
    checks[`maxItems:${key}`] = Array.isArray(record[key]) && record[key].length <= maximum;
  }

  for (const [key, maximum] of Object.entries(rules.maxStringLength ?? {})) {
    checks[`maxLength:${key}`] = typeof record[key] === 'string' && record[key].length <= maximum;
  }

  const entries = Object.values(checks);
  const passed = entries.filter(Boolean).length;
  const score = entries.length === 0 ? 0 : Math.round((passed / entries.length) * 100);

  return { score, checks };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
