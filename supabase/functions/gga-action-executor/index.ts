import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const externalTypes = new Set(["publish_social", "publish_google_business", "send_email", "launch_ad"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { actionId } = await req.json();
    if (!actionId) throw new Error("actionId is required");
    const { data: action, error } = await supabase.from("actions").select("*").eq("id", actionId).single();
    if (error) throw error;

    const missionId = action?.payload && typeof action.payload === "object" && typeof action.payload.mission_id === "string" ? action.payload.mission_id : null;
    if (missionId) {
      const { data: mission, error: missionError } = await supabase.from("growth_mission_runs").select("id,status,approved_at").eq("id", missionId).maybeSingle();
      if (missionError) throw missionError;
      if (!mission) throw new Error("Governed mission not found or not accessible");
      if (!mission.approved_at || !["approved", "executing", "measuring"].includes(mission.status)) throw new Error("Mission approval is required before execution");
    }

    const { error: startError } = await supabase.from("actions").update({ status: "in_progress" }).eq("id", actionId).in("status", ["todo", "approved", "pending"]);
    if (startError) throw startError;

    if (externalTypes.has(action.action_type)) {
      const result = { state: "awaiting_integration", reason: "External provider authorization is required before execution.", provider_action: action.action_type };
      await supabase.from("actions").update({ status: "awaiting_approval", result }).eq("id", actionId);
      return new Response(JSON.stringify({ status: "awaiting_approval", result }), { headers: { ...headers, "Content-Type": "application/json" } });
    }

    const result = { state: "completed", executed_by: user.id, execution_type: "internal", completed_at: new Date().toISOString() };
    const { error: updateError } = await supabase.from("actions").update({ status: "completed", result, completed_at: new Date().toISOString() }).eq("id", actionId);
    if (updateError) throw updateError;
    if (action.recommendation_id) await supabase.from("recommendations").update({ status: "completed" }).eq("id", action.recommendation_id);
    return new Response(JSON.stringify({ status: "completed", result }), { headers: { ...headers, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Action execution failed" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
  }
});