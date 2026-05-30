import { supabase } from "@/lib/supabase";
import { Court } from "@/types";

export async function getCourtsByEvent(eventId: string): Promise<Court[]> {
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createCourt(
  payload: Omit<Court, "id" | "created_at">
): Promise<Court> {
  const { data, error } = await supabase
    .from("courts")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourt(
  id: string,
  payload: Partial<Omit<Court, "id" | "created_at">>
): Promise<Court> {
  const { data, error } = await supabase
    .from("courts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourt(id: string): Promise<void> {
  const { error } = await supabase.from("courts").delete().eq("id", id);
  if (error) throw error;
}
