// ─── Enums ───────────────────────────────────────────────────────────────────

export type Sport =
  | "table_tennis"
  | "tennis"
  | "badminton"
  | "cricket"
  | "football"
  | "pickleball";

export type EventFormat =
  | "tournament"
  | "league"
  | "championship";

export type PlayerType = "individual" | "team";

export type EventStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled";

export type MatchStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";

export type UserRole = "admin" | "staff" | "viewer";

// ─── Format Configs ───────────────────────────────────────────────────────────

export interface TournamentConfig {
  tournament_has_third_place: boolean;
  tournament_total_rounds: number;
}

export interface LeagueConfig {
  league_points_win: number;
  league_points_draw: number;
  league_points_loss: number;
  league_legs: number;
}

export interface ChampionshipConfig {
  championship_groups_count: number;
  championship_teams_advance_per_group: number;
  championship_has_playoffs: boolean;
}

export type FormatConfig = TournamentConfig | LeagueConfig | ChampionshipConfig;

// ─── Database Types ───────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  organization_id: string;
  name: string;
  sport: Sport;
  format: EventFormat;
  player_type: PlayerType;
  status: EventStatus;
  venue: string | null;
  description: string | null;
  max_participants: number;
  start_date: string;
  end_date: string | null;
  duration_hours: number | null;
  registered_count: number;
  courts_count: number;
  teams_count: number;
  players_per_team: number | null;
  rounds_per_match: number;
  created_at: string;
  updated_at: string;
}

export interface Court {
  id: string;
  event_id: string;
  organization_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  organization_id: string;
  name: string;
  player_count: number;
  colour_hex: string;
  group_id: string | null;
  access_code: string;
  created_at: string;
}

export interface TeamCaptainSession {
  id: string;
  team_id: string;
  member_id: string | null;
  access_code: string;
  device_id: string | null;
  last_active_at: string;
  created_at: string;
}

export interface CaptainTeamDetails {
  team_id: string;
  team_name: string;
  team_color: string;
  access_code: string;
  event_id: string;
  event_name: string;
  event_sport: Sport;
  event_format: EventFormat;
  event_status: EventStatus;
  captain_id: string | null;
  captain_name: string | null;
  team_members_count: number;
  upcoming_matches_count: number;
  completed_matches_count: number;
}

export interface Member {
  id: string;
  event_id: string;
  organization_id: string;
  name: string;
  age: number;
  team_id: string | null;
  role: "captain" | "player" | "substitute" | null;
  created_at: string;
}

export interface MemberWithTeam extends Member {
  team?: {
    id: string;
    name: string;
    colour_hex: string;
  } | null;
}

export interface Match {
  id: string;
  event_id: string;
  organization_id: string;
  round_number: number;
  round_label: string;
  match_number_in_round: number;
  home_team_id: string | null;
  away_team_id: string | null;
  court_id: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  is_draw: boolean;
  notes: string | null;
  group_id: string | null;
  stage: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchRound {
  id: string;
  match_id: string;
  round_number: number;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  is_draw: boolean;
  status: MatchStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchParticipant {
  id: string;
  match_id: string;
  team_id: string;
  member_id: string;
  created_at: string;
}

export interface Standing {
  id: string;
  event_id: string;
  team_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  position: number;
  group_id: string | null;
  updated_at: string;
}

export interface EventFormatConfig {
  id: string;
  event_id: string;
  format: EventFormat;
  tournament_has_third_place?: boolean;
  tournament_total_rounds?: number;
  league_legs?: number;
  league_points_win?: number;
  league_points_draw?: number;
  league_points_loss?: number;
  championship_groups_count?: number;
  championship_teams_advance_per_group?: number;
  championship_has_playoffs?: boolean;
  created_at: string;
}

// ─── App-level helpers ────────────────────────────────────────────────────────

export interface SportMeta {
  sport: Sport;
  label: string;
  emoji: string;
  accent: string;
  maxParticipants: number;
  supportsIndividual: boolean;
  supportsTeam: boolean;
  scoringHint: string;
  formats: EventFormat[];
}

export interface FormatMeta {
  format: EventFormat;
  label: string;
  description: string;
}

// ─── Extended / joined types ──────────────────────────────────────────────────

export interface EventWithDetails extends Event {
  teams: Team[];
  matches: Match[];
  courts: Court[];
  format_config: EventFormatConfig | null;
}

export interface MatchWithTeams extends Match {
  home_team: Team | null;
  away_team: Team | null;
  court: Court | null;
  event: Event;
  match_rounds?: MatchRound[];
  match_participants?: (MatchParticipant & { member: Member })[];
}

export interface StandingWithTeam extends Standing {
  team: Team;
}

export interface DashboardStats {
  eventsThisMonth: number;
  matchesToday: number;
  matchesThisWeek: number;
  activeEvents: number;
  upcomingEvents: Event[];
  recentMatches: MatchWithTeams[];
}

export interface Group {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface GroupWithTeams extends Group {
  teams: Team[];
}
