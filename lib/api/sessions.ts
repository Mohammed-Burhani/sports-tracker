import { supabase } from "@/lib/supabase";
import { Session, SessionStatus, Sport, EventFormat } from "@/types";

export interface SessionFilters {
  sport?: Sport;
  format?: EventFormat;
  status?: SessionStatus;
  date?: string;
  eventId?: string;
}

export async function getSessions(filters?: SessionFilters): Promise<(Session & { event: { name: string; sport: string; format: string } })[]> {
  let query = supabase
    .from("sessions")
    .select("*, event:events(name, sport, format)")
    .order("date", { ascending: false })
    .order("start_time", { ascending: true });

  if (filters?.eventId) query = query.eq("event_id", filters.eventId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.date) query = query.eq("date", filters.date);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as any;
}

export async function getSessionsByEvent(eventId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("event_id", eventId)
    .order("session_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSession(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, event:events(*), player_counts(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as any;
}

export async function createSession(
  payload: Omit<Session, "id" | "created_at" | "updated_at">
): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSession(
  id: string,
  payload: Partial<Omit<Session, "id" | "created_at" | "updated_at">>
): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
}
