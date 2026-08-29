import type { WebsiteDemoPlan } from "./websiteDemoPlan";
import type { DemoTrustGate } from "./websiteDemoTrust";
export type SandboxPreviewSpec = { id: string; sourceUrl: string; status: "ready" | "blocked"; headline: string; sections: string[]; primaryCta: string; scoreBefore: number; targetScore: number; generatedAt: string; blockers: string[] };
export function createSandboxPreviewSpec(demo: WebsiteDemoPlan, trust: DemoTrustGate): SandboxPreviewSpec {
  return { id: `demo_${Date.now().toString(36)}`, sourceUrl: demo.url, status: trust.eligible ? "ready" : "blocked", headline: demo.headline, sections: demo.sections, primaryCta: demo.primaryCta, scoreBefore: demo.scoreBefore, targetScore: demo.targetScore, generatedAt: new Date().toISOString(), blockers: trust.blockers };
}
