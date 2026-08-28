import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BrainCircuit, Check, ChevronRight, CircleDot, Gauge, Menu, Play, Sparkles, Target, TrendingUp, X, Zap } from "lucide-react";
import { saveLead } from "../services/leadService";

const workflow = [
  ["01", "Diagnose", "GGA reads your business signals and finds the highest-value opportunity."],
  ["02", "Plan", "The agent turns the opportunity into a measurable growth mission."],
  ["03", "Approve", "You control what crosses the execution boundary."],
  ["04", "Execute", "Approved actions run through guarded capabilities."],
  ["05", "Measure", "Outcomes are compared with the baseline."],
  ["06", "Learn", "The next recommendation uses what worked before."],
] as const;

const signals = [
  { label: "Tuesday occupancy", value: "18% below average", tone: "text-amber-300" },
  { label: "Review activity", value: "+24% this month", tone: "text-emerald-300" },
  { label: "Repeat customer rate", value: "64%", tone: "text-cyan-300" },
];

export default function PublicSite() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await saveLead({ email, name: "Public Site Lead" });
      setSubmitted(true);
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07080c] text-slate-300 selection:bg-violet-400/30 selection:text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(124,58,237,0.22),transparent_42%),radial-gradient(circle_at_90%_40%,rgba(6,182,212,0.08),transparent_28%)]" />

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07080c]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Gastro Growth Advisor home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-200 shadow-[0_0_28px_rgba(139,92,246,0.18)]">
              <Sparkles size={17} />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white sm:text-base">Gastro Growth Advisor</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#intelligence" className="text-sm text-slate-400 transition hover:text-white">Intelligence</a>
            <a href="#workflow" className="text-sm text-slate-400 transition hover:text-white">How it works</a>
            <a href="#demo" className="text-sm text-slate-400 transition hover:text-white">Live demo</a>
            <Link to="/login" className="text-sm text-slate-400 transition hover:text-white">Login</Link>
            <Link to="/signup" className="group flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
              Start free <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <button className="rounded-lg p-2 text-slate-300 md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation">
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </nav>
        {mobileOpen && (
          <div className="border-t border-white/[0.06] px-5 py-4 md:hidden">
            <div className="flex flex-col gap-4 text-sm">
              <a href="#intelligence" onClick={() => setMobileOpen(false)}>Intelligence</a>
              <a href="#workflow" onClick={() => setMobileOpen(false)}>How it works</a>
              <a href="#demo" onClick={() => setMobileOpen(false)}>Live demo</a>
              <Link to="/login">Login</Link>
              <Link to="/signup" className="rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">Start free</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative px-5 pb-20 pt-20 sm:pt-28 lg:px-8 lg:pb-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-xs font-medium text-slate-300">
              <CircleDot size={13} className="text-emerald-400" />
              AI Growth Operating System for restaurants
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }} className="max-w-4xl text-5xl font-semibold tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl lg:leading-[1.02]">
              Your business has growth signals.
              <span className="block bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent">GGA turns them into action.</span>
            </motion.h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              GGA analyzes your restaurant, finds the highest-value opportunity, builds a mission, prepares the actions, asks for approval and measures what happened.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#demo" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                See the AI at work <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="#lead" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.06]">
                Request early access
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Human approval controls</span>
              <span className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Outcome-driven learning</span>
              <span className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Multi-agent architecture</span>
            </div>
          </div>

          <motion.div id="demo" initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.97, y: reduceMotion ? 0 : 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
            <div className="absolute -inset-8 bg-violet-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0f15]/95 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"><BrainCircuit size={14} className="text-violet-300" /> GGA Intelligence</div>
                  <div className="mt-1 text-sm font-medium text-white">Restaurant growth command center</div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-medium text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ONLINE</span>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:col-span-2">
                  <div className="flex items-end justify-between gap-4">
                    <div><div className="text-xs text-slate-500">Growth health</div><div className="mt-1 text-3xl font-semibold tracking-tight text-white">82<span className="text-base text-slate-500">/100</span></div></div>
                    <TrendingUp size={21} className="mb-1 text-emerald-300" />
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: "82%" }} transition={{ duration: 1, delay: 0.6 }} className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" /></div>
                </div>
                {signals.map((signal) => <div key={signal.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="text-[11px] text-slate-500">{signal.label}</div><div className={`mt-2 text-sm font-semibold ${signal.tone}`}>{signal.value}</div></div>)}
              </div>
              <div className="border-t border-white/[0.07] p-5">
                <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recommended mission</span><span className="text-[10px] text-violet-300">87% confidence</span></div>
                <div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.04] p-4">
                  <div className="flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-200"><Target size={16} /></span><div><div className="text-sm font-semibold text-white">Increase Tuesday evening bookings</div><p className="mt-1 text-xs leading-5 text-slate-500">18% occupancy gap. Previous Tuesday campaigns produced stronger conversion.</p></div></div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3"><span className="text-[10px] text-amber-300">AWAITING APPROVAL</span><span className="flex items-center gap-1 text-xs font-medium text-white">Review mission <ChevronRight size={14} /></span></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="intelligence" className="border-y border-white/[0.06] bg-white/[0.015] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">From signals to decisions</div><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">The product does the thinking between your data and your next move.</h2><p className="mt-5 leading-7 text-slate-500">GGA combines business context, specialist agents, guarded execution and outcome feedback into one operating loop.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              [Gauge, "Diagnose the business", "Find revenue, retention, pricing, menu and marketing opportunities from the signals available to the system."],
              [Zap, "Turn insight into missions", "Prioritize opportunities by impact, confidence and risk. Convert the winner into concrete actions."],
              [TrendingUp, "Learn from outcomes", "Measure against the baseline and feed successful patterns back into future recommendations."],
            ].map(([Icon, title, desc]) => { const I = Icon as typeof Gauge; return <div key={title as string} className="group rounded-2xl border border-white/[0.07] bg-[#0b0d12] p-6 transition hover:border-violet-400/20"><div className="mb-6 grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-violet-200"><I size={18} /></div><h3 className="text-lg font-semibold text-white">{title as string}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{desc as string}</p></div>; })}
          </div>
        </div>
      </section>

      <section id="workflow" className="px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Autonomous growth loop</div><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">One continuous system.</h2></div><p className="max-w-md text-sm leading-6 text-slate-500">Automation handles repeatable work. Autonomy operates inside explicit policies and approval boundaries.</p></div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-3">
            {workflow.map(([num, title, desc]) => <div key={num} className="bg-[#0b0d12] p-6 sm:p-7"><div className="text-xs font-mono text-slate-600">{num}</div><h3 className="mt-5 text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p></div>)}
          </div>
        </div>
      </section>

      <section id="lead" className="px-5 pb-24 pt-8 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/[0.12] via-white/[0.025] to-cyan-500/[0.08] p-7 sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200"><Play size={13} /> Early access</div><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">See what GGA finds in your restaurant.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Join the early access list and get a first growth assessment when the product is ready for live businesses.</p></div>{submitted ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-6 py-5 text-sm text-emerald-200">Thanks. Your request has been received.</div> : <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:min-w-[360px] sm:flex-row"><label className="sr-only" htmlFor="gga-email">Email</label><input id="gga-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="restaurant@email.de" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50" /><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50">{loading ? "Sending..." : "Request access"}<ArrowRight size={15} /></button></form>}</div>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"><div>© {new Date().getFullYear()} Gastro Growth Advisor</div><div className="flex gap-5"><Link to="/login" className="transition hover:text-slate-300">Login</Link><Link to="/signup" className="transition hover:text-slate-300">Sign up</Link><a href="#" className="transition hover:text-slate-300">Impressum</a><a href="#" className="transition hover:text-slate-300">Datenschutz</a></div></div>
      </footer>
    </main>
  );
}
