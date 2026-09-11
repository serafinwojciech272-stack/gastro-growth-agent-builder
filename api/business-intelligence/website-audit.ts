import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import type { BusinessContext } from "../../src/domain/universalBusinessCore";
import { runUniversalGrowthIntelligenceCycle } from "../../src/domain/universalGrowthIntelligencePipeline";
import { websiteAuditToSignalProducer } from "../../src/domain/websiteAuditIntelligence";
import { collectWebsiteAudit } from "../../src/services/websiteAuditCollector";

type RequestWithBody = IncomingMessage & { body?: unknown };

type Body = {
  business?: BusinessContext;
  growthContext?: Parameters<typeof runUniversalGrowthIntelligenceCycle>[0]["growthContext"];
  actions?: Parameters<typeof runUniversalGrowthIntelligenceCycle>[0]["actions"];
  measurementKpis?: Parameters<typeof runUniversalGrowthIntelligenceCycle>[0]["measurementKpis"];
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req: RequestWithBody): Promise<Body> {
  if (req.body && typeof req.body === "object") return req.body as Body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (Buffer.concat(chunks).byteLength > 50_000) throw new Error("Request body is too large.");
  if (!chunks.length) return {};
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  return parsed && typeof parsed === "object" ? parsed as Body : {};
}

function supabaseServerClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function handler(req: RequestWithBody, res: ServerResponse): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    sendJson(res, 401, { error: "Authentication required." });
    return;
  }

  try {
    const token = authorization.slice("Bearer ".length).trim();
    const { data, error } = await supabaseServerClient().auth.getUser(token);
    if (error || !data.user) {
      sendJson(res, 401, { error: "Invalid authentication token." });
      return;
    }

    const body = await readBody(req);
    const business = body.business;
    const url = business?.business.websiteUrl;
    if (!business?.business.id || !url) {
      sendJson(res, 400, { error: "business.id and business.websiteUrl are required." });
      return;
    }

    const audit = await collectWebsiteAudit(url);
    const producerResult = websiteAuditToSignalProducer(business, audit);

    const cycle = runUniversalGrowthIntelligenceCycle({
      business,
      sources: { website: audit },
      growthContext: body.growthContext,
      actions: body.actions,
      measurementKpis: body.measurementKpis,
    });

    sendJson(res, 200, {
      audit,
      producer: producerResult,
      intelligence: cycle,
      approvalReady: cycle.readyForApproval,
    });
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "Website intelligence pipeline failed." });
  }
}
