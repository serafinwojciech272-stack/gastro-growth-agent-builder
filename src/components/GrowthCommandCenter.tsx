import React from "react";
import { ArrowUpRight, Bot, CheckCircle2, Clock3, Gauge, Sparkles, Target, Zap } from "lucide-react";

const stages = [
  ["Diagnosis", "Business signals analyzed", "done"],
  ["Opportunity", "3 growth opportunities found", "done"],
  ["Mission", "Weekday revenue expansion", "active"],
  ["Actions", "4 actions generated", "active"],
  ["Approval", "Customer decision required", "pending"],
] as const;

export default function GrowthCommandCenter() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 p-5 text-white shadow-2xl sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
            <Sparkles size={13} /> GGA INTELLIGENCE
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Growth Command Center</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your AI growth system monitors the business, prioritizes opportunities and prepares the next measurable action.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Agent online
        </div>
      </div>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Growth Health", "78", "/100", Gauge],
          ["Opportunities", "03", "detected", Target],
          ["Priority Impact", "HIGH", "confidence 91%", Zap],
          ["Next Action", "01", "approval needed", Clock3],
        ].map(([label, value, meta, Icon]) => (
          <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur">
            <div className="flex items-center justify-between text-slate-500"><span className="text-xs font-semibold uppercase tracking-wider">{label}</span><Icon size={17} /></div>
            <div className="mt-4 text-3xl font-black text-white">{value}<span className="ml-1 text-sm font-medium text-slate-500">{meta}</span></div>
          </div>
        ))}
      </div>

      <div className="relative mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-widest text-purple-300">AI Mission</p><h3 className="mt-2 text-xl font-bold">Increase weekday bookings by 15%</h3><p className="mt-2 text-sm text-slate-400">Priority: high · Expected impact: revenue growth</p></div>
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-300"><Bot size={22} /></div>
          </div>
          <div className="mt-6 space-y-3">
            {["Generate weekday offer", "Create social campaign", "Prepare conversion copy", "Measure bookings vs baseline"].map((action, index) => (
              <div key={action} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs text-slate-400">{index + 1}</span><span className="flex-1 text-sm text-slate-200">{action}</span><CheckCircle2 size={17} className="text-emerald-400" />
              </div>
            ))}
          </div>
          <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5">Review mission <ArrowUpRight size={16} /></button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Agent timeline</p>
          <div className="mt-5 space-y-1">
            {stages.map(([title, description, status]) => (
              <div key={title} className="flex gap-3 py-3">
                <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${status === "done" ? "bg-emerald-400" : status === "active" ? "bg-purple-400 shadow-[0_0_14px_rgba(168,85,247,.7)]" : "bg-slate-700"}`} />
                <div><p className="text-sm font-semibold text-slate-200">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
