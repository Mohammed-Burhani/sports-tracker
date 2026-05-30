import { supabase } from "@/lib/supabase";
import { Match, MatchStatus, MatchWithTeams } from "@/types";

export interface MatchFilters {
  eventId?: string;
  courtId?: string;
  status?: MatchStatus;
  roundNumber?: number;
  date?: string;
}

export async function getMatches(filters?: MatchFilters): Promise<MatchWithTeams[]> {
  let query = supabase
    .from("matches")
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      court:courts(*),
      event:events(*)
    `)
    .order("scheduled_date", { ascending: true })
    .order("round_number", { ascending: true })
    .order("match_number_in_round", { ascending: true });

  if (filters?.eventId) query = query.eq("event_id", filters.eventId);
  if (filters?.courtId) query = query.eq("court_id", filters.courtId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.roundNumber) query = query.eq("round_number", filters.roundNumber);
  if (filters?.date) query = query.eq("scheduled_date", filters.date);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as any;
}

export async function getMatchesByEvent(eventId: string): Promise<MatchWithTeams[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      court:courts(*),
      event:events(*)
    `)
    .eq("event_id", eventId)
    .order("round_number", { ascending: true })
    .order("match_number_in_round", { ascending: true });

  if (error) throw error;
  return (data ?? []) as any;
}

export async function getMatch(id: string): Promise<MatchWithTeams | null> {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      court:courts(*),
      event:events(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as any;
}

export async function updateMatchResult(
  id: string,
  payload: {
    home_score: number;
    away_score: number;
    status: MatchStatus;
    winner_team_id?: string | null;
    is_draw?: boolean;
    notes?: string;
  }
): Promise<Match> {
  const { data, error } = await supabase
    .from("matches")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMatch(
  id: string,
  payload: Partial<Omit<Match, "id" | "created_at" | "updated_at">>
): Promise<Match> {
  const { data, error } = await supabase
    .from("matches")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMatch(id: string): Promise<void> {
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw error;
}
