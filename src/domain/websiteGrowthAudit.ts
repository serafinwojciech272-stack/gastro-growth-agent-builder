export type WebsiteAuditDimension = "performance" | "mobile" | "accessibility" | "seo" | "conversion" | "trust" | "content";
export type WebsiteAuditFinding = { dimension: WebsiteAuditDimension; severity: "critical" | "high" | "medium" | "low"; title: string; evidence: string; recommendation: string; impactScore: number; effortScore: number };
export type WebsiteGrowthAudit = { url: string; score: number; findings: WebsiteAuditFinding[]; quickWins: WebsiteAuditFinding[]; conversionLeaks: WebsiteAuditFinding[]; futureBuildBrief: { positioning: string; primaryCta: string; sections: string[]; proof: string[]; mobilePriorities: string[] } };

export function scoreWebsiteAudit(findings: WebsiteAuditFinding[]): number {
  if (!findings.length) return 100;
  const penalty = findings.reduce((sum, finding) => sum + ({ critical: 18, high: 10, medium: 5, low: 2 }[finding.severity]), 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function buildWebsiteGrowthAudit(url: string, findings: WebsiteAuditFinding[]): WebsiteGrowthAudit {
  const ordered = [...findings].sort((a, b) => b.impactScore - a.impactScore || a.effortScore - b.effortScore);
  return {
    url, score: scoreWebsiteAudit(findings), findings: ordered,
    quickWins: ordered.filter((f) => f.effortScore <= 3).slice(0, 5),
    conversionLeaks: ordered.filter((f) => f.dimension === "conversion" || f.dimension === "trust").slice(0, 5),
    futureBuildBrief: {
      positioning: "Clarify the business value within the first viewport.",
      primaryCta: "Request a quote or booking with one dominant action.",
      sections: ["Hero", "Proof", "Offer", "How it works", "FAQ", "CTA"],
      proof: ["reviews", "results", "portfolio", "location"],
      mobilePriorities: ["first-screen clarity", "thumb-friendly CTA", "fast media", "short forms"],
    },
  };
}
