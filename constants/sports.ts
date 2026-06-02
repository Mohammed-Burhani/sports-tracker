import { SportMeta, FormatMeta } from "@/types";
import { colors } from "@/constants/theme";

export const SPORTS: SportMeta[] = [
  {
    sport: "table_tennis",
    label: "Table Tennis",
    emoji: "🏓",
    accent: colors.sport.tableTennis.accent,
    maxParticipants: 32,
    supportsIndividual: true,
    supportsTeam: true,
    scoringHint: "Sets of 11 points. Win by 2.",
    formats: ["tournament", "league", "championship"],
  },
  {
    sport: "tennis",
    label: "Tennis",
    emoji: "🎾",
    accent: colors.sport.tennis.accent,
    maxParticipants: 64,
    supportsIndividual: true,
    supportsTeam: true,
    scoringHint: "Games, sets, and matches. Tiebreak at 6–6.",
    formats: ["tournament", "league", "championship"],
  },
  {
    sport: "badminton",
    label: "Badminton",
    emoji: "🏸",
    accent: colors.sport.badminton.accent,
    maxParticipants: 32,
    supportsIndividual: true,
    supportsTeam: true,
    scoringHint: "Best of 3 sets to 21. Win by 2.",
    formats: ["tournament", "league", "championship"],
  },
  {
    sport: "cricket",
    label: "Cricket",
    emoji: "🏏",
    accent: colors.sport.cricket.accent,
    maxParticipants: 22,
    supportsIndividual: false,
    supportsTeam: true,
    scoringHint: "Runs per innings. Lower total follows on.",
    formats: ["tournament", "league", "championship"],
  },
  {
    sport: "football",
    label: "Football",
    emoji: "⚽",
    accent: colors.sport.football.accent,
    maxParticipants: 22,
    supportsIndividual: false,
    supportsTeam: true,
    scoringHint: "Goals in 90 min. Extra time and pens if needed.",
    formats: ["tournament", "league", "championship"],
  },
  {
    sport: "pickleball",
    label: "Pickleball",
    emoji: "🥒",
    accent: colors.sport.pickleball.accent,
    maxParticipants: 16,
    supportsIndividual: true,
    supportsTeam: true,
    scoringHint: "First to 11, win by 2. Kitchen rules apply.",
    formats: ["tournament", "league", "championship"],
  },
];

export const FORMATS: FormatMeta[] = [
  {
    format: "tournament",
    label: "Tournament",
    description: "Knockout bracket — single elimination with optional third-place match.",
  },
  {
    format: "league",
    label: "League",
    description: "Round-robin standings with points system.",
  },
  {
    format: "championship",
    label: "Championship",
    description: "Group stage followed by knockout playoffs.",
  },
];

export function getSportMeta(sport: string): SportMeta {
  return SPORTS.find((s) => s.sport === sport) ?? SPORTS[0];
}

export function getFormatMeta(format: string): FormatMeta {
  return FORMATS.find((f) => f.format === format) ?? FORMATS[0];
}
