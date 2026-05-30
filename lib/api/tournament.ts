import { supabase } from "@/lib/supabase";

/**
 * Advance tournament bracket after a match is completed
 * This function updates the next round matches with winners
 * and populates the third place match with semi-final losers
 */
export async function advanceTournamentBracket(matchId: string): Promise<void> {
  // Get the completed match details
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*, event:events(*)")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    throw new Error(`Match not found: ${matchError?.message}`);
  }

  // Only process tournament matches
  if (match.event.format !== "tournament") {
    return;
  }

  // No winner yet
  if (!match.winner_team_id) {
    return;
  }

  // Calculate next round
  const nextRoundNumber = match.round_number + 1;
  
  // Determine if this is an odd or even match in the round
  const isOddMatch = match.match_number_in_round % 2 === 1;
  
  // Calculate which match in the next round this feeds into
  const nextMatchNumber = Math.ceil(match.match_number_in_round / 2);

  // Update the next round match with the winner
  const updateField = isOddMatch ? "home_team_id" : "away_team_id";
  
  const { error: updateError } = await supabase
    .from("matches")
    .update({ [updateField]: match.winner_team_id })
    .eq("event_id", match.event_id)
    .eq("round_number", nextRoundNumber)
    .eq("match_number_in_round", nextMatchNumber)
    .neq("round_label", "Third Place");

  if (updateError) {
    console.error("Error updating next round match:", updateError);
    throw updateError;
  }

  // Handle Third Place match population
  // Check if this is a semi-final match
  if (match.round_label === "Semi-final") {
    // Determine the loser of this semi-final
    const loserTeamId = match.winner_team_id === match.home_team_id 
      ? match.away_team_id 
      : match.home_team_id;

    // Update third place match with the loser
    const thirdPlaceField = isOddMatch ? "home_team_id" : "away_team_id";
    
    const { error: thirdPlaceError } = await supabase
      .from("matches")
      .update({ [thirdPlaceField]: loserTeamId })
      .eq("event_id", match.event_id)
      .eq("round_label", "Third Place");

    if (thirdPlaceError) {
      console.error("Error updating third place match:", thirdPlaceError);
      throw thirdPlaceError;
    }
  }
}
