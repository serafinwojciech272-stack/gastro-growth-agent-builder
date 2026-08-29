import type { GrowthVertical } from "./verticalGrowthStrategy";
import type { WebsiteGrowthAudit } from "./websiteGrowthAudit";
export type WebsiteDemoPlan = { url: string; vertical: GrowthVertical; headline: string; primaryCta: string; sections: string[]; proofBlocks: string[]; mobilePriorities: string[]; scoreBefore: number; targetScore: number; changes: Array<{ title: string; reason: string; impact: number; effort: number }> };
export function buildWebsiteDemoPlan(url: string, vertical: GrowthVertical, audit: WebsiteGrowthAudit): WebsiteDemoPlan {
  const changes = audit.findings.slice(0, 8).map((finding) => ({ title: finding.title, reason: finding.recommendation, impact: finding.impactScore, effort: finding.effortScore }));
  const label = vertical === "home_services" ? "your local service business" : vertical.replace("_", " ");
  return { url, vertical, headline: `A higher-converting ${label} website, built from your current site`, primaryCta: audit.futureBuildBrief.primaryCta, sections: audit.futureBuildBrief.sections, proofBlocks: audit.futureBuildBrief.proof, mobilePriorities: audit.futureBuildBrief.mobilePriorities, scoreBefore: audit.score, targetScore: Math.min(98, Math.max(audit.score + 15, 85)), changes };
}
