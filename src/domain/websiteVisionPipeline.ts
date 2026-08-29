import type { GrowthVertical } from "./verticalGrowthStrategy";
import { buildWebsiteDemoPlan, type WebsiteDemoPlan } from "./websiteDemoPlan";
import { evaluateDemoTrust, type DemoTrustGate } from "./websiteDemoTrust";
import type { WebsiteGrowthAudit } from "./websiteGrowthAudit";

export type WebsiteVisionPipeline = {
  stage: "blocked" | "demo_ready";
  audit: WebsiteGrowthAudit;
  trust: DemoTrustGate;
  demo: WebsiteDemoPlan;
  nextAction: "fix_critical_findings" | "render_sandbox_preview";
};

export function buildWebsiteVisionPipeline(url: string, vertical: GrowthVertical, audit: WebsiteGrowthAudit): WebsiteVisionPipeline {
  const trust = evaluateDemoTrust(audit);
  const demo = buildWebsiteDemoPlan(url, vertical, audit);
  return { stage: trust.eligible ? "demo_ready" : "blocked", audit, trust, demo, nextAction: trust.eligible ? "render_sandbox_preview" : "fix_critical_findings" };
}
