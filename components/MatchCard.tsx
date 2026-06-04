import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { MatchWithTeams } from "@/types";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";
import { Trophy } from "lucide-react-native";

interface MatchCardProps {
  match: MatchWithTeams;
  onPress?: () => void;
  onMarkWin?: (teamId: string) => void;
  compact?: boolean;
  format?: "tournament" | "league";
}

export function MatchCard({ 
  match, 
  onPress, 
  onMarkWin,
  compact = false,
  format = "tournament"
}: MatchCardProps) {
  const isTBD = !match.home_team_id || !match.away_team_id;
  const isCompleted = match.status === "completed";
  const isScheduled = match.status === "scheduled";
  const canMark = !isCompleted && !isTBD && (onMarkWin || onPress);

  // Calculate rounds won from match_rounds
  let homeRoundsWon = 0;
  let awayRoundsWon = 0;
  
  if (match.match_rounds && match.match_rounds.length > 0) {
    match.match_rounds.forEach((round) => {
      if (round.status === "completed" && round.home_score !== null && round.away_score !== null) {
        if (round.home_score > round.away_score) homeRoundsWon++;
        else if (round.away_score > round.home_score) awayRoundsWon++;
      }
    });
  }

  function handleMarkWin(teamId: string, e: any) {
    console.log('MatchCard handleMarkWin:', { teamId, matchId: match.id });
    e.stopPropagation();
    if (onMarkWin) {
      console.log('Calling onMarkWin callback');
      onMarkWin(teamId);
    } else {
      console.error('onMarkWin callback not provided');
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card, 
        shadows.card,
        isTBD && styles.cardTBD,
        compact && styles.cardCompact
      ]}
      activeOpacity={0.8}
      disabled={!onPress && !canMark}
    >
      {/* Header - Status dot only, no round label */}
      <View style={styles.header}>
        {!isTBD && (
          <View style={[
            styles.statusDot,
            isCompleted && styles.statusDotCompleted,
            isScheduled && styles.statusDotScheduled,
            match.status === "ongoing" && styles.statusDotOngoing,
          ]} />
        )}
        {isTBD && (
          <View style={styles.tbdBadge}>
            <Text style={styles.tbdBadgeText}>Will be updated automatically</Text>
          </View>
        )}
      </View>

      {/* Teams */}
      <View style={[styles.teamsContainer, isTBD && styles.teamsContainerTBD]}>
        {/* Home Team */}
        <View style={[
          styles.teamRow,
          isCompleted && match.winner_team_id === match.home_team_id && styles.teamRowWinner,
          isCompleted && match.winner_team_id !== match.home_team_id && !match.is_draw && styles.teamRowLoser,
        ]}>
          <View style={styles.teamInfo}>
            {match.home_team ? (
              <>
                <View
                  style={[
                    styles.teamDot,
                    { backgroundColor: match.home_team.colour_hex },
                  ]}
                />
                <Text style={[
                  styles.teamName,
                  isCompleted && match.winner_team_id === match.home_team_id && styles.teamNameWinner,
                ]}>
                  {match.home_team.name}
                </Text>
              </>
            ) : (
              <Text style={[styles.teamName, styles.teamNameTBD]}>
                TBD
              </Text>
            )}
          </View>
          
          {/* Score or Actions */}
          {isCompleted && (
            <View style={styles.scoreContainer}>
              <Text
                style={[
                  styles.score,
                  match.winner_team_id === match.home_team_id && styles.scoreWinner,
                ]}
              >
                {homeRoundsWon}
              </Text>
              {match.winner_team_id === match.home_team_id && (
                <Trophy size={14} color={colors.success} strokeWidth={2.5} />
              )}
              <Text style={styles.roundsLabel}>rounds</Text>
            </View>
          )}
          
          {canMark && format === "tournament" && !isTBD && (
            <Pressable
              onPress={(e) => match.home_team_id && handleMarkWin(match.home_team_id, e)}
              style={({ pressed }) => [
                styles.wonButton,
                pressed && styles.wonButtonPressed,
              ]}
            >
              <Trophy size={12} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.wonButtonText}>Won</Text>
            </Pressable>
          )}
          
          {canMark && format === "league" && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreInputHint}>Tap to enter</Text>
            </View>
          )}
        </View>

        <View style={styles.vsContainer}>
          <View style={styles.vsLine} />
          <Text style={styles.vs}>vs</Text>
          <View style={styles.vsLine} />
        </View>

        {/* Away Team */}
        <View style={[
          styles.teamRow,
          isCompleted && match.winner_team_id === match.away_team_id && styles.teamRowWinner,
          isCompleted && match.winner_team_id !== match.away_team_id && !match.is_draw && styles.teamRowLoser,
        ]}>
          <View style={styles.teamInfo}>
            {match.away_team ? (
              <>
                <View
                  style={[
                    styles.teamDot,
                    { backgroundColor: match.away_team.colour_hex },
                  ]}
                />
                <Text style={[
                  styles.teamName,
                  isCompleted && match.winner_team_id === match.away_team_id && styles.teamNameWinner,
                ]}>
                  {match.away_team.name}
                </Text>
              </>
            ) : (
              <Text style={[styles.teamName, styles.teamNameTBD]}>
                TBD
              </Text>
            )}
          </View>
          
          {/* Score or Actions */}
          {isCompleted && (
            <View style={styles.scoreContainer}>
              <Text
                style={[
                  styles.score,
                  match.winner_team_id === match.away_team_id && styles.scoreWinner,
                ]}
              >
                {awayRoundsWon}
              </Text>
              {match.winner_team_id === match.away_team_id && (
                <Trophy size={14} color={colors.success} strokeWidth={2.5} />
              )}
              <Text style={styles.roundsLabel}>rounds</Text>
            </View>
          )}
          
          {canMark && format === "tournament" && !isTBD && (
            <Pressable
              onPress={(e) => match.away_team_id && handleMarkWin(match.away_team_id, e)}
              style={({ pressed }) => [
                styles.wonButton,
                pressed && styles.wonButtonPressed,
              ]}
            >
              <Trophy size={12} color={colors.success} strokeWidth={2.5} />
              <Text style={styles.wonButtonText}>Won</Text>
            </Pressable>
          )}
          
          {canMark && format === "league" && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreInputHint}>Tap to enter</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      {!compact && (
        <View style={styles.footer}>
          {match.court && (
            <Text style={styles.courtText}>{match.court.name}</Text>
          )}
          <Text style={styles.dateText}>{match.scheduled_date}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTBD: {
    backgroundColor: colors.inputFill,
    borderStyle: "dashed",
    borderWidth: 1.5,
    opacity: 0.5,
  },
  cardCompact: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: spacing.md,
    minHeight: 20,
  },
  roundLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  roundLabelMuted: {
    color: colors.textTertiary,
  },
  tbdBadge: {
    backgroundColor: `${colors.info}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tbdBadgeText: {
    ...typography.small,
    color: colors.info,
    fontSize: 10,
    fontWeight: "600",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotScheduled: {
    backgroundColor: colors.info,
  },
  statusDotOngoing: {
    backgroundColor: colors.warning,
  },
  statusDotCompleted: {
    backgroundColor: colors.success,
  },
  teamsContainer: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  teamsContainerTBD: {
    opacity: 1, // Override since parent already has opacity
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    minHeight: 44,
  },
  teamRowWinner: {
    backgroundColor: `${colors.success}08`,
    borderWidth: 1,
    borderColor: `${colors.success}20`,
  },
  teamRowLoser: {
    opacity: 0.6,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  teamDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  teamName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  teamNameTBD: {
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  teamNameWinner: {
    color: colors.success,
    fontWeight: "700",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  score: {
    ...typography.heading,
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: "700",
    minWidth: 32,
    textAlign: "right",
  },
  scoreWinner: {
    color: colors.success,
  },
  roundsLabel: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 9,
  },
  scoreInputHint: {
    ...typography.small,
    color: colors.accent,
    fontWeight: "600",
    fontSize: 11,
  },
  wonButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: `${colors.success}10`,
    borderColor: `${colors.success}30`,
  },
  wonButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  wonButtonText: {
    ...typography.small,
    color: colors.success,
    fontWeight: "700",
    fontSize: 12,
  },
  vsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  vs: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  courtText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  dateText: {
    ...typography.small,
    color: colors.textTertiary,
  },
});
