import { supabase } from "../lib/supabase";

export interface LeadData {
  email: string;
  name?: string;
}

export async function saveLead(data: LeadData): Promise<void> {
  if (!supabase) {
    console.warn("Supabase not configured. Simulating lead save.");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  }
  
  const { error } = await supabase
    .from("leads")
    .insert([data]);
    
  if (error) throw new Error(error.message);
}
