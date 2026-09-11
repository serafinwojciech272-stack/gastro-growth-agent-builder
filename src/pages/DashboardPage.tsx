import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { requireSupabase } from "../lib/supabase";
import AppShell from "../components/AppShell";
import GrowthCommandCenter from "../components/GrowthCommandCenter";
import GrowthROI from "../components/GrowthROI";
import { calculateGrowthHealth } from "../domain/growthHealth";
import { AlertCircle, Activity, Loader2, Target, TrendingUp } from "lucide-react";

type Business = { id: string; name?: string | null; business_profile_id?: string | null };
type Mission = { id: string; title: string; goal: string; priority: number; status: string; approval_status: string; target_value: number | null; baseline_value: number | null; unit: string | null; created_at: string };
type Action = { id: string; mission_id: string; title: string; description: string | null; status: string; impact_score: number; effort_score: number; risk_level: string; due_at: string | null };
type Measurement = { id: string; mission_id: string; kpi: string; before_value: number | null; after_value: number | null; delta: number | null; confidence: number; measured_at: string };
type Learning = { id: string; kpi: string; recommendation: string; confidence: number; sample_size: number; created_at: string };
type MissionRun = { id: string; business_id: string; status: string; mission_json: Record<string, unknown> | null; decision_json: Record<string, unknown> | null; approved_at: string | null; created_at: string };
type Outcome = { id: string; mission_id: string; status: string; metrics_before: Record<string, unknown> | null; metrics_after: Record<string, unknown> | null; summary: string | null; learning: string | null; confidence: number | null; created_at: string };

type RawAction = { id: string; title: unknown; description: unknown; status: unknown; priority: unknown; due_at: unknown; payload: unknown };

