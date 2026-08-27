import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, UtensilsCrossed } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

const GOALS = ['Increase occupancy', 'Increase revenue', 'Improve menu', 'Get more reviews', 'Grow social media', 'Improve local visibility'];
const PROBLEMS = ['Low occupancy', 'Weak menu sales', 'Too few reviews', 'Poor social media performance', 'Low local visibility', 'I do not know where to start'];

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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

  async function finish(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!form.goals.length) return setError('Select at least one business goal.');
    setBusy(true);
    setError('');
    try {
      const supabase = requireSupabase();
      const { data: existing } = await supabase.from('restaurants').select('id').eq('organization_id', '00000000-0000-0000-0000-000000000000').limit(1);
      void existing;
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
      navigate('/app/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your restaurant. Check your Supabase setup and try again.');
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
              <div className="mt-6 rounded-xl border border-[#27272a] bg-[#0d0d0f] p-4 text-sm text-[#a1a1aa]">After setup, GGA will use this profile to generate the first restaurant intelligence workflow.</div>
            </>}

            {error && <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button type="button" disabled={step === 1 || busy} onClick={() => { setError(''); setStep((current) => current - 1); }} className="inline-flex items-center gap-2 rounded-lg border border-[#27272a] px-4 py-3 text-sm text-[#a1a1aa] hover:text-white disabled:opacity-40"><ArrowLeft size={16} /> Back</button>
              {step < 3 ? <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-5 py-3 text-sm font-semibold text-[#09090b]">Continue <ArrowRight size={16} /></button> : <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#f5f5f5] px-5 py-3 text-sm font-semibold text-[#09090b] disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {busy ? 'Creating workspace...' : 'Create restaurant workspace'}</button>}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, required, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium text-[#d4d4d8]">{label}</span><input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-[#27272a] bg-[#09090b] px-3 py-3 text-sm outline-none focus:border-[#a78bfa]" /></label>;
}

function ChoiceGrid({ values, selected, onToggle }: { values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div className="mt-8 grid gap-3 sm:grid-cols-2">{values.map((value) => { const active = selected.includes(value); return <button type="button" key={value} onClick={() => onToggle(value)} className={`rounded-xl border p-4 text-left text-sm transition ${active ? 'border-[#a78bfa] bg-[#a78bfa]/10 text-white' : 'border-[#27272a] bg-[#0d0d0f] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'}`}><span className="flex items-center justify-between gap-3">{value}{active && <Check size={16} className="text-[#c4b5fd]" />}</span></button>; })}</div>;
}
