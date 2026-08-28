import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Priority = 'low' | 'medium' | 'high' | 'critical';

type AdvisorResult = {
  diagnosis: string;
  root_causes: string[];
  recommendations: {
    title: string;
    rationale: string;
    priority: Priority;
    actions: string[];
  }[];
  priority: Priority;
};

const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash:free';
const DEFAULT_FALLBACK_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const primaryModel = Deno.env.get('GGA_AI_MODEL') || DEFAULT_MODEL;
    const fallbackModel = Deno.env.get('GGA_AI_FALLBACK_MODEL') || DEFAULT_FALLBACK_MODEL;

    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: 'Supabase environment is incomplete' }, 500);
    }
    if (!openRouterKey) {
      return json({ error: 'AI provider is not configured. Set OPENROUTER_API_KEY.' }, 503);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Invalid session' }, 401);

    const body = await req.json();
    const problem = typeof body?.problem === 'string' ? body.problem.trim() : '';
    if (problem.length < 8) {
      return json({ error: 'Describe the restaurant problem in at least 8 characters.' }, 400);
    }
    if (problem.length > 4000) {
      return json({ error: 'Problem description is too long.' }, 400);
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1);
    if (membershipError) throw membershipError;

    const organizationId = memberships?.[0]?.organization_id;
    if (!organizationId) return json({ error: 'No restaurant workspace found.' }, 404);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id,name,cuisine,city,country,website,price_segment,seats,average_ticket,target_customer,business_goals,current_problems,opening_hours')
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle();
    if (restaurantError) throw restaurantError;
    if (!restaurant) return json({ error: 'Complete restaurant onboarding first.' }, 404);

    const system = `You are GGA, Gastro Growth Advisor. You are a practical restaurant business strategist.

Analyze the user's problem using the restaurant context. Never invent facts. Separate known context from assumptions. Prioritize actions by business impact and effort.

Return JSON only. Do not use Markdown fences. Use exactly this shape:
{"diagnosis":string,"root_causes":string[],"recommendations":[{"title":string,"rationale":string,"priority":"low|medium|high|critical","actions":string[]}],"priority":"low|medium|high|critical"}

Rules:
- diagnosis: maximum 700 characters
- root_causes: 2-5 items
- recommendations: 2-4 items
- each recommendation: 2-4 concrete actions
- do not invent restaurant facts, metrics, competitors, prices, or customer behavior
- if information is missing, state the assumption or recommend collecting the missing data`;

    const context = JSON.stringify({ restaurant, user_problem: problem });
    const models = uniqueModels([primaryModel, fallbackModel]);

    let parsed: AdvisorResult | null = null;
    let lastProviderError = '';
    let usedModel = '';

    for (const model of models) {
      try {
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': supabaseUrl,
            'X-Title': 'Gastro Growth Advisor',
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: context },
            ],
          }),
        });

        const aiPayload = await aiResponse.json().catch(() => null);
        if (!aiResponse.ok) {
          const providerMessage = aiPayload?.error?.message;
          lastProviderError = typeof providerMessage === 'string'
            ? providerMessage
            : `AI provider error (${aiResponse.status}).`;
          continue;
        }

        const raw = aiPayload?.choices?.[0]?.message?.content;
        if (typeof raw !== 'string' || !raw.trim()) {
          lastProviderError = 'AI returned an empty response.';
          continue;
        }

        const candidate = parseJsonObject(raw);
        if (!candidate) {
          lastProviderError = 'AI returned invalid structured data.';
          continue;
        }

        parsed = normalizeAdvisorResult(candidate);
        usedModel = model;
        break;
      } catch (error) {
        lastProviderError = error instanceof Error ? error.message : 'Unknown AI provider error.';
      }
    }

    if (!parsed) {
      console.error('GGA AI provider failure:', lastProviderError);
      return json({ error: 'AI analysis failed. Please try again.' }, 502);
    }

    const { data: saved, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        restaurant_id: restaurant.id,
        user_id: user.id,
        problem,
        diagnosis: parsed.diagnosis,
        root_causes: parsed.root_causes,
        recommendations: parsed.recommendations,
        priority: parsed.priority,
      })
      .select('id,created_at')
      .single();
    if (saveError) throw saveError;

    return json({
      analysis_id: saved.id,
      created_at: saved.created_at,
      restaurant: { id: restaurant.id, name: restaurant.name },
      model: usedModel,
      ...parsed,
    });
  } catch (error) {
    console.error(error);
    return json({
      error: error instanceof Error ? error.message : 'Unexpected advisor error.',
    }, 500);
  }
});

function uniqueModels(models: string[]) {
  return [...new Set(models.map((model) => model.trim()).filter(Boolean))];
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) return null;

    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }
}

function normalizeAdvisorResult(input: Record<string, unknown>): AdvisorResult {
  const priority = normalizePriority(input.priority);
  const rootCauses = Array.isArray(input.root_causes)
    ? input.root_causes.slice(0, 5).map(String)
    : [];

  const recommendations = Array.isArray(input.recommendations)
    ? input.recommendations.slice(0, 4).map((item) => {
        const recommendation = item && typeof item === 'object'
          ? item as Record<string, unknown>
          : {};

        return {
          title: String(recommendation.title || 'Recommendation'),
          rationale: String(recommendation.rationale || ''),
          priority: normalizePriority(recommendation.priority),
          actions: Array.isArray(recommendation.actions)
            ? recommendation.actions.slice(0, 4).map(String)
            : [],
        };
      })
    : [];

  return {
    diagnosis: String(input.diagnosis || 'No diagnosis was returned.'),
    root_causes: rootCauses,
    recommendations,
    priority,
  };
}

function normalizePriority(value: unknown): Priority {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical'
    ? value
    : 'medium';
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
