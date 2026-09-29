export type CoreEngineContext = {
  ok: boolean;
  source: string;
  version?: string;
  capabilities?: string[];
  capabilityPacks?: Array<{id:string;name:string;category:string;version:string;capabilities:string[];actions:Array<{id:string;name:string;risk:string;requiresApproval:boolean}>}>;
  readiness?: unknown;
  fetchedAt: string;
};

export async function getCoreEngineContext(): Promise<CoreEngineContext> {
  const base = (Deno.env.get('CORE_ENGINE_URL') || 'https://core-engine-34uu.onrender.com').replace(/\/$/, '');
  const fallback: CoreEngineContext = { ok:false, source:base, fetchedAt:new Date().toISOString() };
  try {
    const response = await fetch(`${base}/api/engine`, { headers:{ Accept:'application/json' }, signal:AbortSignal.timeout(5000) });
    if (!response.ok) return { ...fallback, source:`${base}:http_${response.status}` };
    const data = await response.json() as Record<string,unknown>;
    return { ok:true, source:base, version:typeof data.version==='string'?data.version:undefined, capabilities:Array.isArray(data.capabilities)?data.capabilities.filter((x):x is string=>typeof x==='string'):[], capabilityPacks:Array.isArray(data.capabilityPacks)?data.capabilityPacks as CoreEngineContext['capabilityPacks']:[], readiness:data.readiness, fetchedAt:new Date().toISOString() };
  } catch { return { ...fallback, source:`${base}:unavailable` }; }
}
