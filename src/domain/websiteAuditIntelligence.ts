import type { BusinessContext } from "./universalBusinessCore";
import { collectBusinessSignals, type SignalProducerResult } from "./businessSignalProducers";
import { normalizeWebsiteAuditSnapshot } from "./websiteAuditAdapter";
import type { WebsiteAuditResult } from "../services/websiteAuditCollector";

/**
 * Server-side Website Audit -> canonical producer bridge.
 * The collector stays runtime-specific; this module keeps the intelligence
 * core independent from HTTP and Vercel request/response objects.
 */
export function websiteAuditToSignalProducer(
  business: BusinessContext,
  audit: WebsiteAuditResult,
): SignalProducerResult {
  const source = normalizeWebsiteAuditSnapshot(audit);
  if (!source) {
    return {
      producer: "website",
      signals: [],
      evidence: [],
      warnings: ["Website audit returned no usable intelligence data."],
    };
  }

  return collectBusinessSignals(
    { business, observedAt: audit.observedAt },
    { website: source },
  );
}
