import { supabase } from "@/lib/supabase";
import { Team } from "@/types";

export async function getTeamsByEvent(eventId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("event_id", eventId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTeam(
  payload: Omit<Team, "id" | "created_at">
): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeam(
  id: string,
  payload: Partial<Omit<Team, "id" | "created_at">>
): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw error;
}
