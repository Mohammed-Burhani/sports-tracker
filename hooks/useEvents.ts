import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  EventFilters,
} from "@/lib/api/events";
import { Event } from "@/types";

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: () => getEvents(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => getEvent(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Event> }) =>
      updateEvent(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
