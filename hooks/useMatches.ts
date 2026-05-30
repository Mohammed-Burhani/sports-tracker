import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  getMatches,
  getMatchesByEvent,
  getMatch,
  updateMatchResult,
  updateMatch,
  deleteMatch,
  MatchFilters,
} from "@/lib/api/matches";
import { Match, MatchStatus } from "@/types";
import { recalculateStandings } from "@/lib/api/standings";

export function useMatches(filters?: MatchFilters) {
  return useQuery({
    queryKey: queryKeys.matches.list(filters),
    queryFn: () => getMatches(filters),
  });
}

export function useMatchesByEvent(eventId: string) {
  return useQuery({
    queryKey: queryKeys.matches.byEvent(eventId),
    queryFn: () => getMatchesByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: queryKeys.matches.detail(id),
    queryFn: () => getMatch(id),
    enabled: !!id,
  });
}

export function useUpdateMatchResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      eventId,
      eventFormat,
      payload,
    }: {
      id: string;
      eventId: string;
      eventFormat: string;
      payload: {
        home_score: number;
        away_score: number;
        status: MatchStatus;
        winner_team_id?: string | null;
        is_draw?: boolean;
        notes?: string;
      };
    }) => {
      const match = await updateMatchResult(id, payload);
      
      // Recalculate standings if it's a league event and match is completed
      if (eventFormat === "league" && payload.status === "completed") {
        await recalculateStandings(eventId);
      }
      
      return match;
    },
    onSuccess: (_data, { id, eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.all });
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.matches.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.standings.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Match> }) =>
      updateMatch(id, payload),
    onSuccess: (data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.all });
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.matches.byEvent(data.event_id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
