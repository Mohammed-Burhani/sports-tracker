import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGroupsByEvent,
  createGroup,
  updateGroup,
  deleteGroup,
  assignTeamToGroup,
} from '@/lib/api/groups';
import { queryKeys } from '@/constants/queryKeys';
import type { GroupWithTeams } from '@/types';

export function useGroups(eventId: string) {
  return useQuery<GroupWithTeams[]>({
    queryKey: queryKeys.groups.byEvent(eventId),
    queryFn: () => getGroupsByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useCreateGroup(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      name,
      sortOrder,
    }: {
      organizationId: string;
      name: string;
      sortOrder: number;
    }) => createGroup(eventId, organizationId, name, sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.byEvent(eventId) });
    },
  });
}

export function useUpdateGroup(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateGroup(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.byEvent(eventId) });
    },
  });
}

export function useDeleteGroup(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.byEvent(eventId) });
    },
  });
}

export function useAssignTeamToGroup(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, groupId }: { teamId: string; groupId: string | null }) =>
      assignTeamToGroup(teamId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.byEvent(eventId) });
    },
  });
}
