import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { requireSupabase } from "../lib/supabase";
import { Loader2, AlertCircle, UtensilsCrossed, TrendingUp, Star } from "lucide-react";
import GrowthCommandCenter from "../components/GrowthCommandCenter";
import GrowthROI from "../components/GrowthROI";

type Restaurant = { id: string; name?: string | null; score?: number | null; rating?: number | null; reviews?: number | null; business_profile_id?: string | null };
type Mission = { id: string; title: string; goal: string; priority: number; status: string; approval_status: string; target_value: number | null; baseline_value: number | null; unit: string | null; created_at: string };
type Action = { id: string; mission_id: string; title: string; description: string | null; status: string; impact_score: number; effort_score: number; risk_level: string; due_at: string | null };
type Measurement = { id: string; mission_id: string; kpi: string; before_value: number | null; after_value: number | null; delta: number | null; confidence: number; measured_at: string };
type Learning = { id: string; kpi: string; recommendation: string; confidence: number; sample_size: number; created_at: string };

type MissionRun = {
  id: string;
  business_id: string;
  status: string;
  mission_json: Record<string, unknown> | null;
  decision_json: Record<string, unknown> | null;
  created_at: string;
};
type Outcome = { id: string; mission_id: string; status: string; metrics_before: Record<string, unknown> | null; metrics_after: Record<string, unknown> | null; summary: string | null; learning: string | null; confidence: number | null; created_at: string };

function textValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}
function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [learning, setLearning] = useState<Learning[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadData(userId: string) {
    setLoading(true);
    setError(null);
    try {
      const sb = requireSupabase();
      const { data: membership, error: membershipError } = await sb
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1)
        .single();
      if (membershipError && membershipError.code !== "PGRST116") throw membershipError;
      if (!membership?.organization_id) {
        navigate("/app/onboarding");
        return;
      }

      const { data: restaurantData, error: restaurantError } = await sb
        .from("restaurants")
        .select("id,name,score,rating,reviews,business_profile_id")
        .eq("organization_id", membership.organization_id)
        .limit(1)
        .single();
      if (restaurantError && restaurantError.code !== "PGRST116") throw restaurantError;
      if (!restaurantData) {
        navigate("/app/onboarding");
        return;
      }

      const r = restaurantData as Restaurant;
      setRestaurant(r);

      const businessId = r.business_profile_id;
      let runRows: MissionRun[] = [];
      if (businessId) {
        const { data, error: runError } = await sb
          .from("growth_mission_runs")
          .select("id,business_id,status,mission_json,decision_json,created_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(8);
        if (runError) throw runError;
        runRows = (data ?? []) as MissionRun[];
      }

      const { data: actionRows, error: actionError } = await sb
        .from("actions")
        .select("id,restaurant_id,title,description,status,priority,due_at,created_at")
        .eq("restaurant_id", r.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (actionError) throw actionError;

      const missionIds = runRows.map((run) => run.id);
      let outcomeRows: Outcome[] = [];
      if (missionIds.length) {
        const { data, error: outcomeError } = await sb
          .from("growth_outcomes")
          .select("id,mission_id,status,metrics_before,metrics_after,summary,learning,confidence,created_at")
          .in("mission_id", missionIds)
          .order("created_at", { ascending: false })
          .limit(20);
        if (outcomeError) throw outcomeError;
        outcomeRows = (data ?? []) as Outcome[];
      }

      const nextMissions: Mission[] = runRows.map((run) => {
        const mission = run.mission_json ?? {};
        const decision = run.decision_json ?? {};
        return {
          id: run.id,
          title: textValue(mission.title ?? mission.name ?? decision.title, "Growth mission"),
          goal: textValue(mission.goal ?? mission.objective ?? decision.goal, "AI-generated growth mission"),
          priority: numberValue(mission.priority ?? decision.priority, 1),
          status: run.status,
          approval_status: run.approved_at ? "approved" : run.status === "awaiting_approval" ? "pending" : "clear",
          target_value: typeof mission.target_value === "number" ? mission.target_value : null,
          baseline_value: typeof mission.baseline_value === "number" ? mission.baseline_value : null,
          unit: typeof mission.unit === "string" ? mission.unit : null,
          created_at: run.created_at,
        };
      });
      setMissions(nextMissions);

      const nextActions: Action[] = ((actionRows ?? []) as Array<Record<string, unknown>>).map((a) => ({
        id: String(a.id),
        mission_id: String(a.recommendation_id ?? ""),
        title: textValue(a.title, "Growth action"),
        description: typeof a.description === "string" ? a.description : null,
        status: textValue(a.status, "pending"),
        impact_score: numberValue(a.priority === "high" ? 80 : a.priority === "medium" ? 60 : 40, 40),
        effort_score: 50,
        risk_level: "standard",
        due_at: typeof a.due_at === "string" ? a.due_at : null,
      }));
      setActions(nextActions);

      const nextMeasurements: Measurement[] = outcomeRows.map((o) => {
        const before = o.metrics_before ?? {};
        const after = o.metrics_after ?? {};
        const beforeValue = Object.values(before).find((v) => typeof v === "number") as number | undefined;
        const afterValue = Object.values(after).find((v) => typeof v === "number") as number | undefined;
        return {
          id: o.id,
          mission_id: o.mission_id,
          kpi: textValue(Object.keys(after)[0] ?? Object.keys(before)[0], "Growth outcome"),
          before_value: beforeValue ?? null,
          after_value: afterValue ?? null,
          delta: beforeValue !== undefined && afterValue !== undefined ? afterValue - beforeValue : null,
          confidence: o.confidence ?? 0,
          measured_at: o.created_at,
        };
      });
      setMeasurements(nextMeasurements);

      setLearning(outcomeRows.filter((o) => o.learning || o.summary).map((o) => ({
        id: o.id,
        kpi: textValue(Object.keys(o.metrics_after ?? {})[0] ?? Object.keys(o.metrics_before ?? {})[0], "Growth"),
        recommendation: textValue(o.learning ?? o.summary, "Outcome recorded"),
        confidence: o.confidence ?? 0,
        sample_size: 1,
        created_at: o.created_at,
      })));
    } catch (e) {
      console.error("Growth dashboard load failed", e);
      setError(e instanceof Error ? `Fehler beim Laden der Growth-Daten: ${e.message}` : "Fehler beim Laden der Growth-Daten.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    void loadData(user.id);
  }, [user, authLoading, navigate]);

  async function approveMission(missionId: string) {
    if (!user) return;
    try {
      const sb = requireSupabase();
      const { error: updateError } = await sb
        .from("growth_mission_runs")
        .update({ status: "active", approved_at: new Date().toISOString() })
        .eq("id", missionId);
      if (updateError) throw updateError;
      await loadData(user.id);
    } catch (e) {
      console.error(e);
      setError("Freigabe konnte nicht gespeichert werden.");
    }
  }

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin text-purple-500" size={48}/></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4"><div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl"><AlertCircle className="mx-auto mb-4 text-red-400" size={32}/><h1 className="mb-2 text-xl font-bold text-white">Fehler</h1><p className="text-slate-400">{error}</p><button onClick={() => user && void loadData(user.id)} className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">Erneut versuchen</button></div></div>;

  const score = typeof restaurant?.score === "number" ? restaurant.score : null;
  const rating = typeof restaurant?.rating === "number" ? restaurant.rating : null;
  const reviews = typeof restaurant?.reviews === "number" ? restaurant.reviews : null;

  return <div className="min-h-screen bg-slate-950 p-3 font-sans text-slate-300 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl"><header className="mb-6 sm:mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Gastro Growth Advisor</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Growth Command Center</h1><p className="mt-1 text-sm text-slate-500">Willkommen zurück, {restaurant?.name || "Business"}.</p></header><GrowthCommandCenter score={score} rating={rating} reviews={reviews} restaurantName={restaurant?.name} missions={missions} actions={actions} measurements={measurements} learning={learning} onApprove={approveMission}/><GrowthROI measurements={measurements}/><div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3"><div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Growth Score</h3><TrendingUp className="text-purple-500" size={20}/></div><p className="text-3xl font-extrabold text-white">{score === null ? "Noch nicht analysiert" : `${score}/100`}</p>{score !== null&&<div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-orange-500" style={{width:`${Math.max(0,Math.min(100,score))}%`}}/></div>}</div><div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Mission Pipeline</h3><UtensilsCrossed className="text-orange-500" size={20}/></div><p className="text-3xl font-extrabold text-white">{missions.length}</p><p className="mt-1 text-sm text-slate-500">Growth missions connected to your business.</p></div><div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Bewertungen</h3><Star className="text-yellow-500" size={20}/></div><p className="text-xl font-bold text-white">{rating === null ? "Noch keine Daten" : `${rating} Sterne`}</p><p className="mt-1 text-sm text-slate-500">{reviews === null ? "Noch keine Bewertungsdaten" : `${reviews} Bewertungen`}</p></div></div></div></div>;
}
