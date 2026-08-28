import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Loader2, AlertCircle, UtensilsCrossed, TrendingUp, Star } from "lucide-react";
import GrowthCommandCenter from "../components/GrowthCommandCenter";

type Restaurant = {
  name?: string | null;
  score?: number | null;
  rating?: number | null;
  reviews?: number | null;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchRestaurantData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("restaurants")
          .select("name, score, rating, reviews")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
        if (!data) {
          navigate("/app/onboarding");
          return;
        }
        setRestaurant(data);
      } catch (fetchError) {
        console.error("Dashboard data load failed:", fetchError);
        setError("Fehler beim Laden der Restaurantdaten.");
      } finally {
        setLoading(false);
      }
    };

    void fetchRestaurantData();
  }, [user, authLoading, navigate]);

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin text-purple-500" size={48} /></div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4"><div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl"><AlertCircle className="mx-auto text-red-400 mb-4" size={32} /><h1 className="text-xl font-bold text-white mb-2">Fehler</h1><p className="text-slate-400">{error}</p></div></div>;
  }

  const score = typeof restaurant?.score === "number" ? restaurant.score : null;
  const rating = typeof restaurant?.rating === "number" ? restaurant.rating : null;
  const reviews = typeof restaurant?.reviews === "number" ? restaurant.reviews : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Gastro Growth Advisor</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Growth Command Center</h1>
          <p className="mt-1 text-slate-500">Willkommen zurück, {restaurant?.name || "Restaurant"}.</p>
        </header>

        <GrowthCommandCenter />

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Growth Score</h3><TrendingUp className="text-purple-500" size={20} /></div>
            <p className="text-4xl font-extrabold text-white">{score === null ? "Noch nicht analysiert" : `${score}/100`}</p>
            {score !== null && <div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-orange-500" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Menu Status</h3><UtensilsCrossed className="text-orange-500" size={20} /></div>
            <p className="text-2xl font-bold text-white">{score === null ? "Analyse erforderlich" : "Analyse verfügbar"}</p>
            <p className="mt-1 text-sm text-slate-500">Starten Sie die KI-Analyse für aktuelle Empfehlungen.</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-slate-500">Bewertungen</h3><Star className="text-yellow-500" size={20} /></div>
            <p className="text-2xl font-bold text-white">{rating === null ? "Noch keine Daten" : `${rating} Sterne`}</p>
            <p className="mt-1 text-sm text-slate-500">{reviews === null ? "Noch keine Bewertungsdaten" : `${reviews} Bewertungen`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
