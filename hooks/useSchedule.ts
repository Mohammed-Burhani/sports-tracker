import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { triggerScheduleGeneration } from "@/lib/api/schedule";

export function useGenerateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      console.log('useGenerateSchedule called for event:', eventId);
      const result = await triggerScheduleGeneration(eventId);
      console.log('Schedule generation result:', result);
      return result;
    },
    onSuccess: (_data, eventId) => {
      console.log('Schedule generation successful, invalidating queries');
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.matches.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.teams.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.courts.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.standings.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (error: any) => {
      console.error('Schedule generation error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    },
  });
}
