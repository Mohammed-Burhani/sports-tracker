import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  getCourtsByEvent,
  createCourt,
  updateCourt,
  deleteCourt,
} from "@/lib/api/courts";
import { Court } from "@/types";

export function useCourts(eventId: string) {
  return useQuery({
    queryKey: queryKeys.courts.byEvent(eventId),
    queryFn: () => getCourtsByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useCreateCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCourt,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.courts.byEvent(data.event_id) });
    },
  });
}

export function useUpdateCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Court> }) =>
      updateCourt(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.courts.byEvent(data.event_id) });
    },
  });
}

export function useDeleteCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventId }: { id: string; eventId: string }) => deleteCourt(id),
    onSuccess: (_data, { eventId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.courts.byEvent(eventId) });
    },
  });
}
