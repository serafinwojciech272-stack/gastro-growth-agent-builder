export type AiTask = 'advisor' | 'menu' | 'reviews' | 'recommendations' | 'general';

export type AiCallResult = {
  model: string;
  content: string;
  latencyMs: number;
  attempts: number;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
};

const DEFAULTS: Record<AiTask, string> = {
  advisor: 'deepseek/deepseek-v4-flash:free',
  menu: 'deepseek/deepseek-v4-flash:free',
  reviews: 'deepseek/deepseek-v4-flash:free',
  recommendations: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  general: 'deepseek/deepseek-v4-flash:free',
};

const FALLBACK = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 2;

export function modelsFor(task: AiTask): string[] {
  const primary = Deno.env.get(`GGA_AI_${task.toUpperCase()}_MODEL`) || Deno.env.get('GGA_AI_MODEL') || DEFAULTS[task];
  const fallback = Deno.env.get(`GGA_AI_${task.toUpperCase()}_FALLBACK_MODEL`) || Deno.env.get('GGA_AI_FALLBACK_MODEL') || FALLBACK;
  return [...new Set([primary, fallback].map((value) => value.trim()).filter(Boolean))].slice(0, MAX_ATTEMPTS);
}

export async function callOpenRouter(params: {
  task: AiTask;
  system: string;
  user: string;
  temperature?: number;
  selectedModel?: string;
}): Promise<AiCallResult> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  let lastError = 'AI provider failed';
  const started = Date.now();
  const models = params.selectedModel
    ? [params.selectedModel, ...modelsFor(params.task).filter((model) => model !== params.selectedModel)]
    : modelsFor(params.task);

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': Deno.env.get('GGA_PUBLIC_URL') || 'https://gastrogrowthadvisor.com',
          'X-Title': 'Gastro Growth Advisor',
        },
        body: JSON.stringify({
          model,
          temperature: params.temperature ?? 0.2,
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ],
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        lastError = typeof payload?.error?.message === 'string'
          ? payload.error.message
          : `AI provider error (${response.status})`;
        continue;
      }

      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        lastError = 'AI returned an empty response';
        continue;
      }

      const usage = payload?.usage && typeof payload.usage === 'object'
        ? {
            promptTokens: numberOrUndefined(payload.usage.prompt_tokens),
            completionTokens: numberOrUndefined(payload.usage.completion_tokens),
            totalTokens: numberOrUndefined(payload.usage.total_tokens),
          }
        : undefined;

      return { model, content: content.trim(), latencyMs: Date.now() - started, attempts: index + 1, usage };
    } catch (error) {
      lastError = error instanceof Error && error.name === 'AbortError'
        ? `AI request timed out after ${TIMEOUT_MS}ms`
        : error instanceof Error ? error.message : 'Unknown AI provider error';
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(lastError);
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function parseJson<T = Record<string, unknown>>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('AI returned invalid structured data');
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      throw new Error('AI returned invalid structured data');
    }
  }
}
