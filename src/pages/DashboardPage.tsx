import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Bot, CheckCircle2, ChevronRight, CircleAlert, LogOut, Menu, MessageSquareText, PanelLeft, Settings, Sparkles, Utensils, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requireSupabase } from '../lib/supabase';

const nav = [
  { label: 'Overview', icon: PanelLeft },
  { label: 'AI Advisor', icon: Bot },
  { label: 'Menu Intelligence', icon: Utensils },
  { label: 'Reviews', icon: MessageSquareText },
  { label: 'Marketing', icon: Sparkles },
  { label: 'Analytics', icon: BarChart3 },
];

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('Your Restaurant');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!user) return;

    let cancelled = false;
    async function loadWorkspace() {
      try {
        const supabase = requireSupabase();
        const { data: memberships, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);
        if (membershipError) throw membershipError;
        const organizationId = memberships?.[0]?.organization_id;
        if (!organizationId) {
          if (!cancelled) navigate('/app/onboarding', { replace: true });
          return;
        }
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id,name,onboarding_completed')
          .eq('organization_id', organizationId)
          .limit(1)
          .maybeSingle();
        if (restaurantError) throw restaurantError;
        if (!restaurant) {
          if (!cancelled) navigate('/app/onboarding', { replace: true });
          return;
        }
        if (!restaurant.onboarding_completed) {
          if (!cancelled) navigate('/app/onboarding', { replace: true });
          return;
        }
        if (!cancelled) setRestaurantName(restaurant.name);
      } catch (error) {
        console.error('Workspace loading failed', error);
      } finally {
        if (!cancelled) setWorkspaceLoading(false);
      }
    }
    void loadWorkspace();
    return () => { cancelled = true; };
  }, [loading, user, navigate]);

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  if (loading || !user || workspaceLoading) {
    return <div className="min-h-screen bg-[#080809] text-[#f5f5f5] grid place-items-center text-sm text-[#a1a1aa]">Loading workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-[#080809] text-[#f5f5f5]">
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-72 border-r border-[#27272a] bg-[#0d0d0f] transition-transform lg:translate-x-0`}>
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="text-sm font-semibold tracking-tight">Gastro Growth Advisor</Link>
            <button className="lg:hidden text-[#a1a1aa]" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
          <div className="rounded-xl border border-[#27272a] bg-[#111113] p-4 mb-6">
            <p className="text-[11px] uppercase tracking-widest text-[#71717a]">Workspace</p>
            <p className="mt-1 font-medium truncate">{restaurantName}</p>
            <p className="mt-1 truncate text-xs text-[#71717a]">{user.email}</p>
          </div>
          <nav className="space-y-1">
            {nav.map(({ label, icon: Icon }, index) => (
              <button key={label} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${index === 0 ? 'bg-[#1a1a1e] text-white' : 'text-[#a1a1aa] hover:bg-[#151517] hover:text-white'}`}>
                <Icon size={17} /> {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-1">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#a1a1aa] hover:bg-[#151517] hover:text-white"><Users size={17} /> Team</button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#a1a1aa] hover:bg-[#151517] hover:text-white"><Settings size={17} /> Settings</button>
            <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#a1a1aa] hover:bg-[#151517] hover:text-white"><LogOut size={17} /> Sign out</button>
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-40 bg-black/60 lg:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#27272a] bg-[#080809]/90 px-5 backdrop-blur-xl lg:px-8">
          <button className="lg:hidden text-[#a1a1aa]" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div className="hidden lg:block"><p className="text-xs text-[#71717a]">Restaurant workspace</p><p className="text-sm font-medium">Overview</p></div>
          <div className="ml-auto text-xs text-[#71717a]">Signed in as {user.email}</div>
        </header>

        <div className="mx-auto max-w-7xl p-5 lg:p-8">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.18em] text-[#a78bfa]">GGA Intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">Good to see you.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1a1aa]">Your restaurant workspace is ready. Connect your business data and let GGA turn problems into prioritized actions.</p>
          </div>

          <section className="mb-6 rounded-2xl border border-[#27272a] bg-[#111113] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-[#a1a1aa]"><Sparkles size={16} className="text-[#a78bfa]" /> AI Advisor</div>
                <h2 className="mt-3 text-xl font-semibold">What is the biggest problem in your restaurant right now?</h2>
                <p className="mt-2 text-sm text-[#71717a]">Start with a real business problem. The intelligence layer will use your restaurant context once data is connected.</p>
              </div>
              <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#f5f5f5] px-5 py-3 text-sm font-semibold text-[#09090b] hover:bg-white">Ask GGA <ChevronRight size={16} /></button>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Health Score', 'Not calculated', CircleAlert],
              ['Open Issues', '0', CircleAlert],
              ['Opportunities', '0', Sparkles],
              ['Actions', '0', CheckCircle2],
            ].map(([label, value, Icon]) => {
              const I = Icon as typeof CircleAlert;
              return <div key={label as string} className="rounded-xl border border-[#27272a] bg-[#111113] p-5"><I size={17} className="text-[#71717a]" /><p className="mt-4 text-xs text-[#71717a]">{label as string}</p><p className="mt-1 text-lg font-semibold">{value as string}</p></div>;
            })}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#27272a] bg-[#111113] p-6"><h2 className="font-semibold">Next steps</h2><div className="mt-4 space-y-3"><Action title="Complete restaurant profile" /><Action title="Add your menu" /><Action title="Connect review sources" /><Action title="Run initial GGA analysis" /></div></section>
            <section className="rounded-2xl border border-[#27272a] bg-[#111113] p-6"><h2 className="font-semibold">Recent intelligence</h2><div className="mt-8 text-center text-sm text-[#71717a]">No analyses yet. Your first analysis will appear here.</div></section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Action({ title }: { title: string }) {
  return <button className="flex w-full items-center justify-between rounded-lg border border-[#27272a] bg-[#0d0d0f] px-4 py-3 text-left text-sm hover:border-[#3f3f46]"><span>{title}</span><ChevronRight size={16} className="text-[#71717a]" /></button>;
}
