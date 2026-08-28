import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Loader2, AlertCircle, UtensilsCrossed, TrendingUp, Star } from "lucide-react";
import GrowthCommandCenter from "../components/GrowthCommandCenter";

type Restaurant = { id: string; name?: string | null; score?: number | null; rating?: number | null; reviews?: number | null };
type Mission = { id: string; title: string; goal: string; priority: number; status: string; approval_status: string; target_value: number | null; baseline_value: number | null; unit: string | null; created_at: string };
type Action = { id: string; mission_id: string; title: string; description: string | null; status: string; impact_score: number; effort_score: number; risk_level: string; due_at: string | null };
type Measurement = { id: string; mission_id: string; kpi: string; before_value: number | null; after_value: number | null; delta: number | null; confidence: number; measured_at: string };
type Learning = { id: string; kpi: string; recommendation: string; confidence: number; sample_size: number; created_at: string };

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
    setLoading(true); setError(null);
    try {
      const { data: restaurantData, error: restaurantError } = await supabase.from("restaurants").select("id,name,score,rating,reviews").eq("user_id", userId).single();
      if (restaurantError && restaurantError.code !== "PGRST116") throw restaurantError;
      if (!restaurantData) { navigate("/app/onboarding"); return; }
      const r = restaurantData as Restaurant; setRestaurant(r);
      const [{ data: ms, error: me }, { data: mt, error: mte }, { data: lm, error: le }] = await Promise.all([
        supabase.from("growth_missions").select("id,title,goal,priority,status,approval_status,target_value,baseline_value,unit,created_at").eq("restaurant_id", r.id).order("priority", { ascending: false }).limit(8),
        supabase.from("growth_measurements").select("id,mission_id,kpi,before_value,after_value,delta,confidence,measured_at").eq("restaurant_id", r.id).order("measured_at", { ascending: false }).limit(12),
        supabase.from("growth_learning_memory").select("id,kpi,recommendation,confidence,sample_size,created_at").eq("restaurant_id", r.id).order("created_at", { ascending: false }).limit(8),
      ]);
      if (me) throw me; if (mte) throw mte; if (le) throw le;
      const nextMissions = (ms ?? []) as Mission[]; setMissions(nextMissions); setMeasurements((mt ?? []) as Measurement[]); setLearning((lm ?? []) as Learning[]);
      if (nextMissions.length) {
        const { data: as, error: ae } = await supabase.from("growth_actions").select("id,mission_id,title,description,status,impact_score,effort_score,risk_level,due_at").in("mission_id", nextMissions.map((m) => m.id)).order("impact_score", { ascending: false });
        if (ae) throw ae; setActions((as ?? []) as Action[]);
      } else setActions([]);
    } catch (e) { console.error(e); setError("Fehler beim Laden der Growth-Daten."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (authLoading) return; if (!user) { navigate("/login"); return; } void loadData(user.id); }, [user, authLoading, navigate]);

  async function approveMission(missionId: string) {
    if (!restaurant?.id || !user) return;
    const { error: updateError } = await supabase.from("growth_missions").update({ approval_status: "approved", status: "active", approved_by: user.id, approved_at: new Date().toISOString() }).eq("id", missionId).eq("restaurant_id", restaurant.id);
    if (updateError) { setError("Freigabe konnte nicht gespeichert werden."); return; }
    await loadData(user.id);
  }

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin text-purple-500" size={48}/></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4"><div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl"><AlertCircle className="mx-auto mb-4 text-red-400" size={32}/><h1 className="mb-2 text-xl font-bold text-white">Fehler</h1><p className="text-slate-400">{error}</p></div></div>;

  const score = typeof restaurant?.score === "number" ? restaurant.score : null;
  const rating = typeof restaurant?.rating === "number" ? restaurant.rating : null;
  const reviews = typeof restaurant?.reviews === "number" ? restaurant.reviews : null;

  return <div className="min-h-screen bg-slate-950 p-3 font-sans text-slate-300 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">
    <header className="mb-6 sm:mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Gastro Growth Advisor</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Growth Command Center</h1><p className="mt-1 text-sm text-slate-500">Willkommen zurück, {restaurant?.name || "Restaurant"}.</p></header>
    <GrowthCommandCenter score={score} rating={rating} reviews={reviews} restaurantName={restaurant?.name} missions={missions} actions={actions} measurements={measurements} learning={learning} onApprove={approveMission}/>
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Growth Score</h3><TrendingUp className="text-purple-500" size={20}/></div><p className="text-3xl font-extrabold text-white">{score === null ? "Noch nicht analysiert" : `${score}/100`}</p>{score !== null&&<div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-orange-500" style={{width:`${Math.max(0,Math.min(100,score))}%`}}/></div>}</div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Mission Pipeline</h3><UtensilsCrossed className="text-orange-500" size={20}/></div><p className="text-3xl font-extrabold text-white">{missions.length}</p><p className="mt-1 text-sm text-slate-500">Growth missions connected to your business.</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Bewertungen</h3><Star className="text-yellow-500" size={20}/></div><p className="text-xl font-bold text-white">{rating === null ? "Noch keine Daten" : `${rating} Sterne`}</p><p className="mt-1 text-sm text-slate-500">{reviews === null ? "Noch keine Bewertungsdaten" : `${reviews} Bewertungen`}</p></div>
    </div>
  </div></div>;
}
