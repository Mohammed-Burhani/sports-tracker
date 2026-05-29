import { supabase } from "@/lib/supabase";
import { PlayerCount, SessionParticipant } from "@/types";

export async function getPlayerCount(sessionId: string): Promise<PlayerCount | null> {
  const { data, error } = await supabase
    .from("player_counts")
    .select("*")
    .eq("session_id", sessionId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertPlayerCount(
  sessionId: string,
  counts: Partial<Pick<PlayerCount, "expected_count" | "actual_count" | "checked_in_count">>
): Promise<PlayerCount> {
  const { data, error } = await supabase
    .from("player_counts")
    .upsert({ session_id: sessionId, ...counts }, { onConflict: "session_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getParticipantCountSummary(): Promise<
  { event_id: string; event_name: string; sport: string; total_expected: number; total_actual: number; total_checked_in: number }[]
> {
  const { data, error } = await supabase
    .from("player_counts")
    .select(`
      expected_count,
      actual_count,
      checked_in_count,
      session:sessions(
        event_id,
        event:events(id, name, sport, status)
      )
    `)
    .order("session_id");

  if (error) throw error;

  const grouped: Record<string, any> = {};
  for (const row of (data ?? []) as any[]) {
    const event = row.session?.event;
    if (!event || event.status === "cancelled") continue;
    if (!grouped[event.id]) {
      grouped[event.id] = {
        event_id: event.id,
        event_name: event.name,
        sport: event.sport,
        total_expected: 0,
        total_actual: 0,
        total_checked_in: 0,
      };
    }
    grouped[event.id].total_expected += row.expected_count ?? 0;
    grouped[event.id].total_actual += row.actual_count ?? 0;
    grouped[event.id].total_checked_in += row.checked_in_count ?? 0;
  }

  return Object.values(grouped);
}

export async function getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
  const { data, error } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertSessionParticipant(
  payload: Partial<SessionParticipant> & { session_id: string; entity_id: string }
): Promise<SessionParticipant> {
  const { data, error } = await supabase
    .from("session_participants")
    .upsert(payload, { onConflict: "session_id,entity_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
