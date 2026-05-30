import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { updateMatchResult } from "@/lib/api/matches";
import { recalculateStandings } from "@/lib/api/standings";
import { advanceTournamentBracket } from "@/lib/api/tournament";
import { MatchStatus } from "@/types";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export function useQuickMatchResult() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      matchId,
      eventId,
      eventFormat,
      winnerTeamId,
      homeTeamId,
      awayTeamId,
    }: {
      matchId: string;
      eventId: string;
      eventFormat: string;
      winnerTeamId: string;
      homeTeamId: string | null;
      awayTeamId: string | null;
    }) => {
      console.log('useQuickMatchResult called with:', {
        matchId,
        eventId,
        eventFormat,
        winnerTeamId,
        homeTeamId,
        awayTeamId,
      });

      // Determine scores (winner gets 1, loser gets 0 for quick marking)
      const homeScore = winnerTeamId === homeTeamId ? 1 : 0;
      const awayScore = winnerTeamId === awayTeamId ? 1 : 0;

      console.log('Updating match with scores:', { homeScore, awayScore });

      const match = await updateMatchResult(matchId, {
        home_score: homeScore,
        away_score: awayScore,
        status: "completed" as MatchStatus,
        winner_team_id: winnerTeamId,
        is_draw: false,
      });

      console.log('Match updated successfully:', match);

      // Advance tournament bracket if tournament format
      if (eventFormat === "tournament") {
        console.log('Advancing tournament bracket');
        await advanceTournamentBracket(matchId);
        console.log('Bracket advanced successfully');
      }

      // Recalculate standings if it's a league event
      if (eventFormat === "league") {
        console.log('Recalculating standings for league event');
        await recalculateStandings(eventId);
      }

      return match;
    },
    onSuccess: (_data, { eventId, matchId }) => {
      console.log('useQuickMatchResult onSuccess, invalidating queries');
      qc.invalidateQueries({ queryKey: queryKeys.matches.all });
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(matchId) });
      qc.invalidateQueries({ queryKey: queryKeys.matches.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.standings.byEvent(eventId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      showSuccessToast("Winner marked");
    },
    onError: (error: any) => {
      console.error("Error marking winner:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      showErrorToast(`Failed to mark winner: ${error.message || 'Unknown error'}`);
    },
  });
}
