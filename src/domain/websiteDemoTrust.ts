import type { WebsiteGrowthAudit } from "./websiteGrowthAudit";
export type DemoTrustGate = { eligible: boolean; blockers: string[]; score: number; confidence: number };
export function evaluateDemoTrust(audit: WebsiteGrowthAudit): DemoTrustGate {
  const blockers = audit.findings.filter((f) => f.severity === "critical").map((f) => `${f.dimension}: ${f.title}`);
  const confidence = Math.min(1, 0.35 + audit.findings.length * 0.08);
  return { eligible: blockers.length === 0 && audit.score >= 45, blockers, score: audit.score, confidence };
}
