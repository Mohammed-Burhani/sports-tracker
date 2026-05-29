import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  getPlayerCount,
  upsertPlayerCount,
  getParticipantCountSummary,
} from "@/lib/api/participants";
import { PlayerCount } from "@/types";

export function usePlayerCount(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.playerCounts.bySession(sessionId),
    queryFn: () => getPlayerCount(sessionId),
    enabled: !!sessionId,
  });
}

export function usePlayerCountSummary() {
  return useQuery({
    queryKey: queryKeys.playerCounts.summary,
    queryFn: getParticipantCountSummary,
  });
}

export function useUpsertPlayerCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      counts,
    }: {
      sessionId: string;
      counts: Partial<Pick<PlayerCount, "expected_count" | "actual_count" | "checked_in_count">>;
    }) => upsertPlayerCount(sessionId, counts),
    onMutate: async ({ sessionId, counts }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: queryKeys.playerCounts.bySession(sessionId) });
      const prev = qc.getQueryData<PlayerCount>(queryKeys.playerCounts.bySession(sessionId));
      qc.setQueryData(queryKeys.playerCounts.bySession(sessionId), (old: any) =>
        old ? { ...old, ...counts } : counts
      );
      return { prev };
    },
    onError: (_err, { sessionId }, ctx) => {
      qc.setQueryData(queryKeys.playerCounts.bySession(sessionId), ctx?.prev);
    },
    onSettled: (_data, _err, { sessionId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.playerCounts.bySession(sessionId) });
      qc.invalidateQueries({ queryKey: queryKeys.playerCounts.summary });
    },
  });
}