function textValue(value: unknown, fallback: string): string { return typeof value === "string" && value.trim() ? value : fallback; }
function numberValue(value: unknown, fallback: number): number { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function missionIdFromPayload(value: unknown): string { return typeof value === "object" && value !== null && typeof (value as Record<string, unknown>).mission_id === "string" ? String((value as Record<string, unknown>).mission_id) : ""; }

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [learning, setLearning] = useState<Learning[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadData(userId: string) {
    setLoading(true); setError(null);
    try {
      const sb = requireSupabase();
      const { data: membership, error: membershipError } = await sb.from("organization_members").select("organization_id").eq("user_id", userId).limit(1).single();
      if (membershipError && membershipError.code !== "PGRST116") throw membershipError;
      if (!membership?.organization_id) { navigate("/app/onboarding"); return; }
      const { data: businessData, error: businessError } = await sb.from("restaurants").select("id,name,business_profile_id").eq("organization_id", membership.organization_id).limit(1).single();
      if (businessError && businessError.code !== "PGRST116") throw businessError;
      if (!businessData) { navigate("/app/onboarding"); return; }
      const b = businessData as Business; setBusiness(b);
      const businessId = b.business_profile_id;

      let runRows: MissionRun[] = [];
      if (businessId) {
        const { data, error: runError } = await sb.from("growth_mission_runs").select("id,business_id,status,mission_json,decision_json,approved_at,created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(8);
        if (runError) throw runError; runRows = (data ?? []) as MissionRun[];
      }
      const { data: actionRows, error: actionError } = await sb.from("actions").select("id,restaurant_id,recommendation_id,title,description,status,priority,due_at,created_at,payload").eq("restaurant_id", b.id).order("created_at", { ascending: false }).limit(50);
      if (actionError) throw actionError;
      const missionIds = runRows.map((run) => run.id);
      let outcomeRows: Outcome[] = [];
      if (missionIds.length) {
        const { data, error: outcomeError } = await sb.from("growth_outcomes").select("id,mission_id,status,metrics_before,metrics_after,summary,learning,confidence,created_at").in("mission_id", missionIds).order("created_at", { ascending: false }).limit(20);
        if (outcomeError) throw outcomeError; outcomeRows = (data ?? []) as Outcome[];
      }

      setMissions(runRows.map((run) => {
        const mission = run.mission_json ?? {}; const decision = run.decision_json ?? {};
        return { id: run.id, title: textValue(mission.title ?? mission.name ?? decision.title, "Growth mission"), goal: textValue(mission.goal ?? mission.objective ?? decision.goal, "Business growth objective"), priority: numberValue(mission.priority ?? decision.priority, 1), status: run.status, approval_status: run.approved_at ? "approved" : run.status === "awaiting_approval" ? "pending" : "clear", target_value: typeof mission.target_value === "number" ? mission.target_value : null, baseline_value: typeof mission.baseline_value === "number" ? mission.baseline_value : null, unit: typeof mission.unit === "string" ? mission.unit : null, created_at: run.created_at };
      }));
      setActions(((actionRows ?? []) as RawAction[]).map((a) => ({ id: String(a.id), mission_id: missionIdFromPayload(a.payload), title: textValue(a.title, "Growth action"), description: typeof a.description === "string" ? a.description : null, status: textValue(a.status, "pending"), impact_score: a.priority === "high" ? 80 : a.priority === "medium" ? 60 : 40, effort_score: 50, risk_level: "standard", due_at: typeof a.due_at === "string" ? a.due_at : null })));
      const nextMeasurements = outcomeRows.map((o) => { const before = o.metrics_before ?? {}; const after = o.metrics_after ?? {}; const beforeValue = Object.values(before).find((v) => typeof v === "number") as number | undefined; const afterValue = Object.values(after).find((v) => typeof v === "number") as number | undefined; return { id: o.id, mission_id: o.mission_id, kpi: textValue(Object.keys(after)[0] ?? Object.keys(before)[0], "Growth outcome"), before_value: beforeValue ?? null, after_value: afterValue ?? null, delta: beforeValue !== undefined && afterValue !== undefined ? afterValue - beforeValue : null, confidence: o.confidence ?? 0, measured_at: o.created_at }; });
      setMeasurements(nextMeasurements);
      setLearning(outcomeRows.filter((o) => o.learning || o.summary).map((o) => ({ id: o.id, kpi: textValue(Object.keys(o.metrics_after ?? {})[0] ?? Object.keys(o.metrics_before ?? {})[0], "Growth"), recommendation: textValue(o.learning ?? o.summary, "Outcome recorded"), confidence: o.confidence ?? 0, sample_size: 1, created_at: o.created_at })));
    } catch (e) { console.error("Growth dashboard load failed", e); setError(e instanceof Error ? `Unable to load growth data: ${e.message}` : "Unable to load growth data."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (authLoading) return; if (!user) { navigate("/login"); return; } void loadData(user.id); }, [user, authLoading, navigate]);

  async function approveMission(missionId: string) {
    if (!user) return;
    try {
      const { data, error: approvalError } = await requireSupabase().functions.invoke("gga-mission-approval", { body: { mission_id: missionId } });
      if (approvalError) throw approvalError;
      if (data?.error) throw new Error(String(data.error));
      await loadData(user.id);
    } catch (e) { console.error(e); setError(e instanceof Error ? e.message : "Mission approval could not be saved."); }
  }

  const health = useMemo(() => calculateGrowthHealth({ activeMissions: missions.filter((m) => ["active", "approved", "executing", "measuring"].includes(m.status)).length, pendingApprovals: missions.filter((m) => m.approval_status === "pending").length, openActions: actions.filter((a) => ["todo", "approved", "in_progress", "executing", "pending"].includes(a.status)).length, measuredOutcomes: measurements.length, positiveOutcomes: measurements.filter((m) => (m.delta ?? 0) > 0).length, learningSignals: learning.length }), [missions, actions, measurements, learning]);

  if (loading || authLoading) return <AppShell title="Growth Command Center"><div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-violet-300" size={34}/></div></AppShell>;
  if (error) return <AppShell title="Growth Command Center"><div className="grid min-h-[60vh] place-items-center"><div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-400/[.04] p-8 text-center"><AlertCircle className="mx-auto mb-4 text-red-300" size={32}/><h1 className="text-xl font-bold text-white">Growth data unavailable</h1><p className="mt-2 text-sm leading-6 text-zinc-400">{error}</p><button onClick={() => user && void loadData(user.id)} className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black">Retry</button></div></div></AppShell>;

  return <AppShell title="Growth Command Center">
    <div className="mb-7 flex flex-col gap-2 sm:mb-9"><div className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300/80">BUSINESS INTELLIGENCE / LIVE</div><h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Growth Command Center</h2><p className="text-sm text-zinc-500">{business?.name || "Business"} · evidence, decisions, missions, outcomes and learning.</p></div>
    <GrowthCommandCenter score={health.score} rating={null} reviews={null} restaurantName={business?.name} missions={missions} actions={actions} measurements={measurements} learning={learning} onApprove={approveMission}/>
    <GrowthROI measurements={measurements}/>
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/20"><div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Growth Health</h3><TrendingUp className="text-violet-300" size={18}/></div><p className="text-3xl font-black text-white">{health.score === null ? "—" : `${health.score}/100`}</p><p className="mt-1 text-sm text-zinc-500">{health.score === null ? "No evidence yet" : `${health.status.replace("_", " ")} · ${health.confidence}% confidence`}</p></div>
      <div className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:-translate-y-0.5 hover:border-orange-400/20"><div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Mission Pipeline</h3><Target className="text-orange-300" size={18}/></div><p className="text-3xl font-black text-white">{missions.length}</p><p className="mt-1 text-sm text-zinc-500">Governed missions connected to this business.</p></div>
      <div className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:-translate-y-0.5 hover:border-emerald-400/20"><div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Evidence Loop</h3><Activity className="text-emerald-300" size={18}/></div><p className="text-3xl font-black text-white">{measurements.length}</p><p className="mt-1 text-sm text-zinc-500">Measured outcomes · {learning.length} learning signals.</p></div>
    </div>
  </AppShell>;
}
