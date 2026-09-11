import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Activity, Bot, CreditCard, Globe2, LayoutDashboard, LogOut, Menu, PlugZap, Settings2, Sparkles, Target, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  ['Command Center', '/app/dashboard', LayoutDashboard],
  ['AI Advisor', '/app/advisor', Bot],
  ['Mission Control', '/app/missions', Target],
  ['Website Builder', '/app/website-builder', Globe2],
  ['Menu Intelligence', '/app/menu', Sparkles],
  ['Reviews', '/app/reviews', Activity],
  ['Marketing', '/app/marketing', Sparkles],
  ['Social Content', '/app/social', Sparkles],
  ['Actions', '/app/actions', Target],
  ['Reports', '/app/reports', Activity],
  ['Billing', '/app/billing', CreditCard],
  ['Integrations', '/app/integrations', PlugZap],
];

export default function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const logout = async () => { await signOut(); navigate('/login'); };
  return <div className="min-h-screen bg-[#07080c] text-zinc-100">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-black/30 p-4 lg:block">
      <Link to="/app/dashboard" className="flex items-center gap-3 px-2 py-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-orange-400 font-black text-white shadow-lg">G</span><span className="font-semibold tracking-tight">GA</span><span className="text-xs text-zinc-600">Growth OS</span></Link>
      <nav className="mt-6 space-y-1">{nav.map(([label, path, Icon]) => <NavLink key={String(path)} to={String(path)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}`}><Icon size={16} className="shrink-0 opacity-80"/><span>{String(label)}</span></NavLink>)}</nav>
      <div className="absolute bottom-4 left-4 right-4 border-t border-white/10 pt-4"><div className="flex items-center gap-2 px-2 text-xs text-zinc-500"><UserRound size={13}/><span className="truncate">{user?.email}</span></div><button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:bg-white/5"><LogOut size={14}/>Sign out</button></div>
    </aside>
    <main className="min-h-screen lg:pl-64">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07080c]/85 px-4 py-3 backdrop-blur-xl md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/70"><Settings2 size={12}/> GA Growth Operating System</div>{title && <h1 className="mt-1 truncate text-xl font-semibold">{title}</h1>}</div><div className="flex items-center gap-2"><Link to="/app/missions" className="hidden rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/5 sm:inline-flex">Mission Control</Link><Link to="/app/website-builder" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01]">Build website</Link><Menu className="text-zinc-600 lg:hidden" size={20}/></div></div></header>
      <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
    </main>
  </div>;
}
