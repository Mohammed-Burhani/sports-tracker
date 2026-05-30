import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { X } from "lucide-react-native";
import { MatchWithTeams, MatchStatus } from "@/types";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { useUpdateMatchResult } from "@/hooks/useMatches";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

interface MatchResultSheetProps {
  visible: boolean;
  match: MatchWithTeams | null;
  onClose: () => void;
  format?: "tournament" | "league";
}

export function MatchResultSheet({ visible, match, onClose, format = "league" }: MatchResultSheetProps) {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [status, setStatus] = useState<MatchStatus>("scheduled");
  const updateResult = useUpdateMatchResult();

  useEffect(() => {
    if (match) {
      setHomeScore(match.home_score?.toString() || "");
      setAwayScore(match.away_score?.toString() || "");
      setStatus(match.status);
    }
  }, [match]);

  if (!match) return null;

  async function handleSave() {
    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
      showErrorToast("Please enter valid scores");
      return;
    }

    if (homeScoreNum < 0 || awayScoreNum < 0) {
      showErrorToast("Scores cannot be negative");
      return;
    }

    try {
      let winnerId: string | null = null;
      let isDraw = false;

      if (status === "completed") {
        if (homeScoreNum > awayScoreNum) {
          winnerId = match.home_team_id;
        } else if (awayScoreNum > homeScoreNum) {
          winnerId = match.away_team_id;
        } else {
          isDraw = true;
        }
      }

      await updateResult.mutateAsync({
        id: match.id,
        eventId: match.event_id,
        eventFormat: match.event.format,
        payload: {
          home_score: homeScoreNum,
          away_score: awayScoreNum,
          status,
          winner_team_id: winnerId,
          is_draw: isDraw,
        },
      });

      showSuccessToast("Match result saved");
      onClose();
    } catch (error) {
      showErrorToast("Failed to save result");
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Match Result</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Match Info */}
          <View style={styles.matchInfo}>
            <Text style={styles.roundLabel}>{match.round_label}</Text>
            <Text style={styles.dateText}>{match.scheduled_date}</Text>
          </View>

          {/* Score Inputs */}
          <View style={styles.scoresContainer}>
            {/* Home Team */}
            <View style={styles.teamScoreRow}>
              <View style={styles.teamInfo}>
                {match.home_team && (
                  <View
                    style={[
                      styles.teamDot,
                      { backgroundColor: match.home_team.colour_hex },
                    ]}
                  />
                )}
                <Text style={styles.teamName}>
                  {match.home_team?.name || "TBD"}
                </Text>
              </View>
              <TextInput
                style={styles.scoreInput}
                value={homeScore}
                onChangeText={setHomeScore}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <Text style={styles.vs}>vs</Text>

            {/* Away Team */}
            <View style={styles.teamScoreRow}>
              <View style={styles.teamInfo}>
                {match.away_team && (
                  <View
                    style={[
                      styles.teamDot,
                      { backgroundColor: match.away_team.colour_hex },
                    ]}
                  />
                )}
                <Text style={styles.teamName}>
                  {match.away_team?.name || "TBD"}
                </Text>
              </View>
              <TextInput
                style={styles.scoreInput}
                value={awayScore}
                onChangeText={setAwayScore}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          {/* Status Selector */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionLabel}>Status</Text>
            <View style={styles.statusGrid}>
              {(["scheduled", "ongoing", "completed", "cancelled"] as MatchStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.statusChip,
                    status === s && styles.statusChipActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      status === s && styles.statusChipTextActive,
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            activeOpacity={0.8}
            disabled={updateResult.isPending}
          >
            <Text style={styles.saveButtonText}>
              {updateResult.isPending ? "Saving..." : "Save Result"}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  matchInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  roundLabel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  dateText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  scoresContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  teamScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamName: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 16,
  },
  scoreInput: {
    width: 80,
    height: 56,
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...typography.hero,
    color: colors.textPrimary,
    textAlign: "center",
    fontSize: 28,
  },
  vs: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: "center",
    fontWeight: "600",
  },
  statusSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  statusChipText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontSize: 13,
  },
  statusChipTextActive: {
    color: colors.accentInk,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  saveButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
    fontSize: 16,
  },
});
