import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  getTeamsByEvent,
  createTeam,
  updateTeam,
  deleteTeam,
} from "@/lib/api/teams";
import { Team } from "@/types";

export function useTeams(eventId: string) {
  return useQuery({
    queryKey: queryKeys.teams.byEvent(eventId),
    queryFn: () => getTeamsByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.teams.byEvent(data.event_id) });
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Team> }) =>
      updateTeam(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.teams.byEvent(data.event_id) });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventId }: { id: string; eventId: string }) => deleteTeam(id),
    onSuccess: (_data, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.teams.byEvent(eventId) });
    },
  });
}
