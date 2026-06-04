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

export async function addMember(member: {
  event_id: string;
  organization_id: string;
  name: string;
  age: number;
  team_id?: string | null;
  role?: string | null;
}): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMember(
  id: string,
  updates: Partial<Omit<Member, "id" | "created_at">>
): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .update(updates)
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
