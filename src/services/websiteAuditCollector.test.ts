import assert from "node:assert/strict";
import test from "node:test";
import { collectWebsiteAudit } from "./websiteAuditCollector.ts";

const html = `<!doctype html><html lang="pl"><head><title>Restauracja Testowa</title><meta name="description" content="Opis"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="https://example.com/"><meta name="robots" content="index,follow"></head><body><main><h1>Menu</h1><p>Kontakt: test@example.com</p><img src="dish.jpg" alt="Danie"></main></body></html>`;

test("collects a real HTTP-shaped website audit from an injected fetch", async () => {
  const result = await collectWebsiteAudit("https://example.com", {
    fetchImpl: async () => new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.finalUrl, "https://example.com/");
  assert.equal(result.facts.hasViewport, true);
  assert.equal(result.facts.h1Count, 1);
  assert.ok((result.seoScore ?? 0) >= 80);
  assert.equal(result.issues?.length, 0);
});

test("follows safe redirects and audits the final target", async () => {
  let calls = 0;
  const result = await collectWebsiteAudit("https://example.com/start", {
    fetchImpl: async (url) => {
      calls += 1;
      if (String(url).endsWith("/start")) return new Response(null, { status: 301, headers: { location: "/final" } });
      return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
    },
  });
  assert.equal(calls, 2);
  assert.equal(result.finalUrl, "https://example.com/final");
});

test("blocks local targets before making a network request", async () => {
  let called = false;
  await assert.rejects(
    () => collectWebsiteAudit("http://127.0.0.1:8080", { fetchImpl: async () => { called = true; return new Response(); } }),
    /Private or local website targets are not allowed/,
  );
  assert.equal(called, false);
});
