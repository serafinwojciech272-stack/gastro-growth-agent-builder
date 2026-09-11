import type { WebsiteAuditSnapshot } from "../domain/websiteAuditAdapter";

export type WebsiteAuditCollectorOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
};

export type WebsiteAuditResult = WebsiteAuditSnapshot & {
  status: number;
  contentType?: string;
  responseTimeMs: number;
  finalUrl: string;
  observedAt: string;
  facts: Record<string, boolean | number | string | undefined>;
};

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_BYTES = 1_500_000;
const DEFAULT_MAX_REDIRECTS = 4;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Website URL must use http or https.");
  }
  if (url.username || url.password) throw new Error("Website URL must not contain credentials.");
  return url;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host === "localhost.localdomain" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "metadata.google.internal" || host === "metadata.google.com") return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const octets = ipv4.slice(1).map(Number);
  if (octets.some((part) => part > 255)) return true;
  const [a, b] = octets;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

function assertSafeTarget(url: URL): void {
  if (isBlockedHostname(url.hostname)) throw new Error("Private or local website targets are not allowed.");
}

function decodeHtml(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function extractFirst(html: string, expression: RegExp): string | undefined {
  const match = html.match(expression);
  return match?.[1]?.replace(/\s+/g, " ").trim() || undefined;
}

function hasMeta(html: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`<meta\\b[^>]*(?:name=[\\"']${escaped}[\\"'][^>]*content=[\\"'][^\\"']+[\\"']|content=[\\"'][^\\"']+[\\"'][^>]*name=[\\"']${escaped}[\\"'])`, "i").test(html);
}

function hasLinkRel(html: string, rel: string): boolean {
  return new RegExp(`<link\\b[^>]*rel=[\\"'][^\\"']*\\b${rel}\\b[^\\"']*[\\"']`, "i").test(html);
}

function countMatches(html: string, expression: RegExp): number {
  return html.match(expression)?.length ?? 0;
}

function scoreWebsite(input: {
  url: URL;
  status: number;
  responseTimeMs: number;
  html: string;
  contentType?: string;
}): WebsiteAuditSnapshot & { facts: Record<string, boolean | number | string | undefined> } {
  const { url, status, responseTimeMs, html, contentType } = input;
  const title = extractFirst(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const description = hasMeta(html, "description");
  const viewport = hasMeta(html, "viewport");
  const canonical = hasLinkRel(html, "canonical");
  const robots = hasMeta(html, "robots");
  const lang = /<html\b[^>]*\blang=["'][^"']+["']/i.test(html);
  const h1Count = countMatches(html, /<h1\b[^>]*>/gi);
  const images = countMatches(html, /<img\b[^>]*>/gi);
  const imagesWithAlt = countMatches(html, /<img\b[^>]*\balt=["'][^"']*["'][^>]*>/gi);
  const https = url.protocol === "https:";
  const forms = countMatches(html, /<form\b[^>]*>/gi);
  const phoneOrEmail = /(?:tel:|mailto:|\+?\d[\d ()-]{7,}\d|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i.test(html);
  const contentLike = /<(main|article|section|p|nav)\b/i.test(html);
  const textLength = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, " ").replace(/\s+/g, " ").trim().length;

  const performanceScore = clampScore((status >= 200 && status < 400 ? 45 : 0) + (responseTimeMs < 800 ? 35 : responseTimeMs < 1500 ? 25 : responseTimeMs < 3000 ? 15 : 5) + (contentType?.includes("text/html") ? 10 : 0) + (textLength > 500 ? 10 : 0));
  const seoScore = clampScore((title ? 25 : 0) + (description ? 20 : 0) + (canonical ? 15 : 0) + (robots ? 10 : 0) + (h1Count === 1 ? 20 : h1Count > 1 ? 10 : 0) + (contentLike ? 10 : 0));
  const mobileScore = clampScore((viewport ? 70 : 0) + (https ? 15 : 0) + (html.length > 1000 ? 15 : 0));
  const accessibilityScore = clampScore((lang ? 25 : 0) + (h1Count === 1 ? 20 : 0) + (images === 0 ? 30 : Math.round((imagesWithAlt / images) * 30)) + (contentLike ? 15 : 0) + (viewport ? 10 : 0));
  const trustScore = clampScore((https ? 35 : 0) + (status >= 200 && status < 400 ? 25 : 0) + (title ? 10 : 0) + (phoneOrEmail ? 15 : 0) + (forms > 0 ? 5 : 0) + (contentLike ? 10 : 0));

  const issues: string[] = [];
  if (status < 200 || status >= 400) issues.push(`HTTP status ${status}.`);
  if (!https) issues.push("Website is not served over HTTPS.");
  if (responseTimeMs >= 1500) issues.push(`Initial HTTP response took ${responseTimeMs} ms.`);
  if (!title) issues.push("Missing HTML title.");
  if (!description) issues.push("Missing meta description.");
  if (!viewport) issues.push("Missing responsive viewport meta tag.");
  if (h1Count === 0) issues.push("No H1 heading detected.");
  if (h1Count > 1) issues.push(`Multiple H1 headings detected (${h1Count}).`);
  if (images > imagesWithAlt) issues.push(`${images - imagesWithAlt} image(s) without a detected alt attribute.");
  if (!lang) issues.push("HTML language attribute is missing.");

  return {
    url: url.toString(),
    performanceScore,
    seoScore,
    mobileScore,
    accessibilityScore,
    trustScore,
    issues,
    facts: {
      status,
      responseTimeMs,
      https,
      title: title ?? "",
      hasMetaDescription: description,
      hasViewport: viewport,
      hasCanonical: canonical,
      hasRobotsMeta: robots,
      hasHtmlLang: lang,
      h1Count,
      imageCount: images,
      imagesWithAlt,
      contentLength: textLength,
    },
  };
}

export async function collectWebsiteAudit(urlInput: string, options: WebsiteAuditCollectorOptions = {}): Promise<WebsiteAuditResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  let url = normalizeUrl(urlInput);
  assertSafeTarget(url);

  const started = Date.now();
  let response: Response | undefined;
  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await fetchImpl(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "GGA-WebsiteAudit/1.0 (+business-intelligence)" },
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status < 300 || response.status >= 400) break;
    const location = response.headers.get("location");
    if (!location || redirect === maxRedirects) throw new Error("Website redirect chain could not be safely followed.");
    url = new URL(location, url);
    assertSafeTarget(url);
  }

  if (!response) throw new Error("Website audit did not receive a response.");
  const responseTimeMs = Date.now() - started;
  const contentType = response.headers.get("content-type") ?? undefined;
  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) throw new Error(`Website response exceeds ${maxBytes} bytes.`);
  const html = contentType?.includes("text/html") ? decodeHtml(buffer) : "";
  const scored = scoreWebsite({ url, status: response.status, responseTimeMs, html, contentType });

  return {
    ...scored,
    status: response.status,
    contentType,
    responseTimeMs,
    finalUrl: url.toString(),
    observedAt: new Date().toISOString(),
  };
}
