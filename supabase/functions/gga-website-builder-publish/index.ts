
function cors(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : 'https://gastrogrowthadvisor.com', ...CORS_HEADERS };
}
function out(body: unknown, status = 200, h: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json' } });
}
function esc(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
function text(value: unknown, fallback = '') { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function firstText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) { for (const x of value) { const t = firstText(x); if (t) return t; } return ''; }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const k of ['title', 'headline', 'name', 'text', 'description', 'label', 'question', 'answer', 'value', 'content']) { const t = firstText(o[k]); if (t) return t; }
  }
  return '';
}