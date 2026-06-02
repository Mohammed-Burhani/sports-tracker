import { supabase } from '../supabase';
import type { Member, MemberWithTeam } from '@/types';

export async function getMembersByEvent(eventId: string): Promise<MemberWithTeam[]> {
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      team:teams(id, name, colour_hex)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

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
    .from('members')
    .insert({
      event_id: eventId,
      organization_id: organizationId,
      name,
      age,
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
  }

  const { data, error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function assignMembersToTeams(eventId: string): Promise<number> {
  const { data, error } = await supabase.rpc('assign_members_to_teams', {
    p_event_id: eventId,
  });

  if (error) throw error;
  return data as number;
}
