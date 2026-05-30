import { supabase } from "@/lib/supabase";
import { Standing, StandingWithTeam } from "@/types";

export async function getStandingsByEvent(eventId: string): Promise<StandingWithTeam[]> {
  const { data, error } = await supabase
    .from("standings")
    .select("*, team:teams(*)")
    .eq("event_id", eventId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as any;
}

export async function recalculateStandings(eventId: string): Promise<void> {
  const { error } = await supabase.rpc("recalculate_standings", {
    p_event_id: eventId,
  });

  if (error) throw error;
}
