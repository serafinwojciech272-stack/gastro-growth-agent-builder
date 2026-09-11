import type { BusinessContext } from "../domain/universalBusinessCore";
import { runUniversalGrowthIntelligenceCycle, type UniversalGrowthIntelligenceCycle } from "../domain/universalGrowthIntelligencePipeline";
import { websiteAuditToSignalProducer } from "../domain/websiteAuditIntelligence";
import { collectWebsiteAudit, type WebsiteAuditCollectorOptions, type WebsiteAuditResult } from "./websiteAuditCollector";
import type { GrowthAction, GrowthDecisionContext, GrowthKpi } from "../domain/growthTypes";

export type WebsiteAuditPipelineInput = {
  business: BusinessContext;
  growthContext?: GrowthDecisionContext;
  actions?: readonly GrowthAction[];
  measurementKpis?: readonly GrowthKpi[];
  collectorOptions?: WebsiteAuditCollectorOptions;
};

export type WebsiteAuditPipelineResult = {
  audit: WebsiteAuditResult;
  producer: ReturnType<typeof websiteAuditToSignalProducer>;
  intelligence: UniversalGrowthIntelligenceCycle;
};

/**
 * Canonical runtime entry point for Website URL -> business intelligence.
 * Network access is kept here, outside the pure intelligence domain.
 */
export async function runWebsiteAuditPipeline(input: WebsiteAuditPipelineInput): Promise<WebsiteAuditPipelineResult> {
  const url = input.business.business.websiteUrl;
  if (!url) throw new Error("business.websiteUrl is required.");

  const audit = await collectWebsiteAudit(url, input.collectorOptions);
  const producer = websiteAuditToSignalProducer(input.business, audit);
  const intelligence = runUniversalGrowthIntelligenceCycle({
    business: input.business,
    sources: { website: audit },
    growthContext: input.growthContext,
    actions: input.actions,
    measurementKpis: input.measurementKpis,
  });

  return { audit, producer, intelligence };
}
