export type GuardrailDecision = { allowed: boolean; reasons: string[] };

export function evaluateAgentGuardrails(input: { risk: "low" | "medium" | "high"; approved: boolean; confidence: number; irreversible?: boolean }): GuardrailDecision {
  const reasons: string[] = [];
  if (!input.approved) reasons.push("Customer approval required");
  if (input.risk === "high") reasons.push("High-risk action requires human review");
  if (input.confidence < 0.65) reasons.push("Confidence below autonomous threshold");
  if (input.irreversible) reasons.push("Irreversible operation requires human review");
  return { allowed: reasons.length === 0, reasons };
}
