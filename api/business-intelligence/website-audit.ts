import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import type { BusinessContext } from "../../src/domain/universalBusinessCore";
import { toBusinessEvidenceRow, toBusinessSignalRow } from "../../src/domain/businessKnowledgeGraphPersistence";
import { persistBusinessIntelligenceArtifacts } from "../../src/domain/businessIntelligencePersistence";
import { runWebsiteAuditPipeline } from "../../src/services/websiteAuditPipeline";

type RequestWithBody = IncomingMessage & { body?: unknown };

type Body = {
  business?: BusinessContext;
  growthContext?: Parameters<typeof runWebsiteAuditPipeline>[0]["growthContext"];
  actions?: Parameters<typeof runWebsiteAuditPipeline>[0]["actions"];
  measurementKpis?: Parameters<typeof runWebsiteAuditPipeline>[0]["measurementKpis"];
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
  const buffer = Buffer.concat(chunks);
  if (buffer.byteLength > 50_000) throw new Error("Request body is too large.");
  if (!buffer.length) return {};
  const parsed: unknown = JSON.parse(buffer.toString("utf8"));
  return parsed && typeof parsed === "object" ? parsed as Body : {};
}

function supabaseServerClient(token: string) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function persistRun(token: string, business: BusinessContext, result: Awaited<ReturnType<typeof runWebsiteAuditPipeline>>): Promise<void> {
  const client = supabaseServerClient(token);
  const signals = result.producer.signals.filter((signal) => signal.businessId === business.business.id);
  const evidence = result.producer.evidence.filter((item) => item.businessId === business.business.id);

  if (signals.length) {
    const { error } = await client.from("business_signals").upsert(signals.map(toBusinessSignalRow), { onConflict: "id" });
    if (error) throw new Error(`Signal persistence failed: ${error.message}`);
  }
  if (evidence.length) {
    const { error } = await client.from("business_evidence").upsert(evidence.map(toBusinessEvidenceRow), { onConflict: "id" });
    if (error) throw new Error(`Evidence persistence failed: ${error.message}`);
  }

  await persistBusinessIntelligenceArtifacts(client, {
    diagnoses: result.intelligence.diagnoses.filter((item) => item.businessId === business.business.id),
    opportunities: result.intelligence.opportunities.filter((item) => item.businessId === business.business.id),
    recommendations: result.intelligence.recommendations.filter((item) => item.businessId === business.business.id),
    priorities: result.intelligence.priorities.filter((item) => {
      const opportunity = result.intelligence.opportunities.find((candidate) => candidate.id === item.opportunityId);
      return opportunity?.businessId === business.business.id;
    }),
  });
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
    const client = supabaseServerClient(token);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      sendJson(res, 401, { error: "Invalid authentication token." });
      return;
    }

    const body = await readBody(req);
    if (!body.business?.business.id || !body.business.business.websiteUrl) {
      sendJson(res, 400, { error: "business.id and business.websiteUrl are required." });
      return;
    }

    const result = await runWebsiteAuditPipeline(body);
    await persistRun(token, body.business, result);
    sendJson(res, 200, {
      audit: result.audit,
      producer: result.producer,
      intelligence: result.intelligence,
      approvalReady: result.intelligence.readyForApproval,
      persisted: true,
    });
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "Website intelligence pipeline failed." });
  }
}
