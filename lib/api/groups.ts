import { supabase } from '../supabase';
import type { Group, GroupWithTeams } from '@/types';

export async function getGroupsByEvent(eventId: string): Promise<GroupWithTeams[]> {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  if (!groups) return [];

  // Fetch teams for each group
  const groupsWithTeams = await Promise.all(
    groups.map(async (group) => {
      const { data: teams } = await supabase
        .from('teams')
        .select('*')
        .eq('group_id', group.id);

      return {
        ...group,
        teams: teams || [],
      };
    })
  );

  return groupsWithTeams;
}

export async function createGroup(
  eventId: string,
  organizationId: string,
  name: string,
  sortOrder: number
): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      event_id: eventId,
      organization_id: organizationId,
      name,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGroup(
  id: string,
  name: string
): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function assignTeamToGroup(
  teamId: string,
  groupId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update({ group_id: groupId })
    .eq('id', teamId);

  if (error) throw error;
}
