import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, UtensilsCrossed } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessFromProfile, type BusinessProfileRecord } from '../domain/businessProfileAdapter';
import { requireSupabase } from '../lib/supabase';

type FormState = {
  restaurantName: string;
  cuisine: string;
  city: string;
  country: string;
  website: string;
  seats: string;
  averageTicket: string;
  targetCustomer: string;
  goals: string[];
  problems: string[];
};

type AuditRunResult = {
  audit: { url?: string; performanceScore?: number; seoScore?: number; mobileScore?: number; accessibilityScore?: number; trustScore?: number; issues?: string[] };
  intelligence: { signals: unknown[]; evidence: unknown[]; diagnoses: unknown[]; opportunities: unknown[]; recommendations: unknown[]; priorities: unknown[]; readyForApproval?: boolean };
};

const GOALS = ['Increase occupancy', 'Increase revenue', 'Improve menu', 'Get more reviews', 'Grow social media', 'Improve local visibility'];
const PROBLEMS = ['Low occupancy', 'Weak menu sales', 'Too few reviews', 'Poor social media performance', 'Low local visibility', 'I do not know where to start'];

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [auditResult, setAuditResult] = useState<AuditRunResult | null>(null);
  const [form, setForm] = useState<FormState>({ restaurantName: '', cuisine: '', city: '', country: '', website: '', seats: '', averageTicket: '', targetCustomer: '', goals: [], problems: [] });

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggle(key: 'goals' | 'problems', value: string) {
    setForm((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  }

  function next() {
    setError('');
    if (step === 1 && !form.restaurantName.trim()) return setError('Enter your restaurant name.');
    if (step === 1 && !form.city.trim()) return setError('Enter the restaurant city.');
    setStep((current) => Math.min(3, current + 1));
  }

  async function runWebsiteIntelligence(organizationId: string, restaurantId: string): Promise<AuditRunResult | null> {
    if (!form.website.trim()) return null;
    const supabase = requireSupabase();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.access_token) throw new Error('Unable to obtain the authenticated session for Website Audit.');

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id, organization_id, workspace_id, name, legal_name, industry, business_model, website_url, locale, timezone, metadata, created_at, updated_at')
      .eq('organization_id', organizationId)
      .eq('website_url', form.website.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (profileError) throw profileError;

    let resolvedProfile = profile;
    if (!resolvedProfile) {
      const { data: createdProfile, error: createProfileError } = await supabase.from('business_profiles').insert({
        organization_id: organizationId,
        name: form.restaurantName.trim(),
        industry: 'restaurant',
        business_model: 'b2c',
        website_url: form.website.trim(),
        locale: form.country.trim() === 'Poland' ? 'pl-PL' : null,
        timezone: 'Europe/Warsaw',
        metadata: {
          locations: [form.city.trim()],
          customerSegments: form.targetCustomer.trim() ? [form.targetCustomer.trim()] : [],
          goals: form.goals.map((title, index) => ({ id: `${organizationId}:goal:${index}`, title, priority: 100 - index * 10, status: 'active' })),
          constraints: [],
          brand: { name: form.restaurantName.trim() },
        },
      }).select('id, organization_id, workspace_id, name, legal_name, industry, business_model, website_url, locale, timezone, metadata, created_at, updated_at').single();
      if (createProfileError) throw createProfileError;
      resolvedProfile = createdProfile;
    }

    const record = resolvedProfile as BusinessProfileRecord;
    const { error: restaurantLinkError } = await supabase.from('restaurants').update({ business_profile_id: record.id }).eq('id', restaurantId);
    if (restaurantLinkError) throw restaurantLinkError;

    const business = businessFromProfile(record, { workspaceId: record.workspace_id ?? organizationId });
    const response = await fetch('/api/business-intelligence/website-audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${sessionData.session.access_token}` },
      body: JSON.stringify({
        business: {
          business: { ...business, websiteUrl: form.website.trim() },
          entities: [],
          relationships: [],
          activeGoals: business.goals,
          activeConstraints: business.constraints,
          lastUpdatedAt: new Date().toISOString(),
        },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : `Website intelligence failed (${response.status}).`);
    return payload as AuditRunResult;
  }

  async function finish(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!form.goals.length) return setError('Select at least one business goal.');
    setBusy(true);
    setError('');
    setAuditResult(null);
    try {
      const supabase = requireSupabase();
      const { data: organization, error: organizationError } = await supabase.from('organizations').insert({ name: `${form.restaurantName.trim()} Workspace`, owner_id: user.id }).select('id').single();
      if (organizationError) throw organizationError;

      const { error: memberError } = await supabase.from('organization_members').insert({ organization_id: organization.id, user_id: user.id, role: 'owner' });
      if (memberError) throw memberError;

      const { data: restaurant, error: restaurantError } = await supabase.from('restaurants').insert({
        organization_id: organization.id,
        name: form.restaurantName.trim(),
        cuisine: form.cuisine.trim() || null,
        city: form.city.trim(),
        country: form.country.trim() || null,
        website: form.website.trim() || null,
        seats: form.seats ? Number(form.seats) : null,
        average_ticket: form.averageTicket ? Number(form.averageTicket) : null,
        target_customer: form.targetCustomer.trim() || null,
        business_goals: form.goals,
        current_problems: form.problems,
        onboarding_completed: true,
      }).select('id').single();
      if (restaurantError) throw restaurantError;

      const { error: progressError } = await supabase.from('onboarding_progress').upsert({ restaurant_id: restaurant.id, current_step: 9, completed_steps: [1,2,3,4,5,6,7,8,9], completed_at: new Date().toISOString() });
      if (progressError) throw progressError;

      const result = await runWebsiteIntelligence(organization.id, restaurant.id);
      if (result) {
        setAuditResult(result);
        setBusy(false);
        return;
      }
      navigate('/app/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to complete onboarding. Check your Supabase/API setup and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return <div className="min-h-screen bg-[#080809] text-[#f5f5f5] grid place-items-center text-sm text-[#a1a1aa]">Loading...</div>;

  return (
    <main className="min-h-screen bg-[#080809] text-[#f5f5f5] px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white"><UtensilsCrossed size={17} /> Gastro Growth Advisor</Link>
          <span className="text-xs text-[#71717a]">Step {step} of 3</span>
        </div>
        <div className="mb-8 flex gap-2">{[1,2,3].map((item) => <div key={item} className={`h-1 flex-1 rounded-full ${item <= step ? 'bg-[#a78bfa]' : 'bg-[#27272a]'}`} />)}</div>
        <section className="rounded-2xl border border-[#27272a] bg-[#111113] p-6 sm:p-8">
          <form onSubmit={finish}>
            {step === 1 && <>
              <p className="text-xs uppercase tracking-[0.18em] text-[#a78bfa]">Restaurant profile</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tell GGA about your restaurant.</h1>
              <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">This context becomes the foundation for every future AI recommendation.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="Restaurant name" value={form.restaurantName} onChange={(v) => update('restaurantName', v)} required placeholder="La Trattoria" />
                <Field label="Cuisine" value={form.cuisine} onChange={(v) => update('cuisine', v)} placeholder="Italian" />
                <Field label="City" value={form.city} onChange={(v) => update('city', v)} required placeholder="Gliwice" />
                <Field label="Country" value={form.country} onChange={(v) => update('country', v)} placeholder="Poland" />
                <Field label="Website" value={form.website} onChange={(v) => update('website', v)} placeholder="https://..." />
                <Field label="Seats" value={form.seats} onChange={(v) => update('seats', v)} type="number" placeholder="60" />
                <Field label="Average ticket" value={form.averageTicket} onChange={(v) => update('averageTicket', v)} type="number" placeholder="120" />
                <Field label="Target customer" value={form.targetCustomer} onChange={(v) => update('targetCustomer', v)} placeholder="Families, couples, local professionals" />
              </div>
            </>}
            {step === 2 && <>
              <p className="text-xs uppercase tracking-[0.18em] text-[#a78bfa]">Growth objectives</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">What do you want to improve?</h1>
              <p className="mt-2 text-sm text-[#a1a1aa]">Choose every goal relevant to your business.</p>
              <ChoiceGrid values={GOALS} selected={form.goals} onToggle={(v) => toggle('goals', v)} />
            </>}
            {step === 3 && <>
              <p className="text-xs uppercase tracking-[0.18em] text-[#a78bfa]">Current problems</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Where does the restaurant hurt today?</h1>
              <p className="mt-2 text-sm text-[#a1a1aa]">These signals will guide the first GGA diagnosis.</p>
              <ChoiceGrid values={PROBLEMS} selected={form.problems} onToggle={(v) => toggle('problems', v)} />
              {!auditResult && <div className="mt-6 rounded-xl border border-[#27272a] bg-[#0d0d0f] p-4 text-sm text-[#a1a1aa]">{form.website.trim() ? 'When you create the workspace, GGA will fetch the website server-side and run the first intelligence cycle automatically.' : 'Add a website URL in step 1 to run the first real Website Intelligence cycle automatically.'}</div>}
              {auditResult && <AuditResultCard result={auditResult} onContinue={() => navigate('/app/dashboard', { replace: true })} />}
            </>}
            {error && <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            {!auditResult && <div className="mt-8 flex items-center justify-between gap-3">
              <button type="button" disabled={step === 1 || busy} onClick={() => { setError(''); setStep((current) => current - 1); }} className="inline-flex items-center gap-2 rounded-lg border border-[#27272a] px-4 py-3 text-sm text-[#a1a1aa] hover:text-white disabled:opacity-40"><ArrowLeft size={16} /> Back</button>
              {step < 3 ? <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-5 py-3 text-sm font-semibold text-[#09090b]">Continue <ArrowRight size={16} /></button> : <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-5 py-3 text-sm font-semibold text-[#09090b] disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {busy ? 'Running website intelligence...' : 'Create restaurant workspace'}</button>}
            </div>}
          </form>
        </section>
      </div>
    </main>
  );
}

function AuditResultCard({ result, onContinue }: { result: AuditRunResult; onContinue: () => void }) {
  const scores = [
    ['Performance', result.audit.performanceScore],
    ['SEO', result.audit.seoScore],
    ['Mobile', result.audit.mobileScore],
    ['Accessibility', result.audit.accessibilityScore],
    ['Trust', result.audit.trustScore],
  ].filter((item): item is [string, number] => typeof item[1] === 'number');
  const intelligence = result.intelligence;
  return <div className="mt-6 rounded-xl border border-[#3f3f46] bg-[#0d0d0f] p-5">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-[#a78bfa]">Website Intelligence complete</p><h2 className="mt-1 text-lg font-semibold">First business diagnosis generated</h2></div><Check size={18} className="text-[#c4b5fd]" /></div>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{scores.map(([label, score]) => <div key={label} className="rounded-lg border border-[#27272a] bg-[#111113] p-3"><p className="text-[11px] text-[#71717a]">{label}</p><p className="mt-1 text-xl font-semibold">{Math.round(score)}</p></div>)}</div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-6">{[['Signals', intelligence.signals?.length ?? 0], ['Evidence', intelligence.evidence?.length ?? 0], ['Diagnoses', intelligence.diagnoses?.length ?? 0], ['Opportunities', intelligence.opportunities?.length ?? 0], ['Recommendations', intelligence.recommendations?.length ?? 0], ['Priorities', intelligence.priorities?.length ?? 0]].map(([label, count]) => <div key={label} className="text-center"><p className="text-lg font-semibold">{count}</p><p className="text-[11px] text-[#71717a]">{label}</p></div>)}</div>
    {(result.audit.issues?.length ?? 0) > 0 && <div className="mt-5"><p className="text-xs font-medium text-[#d4d4d8]">Detected issues</p><ul className="mt-2 space-y-1 text-xs text-[#a1a1aa]">{result.audit.issues!.slice(0, 6).map((issue) => <li key={issue}>• {issue}</li>)}</ul></div>}
    <button type="button" onClick={onContinue} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-5 py-3 text-sm font-semibold text-[#09090b]">Open dashboard <ArrowRight size={16} /></button>
  </div>;
}

function Field({ label, value, onChange, required, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium text-[#d4d4d8]">{label}</span><input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[#27272a] bg-[#09090b] px-3 py-3 text-sm outline-none focus:border-[#a78bfa]" /></label>;
}

function ChoiceGrid({ values, selected, onToggle }: { values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div className="mt-8 grid gap-3 sm:grid-cols-2">{values.map((value) => { const active = selected.includes(value); return <button type="button" key={value} onClick={() => onToggle(value)} className={`rounded-xl border p-4 text-left text-sm transition ${active ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-white' : 'border-[#27272a] bg-[#0d0d0f] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'}`}><span className="flex items-center justify-between gap-3">{value}{active && <Check size={16} className="text-[#c4b5fd]" />}</span></button>; })}</div>;
}
