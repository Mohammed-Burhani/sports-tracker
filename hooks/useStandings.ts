import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { getStandingsByEvent, recalculateStandings } from "@/lib/api/standings";

export function useStandings(eventId: string) {
  return useQuery({
    queryKey: queryKeys.standings.byEvent(eventId),
    queryFn: () => getStandingsByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useRecalculateStandings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recalculateStandings,
    onSuccess: (_data, eventId) => {
      qc.invalidateQueries({ queryKey: queryKeys.standings.byEvent(eventId) });
    },
  });
}
