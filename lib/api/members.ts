import { supabase } from "@/lib/supabase";
import { Member, MemberWithTeam } from "@/types";

export async function getMembers(eventId: string): Promise<MemberWithTeam[]> {
  const { data, error } = await supabase
    .from("members")
    .select(`
      *,
      team:teams(id, name, colour_hex)
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as any) || [];
}

// Alias for compatibility
export const getMembersByEvent = getMembers;

export async function getMembersByTeam(teamId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("team_id", teamId)
    .order("role", { ascending: true, nullsLast: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addMember(
  eventId: string,
  organizationId: string,
  name: string,
  age: number
): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .insert({
      event_id: eventId,
      organization_id: organizationId,
      name,
      age,
      team_id: null,
      role: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMember(
  id: string,
  name: string,
  age: number,
  teamId?: string | null
): Promise<Member> {
  const updateData: any = { name, age };
  
  if (teamId !== undefined) {
    updateData.team_id = teamId;
    // Role will be auto-cleared by trigger if team_id is null
  }

  const { data, error } = await supabase
    .from("members")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update member role (used by TeamSheet)
export async function updateMemberRole(
  id: string,
  role: "captain" | "player" | "substitute" | null
): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
}

export async function assignMembersToTeams(eventId: string): Promise<number> {
  const { data, error } = await supabase.rpc("assign_members_to_teams", {
    p_event_id: eventId,
  });

  if (error) throw error;
  return data as number;
}
