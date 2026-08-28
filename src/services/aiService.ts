import { supabase } from "./supabaseClient";

export async function analyzeMenu(menuText: string): Promise<string> {
  const input = menuText.trim();
  if (!input) throw new Error("Menu text is required");

  const { data, error } = await supabase.functions.invoke("gga-menu-analyzer", {
    body: { menuText: input },
  });

  if (error) {
    console.error("Menu AI analysis failed:", error);
    throw new Error("Die KI-Analyse ist fehlgeschlagen. Bitte versuchen Sie es später erneut.");
  }

  const analysis = data?.analysis;
  if (typeof analysis !== "string" || !analysis.trim()) {
    throw new Error("Die KI hat keine verwertbare Analyse zurückgegeben.");
  }

  return analysis.trim();
}
