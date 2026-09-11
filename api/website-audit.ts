import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { collectWebsiteAudit } from "../src/services/websiteAuditCollector";

type AuditRequestBody = { url?: unknown };

type RequestWithBody = IncomingMessage & { body?: AuditRequestBody };

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<AuditRequestBody> {
  if (req.body && typeof req.body === "object") return req.body as AuditRequestBody;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (raw.length > 10_000) throw new Error("Request body is too large.");
  const parsed: unknown = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed as AuditRequestBody : {};
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
    if (!token) throw new Error("Authentication required.");
    const { data, error } = await supabaseServerClient().auth.getUser(token);
    if (error || !data.user) {
      sendJson(res, 401, { error: "Invalid authentication token." });
      return;
    }

    const body = await readBody(req);
    if (typeof body.url !== "string" || body.url.trim().length === 0) {
      sendJson(res, 400, { error: "A website URL is required." });
      return;
    }

    const audit = await collectWebsiteAudit(body.url.trim());
    sendJson(res, 200, { audit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Website audit failed.";
    const status = /authentication|invalid authentication/i.test(message) ? 401 : 400;
    sendJson(res, status, { error: message });
  }
}
