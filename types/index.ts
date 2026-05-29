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
  | "open_play"
  | "training"
  | "friendly"
  | "championship";

export type PlayerType = "individual" | "team";

export type EventStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled";

export type SessionStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";

export type UserRole = "admin" | "staff" | "viewer";

export type ParticipantResult = "win" | "loss" | "draw" | "dnf";

export type EntityType = "player" | "team";

// ─── Format Configs ───────────────────────────────────────────────────────────

export interface TournamentConfig {
  bracket_type: "single" | "double";
  seeded: boolean;
  total_rounds: number;
  rounds_completed: number;
}

export interface LeagueConfig {
  points_win: number;
  points_draw: number;
  points_loss: number;
  number_of_legs: number;
}

export interface OpenPlayConfig {
  court_rotation_interval_minutes: number;
  simultaneous_courts: number;
}

export interface TrainingConfig {
  coach_name: string;
  drills: string[];
}

export interface FriendlyConfig {
  sets_or_periods: number;
  scoring_format: string;
}

export interface ChampionshipConfig {
  qualifying_rounds: number;
  has_semi_finals: boolean;
  has_third_place_match: boolean;
}

export type FormatConfig =
  | TournamentConfig
  | LeagueConfig
  | OpenPlayConfig
  | TrainingConfig
  | FriendlyConfig
  | ChampionshipConfig;

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
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  name: string;
  session_number: number;
  status: SessionStatus;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_hours: number;
  venue_area: string | null;
  max_participants: number | null;
  notes: string | null;
  format_config: FormatConfig | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  colour_hex: string;
  logo_url: string | null;
  captain_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  entity_type: EntityType;
  entity_id: string;
  checked_in: boolean;
  check_in_time: string | null;
  position: number | null;
  score: string | null;
  result: ParticipantResult | null;
  notes: string | null;
}

export interface PlayerCount {
  id: string;
  session_id: string;
  expected_count: number;
  actual_count: number;
  checked_in_count: number;
  updated_at: string;
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

export interface EventWithSessions extends Event {
  sessions: Session[];
  teams: Team[];
}

export interface SessionWithEvent extends Session {
  event: Event;
  player_counts: PlayerCount | null;
}

export interface DashboardStats {
  eventsThisMonth: number;
  sessionsToday: number;
  totalRegisteredParticipants: number;
  upcomingEvents: Event[];
  ongoingEvents: Event[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  session_id: string;
  session_name: string;
  event_name: string;
  sport: Sport;
  status: SessionStatus;
  changed_at: string;
}
