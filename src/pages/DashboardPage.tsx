import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Loader2, AlertCircle, UtensilsCrossed, TrendingUp, Star } from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchRestaurantData = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          setRestaurant({ name: "Demo Restaurant", score: 85, rating: 4.5, reviews: 128 });
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        if (!data) {
          navigate("/app/onboarding");
          return;
        }

        setRestaurant(data);
      } catch {
        setError("Fehler beim Laden der Restaurantdaten.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [user, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={32} />
          <h1 className="text-xl font-bold text-white mb-2">Fehler</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Willkommen zurück, {restaurant?.name || "Restaurant"}!</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Growth Score</h3>
            <TrendingUp className="text-purple-500" size={20} />
          </div>
          <p className="text-4xl font-extrabold text-white">{restaurant?.score || 0}/100</p>
          <div className="mt-4 h-2 bg-slate-800 rounded-full">
            <div className="h-full bg-gradient-to-r from-purple-600 to-orange-500 rounded-full" style={{ width: `${restaurant?.score || 0}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Menu Status</h3>
            <UtensilsCrossed className="text-orange-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-white">Optimiert</p>
          <p className="text-slate-500 text-sm mt-1">Letzte Analyse: vor 2 Tagen</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">Bewertungen</h3>
            <Star className="text-yellow-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-white">{restaurant?.rating || "4.5"} Sterne</p>
          <p className="text-slate-500 text-sm mt-1">{restaurant?.reviews || 128} Bewertungen</p>
        </div>
      </div>
    </div>
  );
}
