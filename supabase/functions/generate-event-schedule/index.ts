import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateScheduleRequest {
  event_id: string;
}

interface GenerateScheduleResponse {
  success: boolean;
  teams_created: number;
  courts_created: number;
  matches_created: number;
  rounds_created: number;
  error?: string;
  step_failed?: string;
}

const TEAM_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B739", // Orange
  "#52B788", // Green
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { event_id } = (await req.json()) as GenerateScheduleRequest;

    if (!event_id) {
      throw new Error("event_id is required");
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      throw new Error(`Event not found: ${eventError?.message}`);
    }

    const {
      organization_id,
      format,
      teams_count,
      players_per_team,
      courts_count,
      court_names,
      start_date,
      end_date,
      duration_hours,
      groups_count,
    } = event;

    let teamsCreated = 0;
    let courtsCreated = 0;
    let matchesCreated = 0;
    let roundsCreated = 0;

    // ─── Step 1: Create Teams ────────────────────────────────────────────────

    try {
      const teamNames = Array.from(
        { length: teams_count },
        (_, i) => `Team ${String.fromCharCode(65 + i)}`
      );

      const teamsToInsert = teamNames.map((name, index) => ({
        event_id,
        organization_id,
        name,
        player_count: players_per_team || 0,
        colour_hex: TEAM_COLORS[index % TEAM_COLORS.length],
      }));

      const { data: teams, error: teamsError } = await supabaseClient
        .from("teams")
        .insert(teamsToInsert)
        .select();

      if (teamsError) throw new Error(`Teams creation failed: ${teamsError.message}`);
      teamsCreated = teams?.length || 0;

      // ─── Step 2: Create Courts ───────────────────────────────────────────────

      // Use court names from event if provided, otherwise generate default names
      const courtNamesToUse = court_names && court_names.length > 0
        ? court_names
        : Array.from({ length: courts_count || 1 }, (_, i) => `Court ${String.fromCharCode(65 + i)}`);

      const courtsToInsert = courtNamesToUse.map((name, index) => ({
        event_id,
        organization_id,
        name,
        sort_order: index,
      }));

      const { data: courts, error: courtsError } = await supabaseClient
        .from("courts")
        .insert(courtsToInsert)
        .select();

      if (courtsError) throw new Error(`Courts creation failed: ${courtsError.message}`);
      courtsCreated = courts?.length || 0;

      // ─── Step 3: Generate Matches ─────────────────────────────────────────────

      const matches: any[] = [];

      if (format === "tournament") {
        // Tournament: Single Elimination
        const { matches: tournamentMatches, rounds } = generateTournamentMatches(
          teams!,
          courts!,
          start_date,
          end_date,
          duration_hours
        );
        matches.push(...tournamentMatches);
        roundsCreated = rounds;
      } else if (format === "league") {
        // League: Round Robin
        const { matches: leagueMatches, rounds } = generateLeagueMatches(
          teams!,
          courts!,
          start_date,
          end_date,
          duration_hours
        );
        matches.push(...leagueMatches);
        roundsCreated = rounds;
      } else if (format === "championship") {
        // Championship: Create groups first, then generate matches
        
        if (!groups_count || groups_count < 2) {
          throw new Error("Championship requires at least 2 groups");
        }

        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Create groups
        const groupNames = Array.from({ length: groups_count }, (_, i) => `Group ${String.fromCharCode(65 + i)}`);
        
        const groupsToInsert = groupNames.map((name, index) => ({
          event_id,
          organization_id,
          name,
          sort_order: index,
        }));

        const { data: createdGroups, error: groupsError } = await supabaseAdmin
          .from("groups")
          .insert(groupsToInsert)
          .select();

        if (groupsError) throw new Error(`Groups creation failed: ${groupsError.message}`);

        // Distribute teams across groups (round-robin)
        const teamsPerGroup = Math.floor(teams!.length / groups_count);
        
        for (let i = 0; i < teams!.length; i++) {
          const groupIndex = i % groups_count;
          const group = createdGroups[groupIndex];
          
          await supabaseAdmin
            .from("teams")
            .update({ group_id: group.id })
            .eq("id", teams![i].id);
        }

        // Fetch groups with assigned teams
        const groupsWithTeams = await Promise.all(
          createdGroups.map(async (group) => {
            const { data: groupTeams } = await supabaseAdmin
              .from("teams")
              .select("*")
              .eq("group_id", group.id);

            return {
              ...group,
              teams: groupTeams || [],
            };
          })
        );

        const { matches: championshipMatches, rounds } = await generateChampionshipMatches(
          groupsWithTeams,
          courts!,
          start_date,
          end_date,
          duration_hours,
          event_id,
          organization_id,
          supabaseClient
        );
        matches.push(...championshipMatches);
        roundsCreated = rounds;
      }

      if (matches.length > 0) {
        const { error: matchesError } = await supabaseClient
          .from("matches")
          .insert(matches);

        if (matchesError) throw new Error(`Matches creation failed: ${matchesError.message}`);
        matchesCreated = matches.length;
      }

      // ─── Step 4: Insert Format Config ─────────────────────────────────────────

      const formatConfig: any = {
        event_id,
        format,
      };

      if (format === "tournament") {
        formatConfig.tournament_has_third_place = true;
        formatConfig.tournament_total_rounds = roundsCreated;
      } else if (format === "league") {
        formatConfig.league_legs = 1;
        formatConfig.league_points_win = 3;
        formatConfig.league_points_draw = 1;
        formatConfig.league_points_loss = 0;

        // Initialize standings for league
        const standingsToInsert = teams!.map((team: any) => ({
          event_id,
          team_id: team.id,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
          position: 0,
        }));

        await supabaseClient.from("standings").insert(standingsToInsert);
      } else if (format === "championship") {
        formatConfig.championship_groups_count = 0; // Will be updated based on created groups
        formatConfig.championship_teams_advance_per_group = 2;
        formatConfig.championship_has_playoffs = true;

        // Initialize standings for each group
        const { data: groups } = await supabaseClient
          .from("groups")
          .select("id")
          .eq("event_id", event_id);

        if (groups) {
          for (const group of groups) {
            const { data: groupTeams } = await supabaseClient
              .from("teams")
              .select("id")
              .eq("group_id", group.id);

            if (groupTeams) {
              const standingsToInsert = groupTeams.map((team: any) => ({
                event_id,
                team_id: team.id,
                group_id: group.id,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goals_for: 0,
                goals_against: 0,
                goal_difference: 0,
                points: 0,
                position: 0,
              }));

              await supabaseClient.from("standing").insert(standingsToInsert);
            }
          }
        }
      }

      const { error: configError } = await supabaseClient
        .from("event_format_config")
        .insert(formatConfig);

      if (configError) throw new Error(`Format config creation failed: ${configError.message}`);

      // ─── Step 5: Return Success ───────────────────────────────────────────────

      const response: GenerateScheduleResponse = {
        success: true,
        teams_created: teamsCreated,
        courts_created: courtsCreated,
        matches_created: matchesCreated,
        rounds_created: roundsCreated,
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stepError: any) {
      // Rollback: delete created data
      await supabaseClient.from("matches").delete().eq("event_id", event_id);
      await supabaseClient.from("standings").delete().eq("event_id", event_id);
      await supabaseClient.from("event_format_config").delete().eq("event_id", event_id);
      await supabaseClient.from("courts").delete().eq("event_id", event_id);
      await supabaseClient.from("teams").delete().eq("event_id", event_id);

      throw stepError;
    }
  } catch (error: any) {
    console.error("Error generating schedule:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        teams_created: 0,
        courts_created: 0,
        matches_created: 0,
        rounds_created: 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// ─── Tournament Match Generation ─────────────────────────────────────────────

function generateTournamentMatches(
  teams: any[],
  courts: any[],
  startDate: string,
  endDate: string | null,
  durationHours: number | null
) {
  const matches: any[] = [];
  const numTeams = teams.length;

  // Calculate number of rounds needed
  const totalRounds = Math.ceil(Math.log2(numTeams));
  const firstRoundMatches = Math.ceil(numTeams / 2);

  // Use teams in natural order (no shuffle) - Team A, Team B, Team C, Team D
  // Apply standard tournament seeding: highest seed vs lowest seed
  const seededTeams = [...teams]; // Keep original order

  // Create seeded pairings for first round
  // For 4 teams: 1 vs 4, 2 vs 3
  // For 8 teams: 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5
  const firstRoundPairings: Array<{ home: any; away: any | null }> = [];
  
  for (let i = 0; i < firstRoundMatches; i++) {
    const homeIndex = i;
    const awayIndex = numTeams - 1 - i;
    
    const homeTeam = seededTeams[homeIndex];
    const awayTeam = awayIndex < numTeams && awayIndex > homeIndex ? seededTeams[awayIndex] : null;
    
    firstRoundPairings.push({ home: homeTeam, away: awayTeam });
  }

  let currentRound = 1;
  let matchNumber = 1;
  let courtIndex = 0;

  // Generate first round with seeded pairings
  const roundLabel = getRoundLabel(currentRound, totalRounds);
  
  for (const pairing of firstRoundPairings) {
    matches.push({
      event_id: teams[0].event_id,
      organization_id: teams[0].organization_id,
      round_number: currentRound,
      round_label: roundLabel,
      match_number_in_round: matchNumber++,
      home_team_id: pairing.home.id,
      away_team_id: pairing.away?.id || null,
      court_id: courts[courtIndex % courts.length].id,
      scheduled_date: startDate,
      scheduled_time: null,
      status: "scheduled",
    });

    courtIndex++;
  }

  // Generate subsequent rounds (with TBD teams)
  let teamsInRound = Math.ceil(firstRoundMatches / 2);
  
  for (let round = 2; round <= totalRounds; round++) {
    matchNumber = 1;
    const roundLabel = getRoundLabel(round, totalRounds);

    for (let i = 0; i < teamsInRound; i++) {
      matches.push({
        event_id: teams[0].event_id,
        organization_id: teams[0].organization_id,
        round_number: round,
        round_label: roundLabel,
        match_number_in_round: matchNumber++,
        home_team_id: null, // TBD
        away_team_id: null, // TBD
        court_id: courts[courtIndex % courts.length].id,
        scheduled_date: startDate,
        scheduled_time: null,
        status: "scheduled",
      });

      courtIndex++;
    }

    teamsInRound = Math.ceil(teamsInRound / 2);
  }

  // Add third-place match
  matches.push({
    event_id: teams[0].event_id,
    organization_id: teams[0].organization_id,
    round_number: totalRounds,
    round_label: "Third Place",
    match_number_in_round: 999,
    home_team_id: null,
    away_team_id: null,
    court_id: courts[0].id,
    scheduled_date: startDate,
    scheduled_time: null,
    status: "scheduled",
  });

  return { matches, rounds: totalRounds };
}

function getRoundLabel(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round;
  
  if (roundsFromEnd === 0) return "Final";
  if (roundsFromEnd === 1) return "Semi-final";
  if (roundsFromEnd === 2) return "Quarter-final";
  
  return `Round ${round}`;
}

// ─── League Match Generation ─────────────────────────────────────────────────

function generateLeagueMatches(
  teams: any[],
  courts: any[],
  startDate: string,
  endDate: string | null,
  durationHours: number | null
) {
  const matches: any[] = [];
  const numTeams = teams.length;

  // Round-robin algorithm
  const rounds: any[][] = [];
  const teamsCopy = [...teams];

  // If odd number of teams, add a "bye" placeholder
  if (numTeams % 2 !== 0) {
    teamsCopy.push(null);
  }

  const totalTeams = teamsCopy.length;
  const numRounds = totalTeams - 1;
  const matchesPerRound = totalTeams / 2;

  // Generate round-robin schedule
  for (let round = 0; round < numRounds; round++) {
    const roundMatches: any[] = [];

    for (let match = 0; match < matchesPerRound; match++) {
      const home = (round + match) % (totalTeams - 1);
      const away = (totalTeams - 1 - match + round) % (totalTeams - 1);

      let homeTeam, awayTeam;

      if (match === 0) {
        homeTeam = teamsCopy[totalTeams - 1];
        awayTeam = teamsCopy[away];
      } else {
        homeTeam = teamsCopy[home];
        awayTeam = teamsCopy[away];
      }

      // Skip if either team is null (bye)
      if (homeTeam && awayTeam) {
        roundMatches.push({ home: homeTeam, away: awayTeam });
      }
    }

    rounds.push(roundMatches);
  }

  // Create match records
  let courtIndex = 0;

  rounds.forEach((roundMatches, roundIndex) => {
    roundMatches.forEach((match, matchIndex) => {
      matches.push({
        event_id: teams[0].event_id,
        organization_id: teams[0].organization_id,
        round_number: roundIndex + 1,
        round_label: `Matchday ${roundIndex + 1}`,
        match_number_in_round: matchIndex + 1,
        home_team_id: match.home.id,
        away_team_id: match.away.id,
        court_id: courts[courtIndex % courts.length].id,
        scheduled_date: startDate,
        scheduled_time: null,
        status: "scheduled",
      });

      courtIndex++;
    });
  });

  return { matches, rounds: numRounds };
}

// ─── Championship Match Generation ───────────────────────────────────────────

async function generateChampionshipMatches(
  groups: any[],
  courts: any[],
  startDate: string,
  endDate: string | null,
  durationHours: number | null,
  eventId: string,
  organizationId: string,
  supabaseClient: any
) {
  const matches: any[] = [];
  let courtIndex = 0;
  let totalRounds = 0;

  // ─── Phase 1: Group Stage (Round-Robin within each group) ────────────────

  for (const group of groups) {
    const groupTeams = group.teams;
    
    if (groupTeams.length < 2) continue;

    // Generate round-robin for this group
    const groupMatches: any[][] = [];
    const teamsCopy = [...groupTeams];

    // Add bye if odd number of teams
    if (teamsCopy.length % 2 !== 0) {
      teamsCopy.push(null);
    }

    const totalTeams = teamsCopy.length;
    const numRounds = totalTeams - 1;
    const matchesPerRound = totalTeams / 2;

    for (let round = 0; round < numRounds; round++) {
      const roundMatches: any[] = [];

      for (let match = 0; match < matchesPerRound; match++) {
        const home = (round + match) % (totalTeams - 1);
        const away = (totalTeams - 1 - match + round) % (totalTeams - 1);

        let homeTeam, awayTeam;

        if (match === 0) {
          homeTeam = teamsCopy[totalTeams - 1];
          awayTeam = teamsCopy[away];
        } else {
          homeTeam = teamsCopy[home];
          awayTeam = teamsCopy[away];
        }

        if (homeTeam && awayTeam) {
          roundMatches.push({ home: homeTeam, away: awayTeam });
        }
      }

      groupMatches.push(roundMatches);
    }

    // Create match records for this group
    groupMatches.forEach((roundMatches, roundIndex) => {
      roundMatches.forEach((match, matchIndex) => {
        matches.push({
          event_id: eventId,
          organization_id: organizationId,
          round_number: roundIndex + 1,
          round_label: `${group.name} - Matchday ${roundIndex + 1}`,
          match_number_in_round: matchIndex + 1,
          home_team_id: match.home.id,
          away_team_id: match.away.id,
          court_id: courts[courtIndex % courts.length].id,
          scheduled_date: startDate,
          scheduled_time: null,
          status: "scheduled",
          stage: "group",
          group_id: group.id,
        });

        courtIndex++;
      });
    });

    totalRounds = Math.max(totalRounds, numRounds);
  }

  // ─── Phase 2: Knockout Stage (Playoffs) ──────────────────────────────────

  // Calculate playoff teams (top 2 from each group typically)
  const teamsAdvancePerGroup = 2;
  const totalPlayoffTeams = groups.length * teamsAdvancePerGroup;

  // Generate playoff bracket structure (TBD teams)
  const playoffRounds = Math.ceil(Math.log2(totalPlayoffTeams));
  let teamsInRound = Math.ceil(totalPlayoffTeams / 2);

  for (let round = 1; round <= playoffRounds; round++) {
    const roundLabel = getPlayoffRoundLabel(round, playoffRounds);

    for (let matchNum = 1; matchNum <= teamsInRound; matchNum++) {
      matches.push({
        event_id: eventId,
        organization_id: organizationId,
        round_number: totalRounds + round,
        round_label: roundLabel,
        match_number_in_round: matchNum,
        home_team_id: null, // TBD from group winners
        away_team_id: null, // TBD from group winners
        court_id: courts[courtIndex % courts.length].id,
        scheduled_date: startDate,
        scheduled_time: null,
        status: "scheduled",
        stage: "playoff",
        group_id: null,
      });

      courtIndex++;
    }

    teamsInRound = Math.ceil(teamsInRound / 2);
  }

  totalRounds += playoffRounds;

  return { matches, rounds: totalRounds };
}

function getPlayoffRoundLabel(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round;
  
  if (roundsFromEnd === 0) return "Final";
  if (roundsFromEnd === 1) return "Semi-final";
  if (roundsFromEnd === 2) return "Quarter-final";
  
  return `Playoff Round ${round}`;
}
