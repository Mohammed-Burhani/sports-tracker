import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  getSessions,
  getSessionsByEvent,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  SessionFilters,
} from "@/lib/api/sessions";
import { Session } from "@/types";

export function useSessions(filters?: SessionFilters) {
  return useQuery({
    queryKey: queryKeys.sessions.list(filters),
    queryFn: () => getSessions(filters),
  });
}

export function useSessionsByEvent(eventId: string) {
  return useQuery({
    queryKey: queryKeys.sessions.byEvent(eventId),
    queryFn: () => getSessionsByEvent(eventId),
    enabled: !!eventId,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => getSession(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.byEvent(data.event_id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Session> }) =>
      updateSession(id, payload),
    onSuccess: (data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.byEvent(data.event_id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
