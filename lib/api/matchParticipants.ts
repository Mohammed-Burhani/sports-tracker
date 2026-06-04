import { supabase } from "@/lib/supabase";

export async function assignMatchParticipants(
  matchId: string,
  membersPerTeam?: number
): Promise<number> {
  const { data, error } = await supabase.rpc("assign_random_members_to_match", {
    p_match_id: matchId,
    p_members_per_team: membersPerTeam,
  });

  if (error) throw error;
  return data as number;
}

export async function assignAllMatchParticipants(
  eventId: string,
  membersPerTeam?: number
): Promise<void> {
  const { error } = await supabase.rpc("assign_members_to_all_matches", {
    p_event_id: eventId,
    p_members_per_team: membersPerTeam,
  });

  if (error) throw error;
}

export async function getMatchParticipants(matchId: string) {
  const { data, error } = await supabase
    .from("match_participants")
    .select(`
      *,
      member:members(*)
    `)
    .eq("match_id", matchId);

  if (error) throw error;
  return data;
}

export async function updateMatchParticipants(
  matchId: string,
  participants: Array<{ team_id: string; member_id: string }>
): Promise<void> {
  // Delete existing
  await supabase.from("match_participants").delete().eq("match_id", matchId);

  // Insert new
  const { error } = await supabase.from("match_participants").insert(
    participants.map((p) => ({
      match_id: matchId,
      team_id: p.team_id,
      member_id: p.member_id,
    }))
  );

  if (error) throw error;
}
