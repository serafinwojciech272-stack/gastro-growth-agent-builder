const DEFAULT_ORIGIN = 'https://gastrogrowthadvisor.com';
const LOCAL_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);

export function getCorsHeaders(req: Request): Record<string, string> {
  const configured = Deno.env.get('GGA_PUBLIC_URL')?.trim().replace(/\/$/, '') || DEFAULT_ORIGIN;
  const requestOrigin = req.headers.get('Origin') || '';
  const allowedOrigin = LOCAL_ORIGINS.has(requestOrigin) || requestOrigin === configured
    ? requestOrigin
    : configured;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}
