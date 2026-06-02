import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMembersByEvent,
  addMember,
  updateMember,
  deleteMember,
  assignMembersToTeams,
  type MemberWithTeam,
} from '@/lib/api/members';
import { queryKeys } from '@/constants/queryKeys';

export function useMembers(eventId: string) {
  return useQuery<MemberWithTeam[]>({
    queryKey: queryKeys.members.byEvent(eventId),
    queryFn: () => getMembersByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useAddMember(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      name,
      age,
    }: {
      organizationId: string;
      name: string;
      age: number;
    }) => addMember(eventId, organizationId, name, age),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.byEvent(eventId) });
    },
  });
}

export function useUpdateMember(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      name,
      age,
      teamId,
    }: {
      id: string;
      name: string;
      age: number;
      teamId?: string | null;
    }) => updateMember(id, name, age, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.byEvent(eventId) });
    },
  });
}

export function useDeleteMember(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.byEvent(eventId) });
    },
  });
}

export function useAssignMembersToTeams(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => assignMembersToTeams(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.byEvent(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.byEvent(eventId) });
    },
  });
}
