import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { X, User, ShieldCheck } from "lucide-react-native";
import { MatchWithTeams, MatchStatus, MatchRound, Member } from "@/types";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { useUpdateMatchResult } from "@/hooks/useMatches";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { updateMatchRounds } from "@/lib/api/matches";
import { getMembersByTeam } from "@/lib/api/members";

interface MatchResultSheetProps {
  visible: boolean;
  match: MatchWithTeams | null;
  onClose: () => void;
  format?: "tournament" | "league";
  captainTeamId?: string; // If provided, restrict editing to this team only
}

export function MatchResultSheet({ visible, match, onClose, format = "league", captainTeamId }: MatchResultSheetProps) {
  const [rounds, setRounds] = useState<Array<{
    id?: string;
    round_number: number;
    home_score: string;
    away_score: string;
    status: MatchStatus;
  }>>([]);
  const [overallStatus, setOverallStatus] = useState<MatchStatus>("scheduled");
  const [homeMembers, setHomeMembers] = useState<Member[]>([]);
  const [awayMembers, setAwayMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const updateResult = useUpdateMatchResult();

  useEffect(() => {
    if (match) {
      const roundsPerMatch = match.event.rounds_per_match || 1;
      
      if (match.match_rounds && match.match_rounds.length > 0) {
        setRounds(
          match.match_rounds
            .sort((a, b) => a.round_number - b.round_number)
            .map((r: MatchRound) => ({
              id: r.id,
              round_number: r.round_number,
              home_score: r.home_score?.toString() || "",
              away_score: r.away_score?.toString() || "",
              status: r.status,
            }))
        );
      } else {
        setRounds(
          Array.from({ length: roundsPerMatch }, (_, i) => ({
            round_number: i + 1,
            home_score: "",
            away_score: "",
            status: "scheduled" as MatchStatus,
          }))
        );
      }
      setOverallStatus(match.status);

      // Fetch members for both teams
      loadTeamMembers();
    }
  }, [match]);

  async function loadTeamMembers() {
    if (!match) return;
    
    setLoadingMembers(true);
    try {
      if (match.home_team_id) {
        const home = await getMembersByTeam(match.home_team_id);
        setHomeMembers(home);
      }
      if (match.away_team_id) {
        const away = await getMembersByTeam(match.away_team_id);
        setAwayMembers(away);
      }
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setLoadingMembers(false);
    }
  }

  if (!match) return null;

  // Determine if user is a captain and which team
  const isCaptain = !!captainTeamId;
  const canEditHomeScore = !isCaptain || captainTeamId === match.home_team_id;
  const canEditAwayScore = !isCaptain || captainTeamId === match.away_team_id;

  const homeParticipants = homeMembers.sort((a, b) => {
    const roleOrder = { captain: 0, player: 1, substitute: 2, null: 3 };
    return (roleOrder[a.role || "null"] || 3) - (roleOrder[b.role || "null"] || 3);
  });
  
  const awayParticipants = awayMembers.sort((a, b) => {
    const roleOrder = { captain: 0, player: 1, substitute: 2, null: 3 };
    return (roleOrder[a.role || "null"] || 3) - (roleOrder[b.role || "null"] || 3);
  });

  async function handleSave() {
    // Auto-mark rounds as completed if they have scores
    const updatedRounds = rounds.map(round => {
      const homeScore = parseInt(round.home_score);
      const awayScore = parseInt(round.away_score);
      
      if (!isNaN(homeScore) && !isNaN(awayScore)) {
        return { ...round, status: "completed" as MatchStatus };
      }
      return round;
    });

    for (const round of updatedRounds) {
      const homeScore = parseInt(round.home_score);
      const awayScore = parseInt(round.away_score);

      if (round.status === "completed" && (isNaN(homeScore) || isNaN(awayScore))) {
        showErrorToast(`Round ${round.round_number}: Enter valid scores`);
        return;
      }

      if (!isNaN(homeScore) && homeScore < 0) {
        showErrorToast(`Round ${round.round_number}: Scores cannot be negative`);
        return;
      }
      if (!isNaN(awayScore) && awayScore < 0) {
        showErrorToast(`Round ${round.round_number}: Scores cannot be negative`);
        return;
      }
    }

    try {
      await updateMatchRounds(
        match.id,
        updatedRounds.map((r) => ({
          id: r.id,
          round_number: r.round_number,
          home_score: r.home_score ? parseInt(r.home_score) : null,
          away_score: r.away_score ? parseInt(r.away_score) : null,
          status: r.status,
        }))
      );

      let homeWins = 0;
      let awayWins = 0;
      let totalHomeScore = 0;
      let totalAwayScore = 0;

      for (const round of updatedRounds) {
        const homeScore = parseInt(round.home_score) || 0;
        const awayScore = parseInt(round.away_score) || 0;
        
        totalHomeScore += homeScore;
        totalAwayScore += awayScore;

        if (round.status === "completed") {
          if (homeScore > awayScore) homeWins++;
          else if (awayScore > homeScore) awayWins++;
        }
      }

      // Auto-determine winner and status
      let winnerId: string | null = null;
      let isDraw = false;
      let finalStatus = overallStatus;

      // If all rounds are completed, mark match as completed
      const allRoundsCompleted = updatedRounds.every(r => r.status === "completed");
      if (allRoundsCompleted && updatedRounds.length > 0) {
        finalStatus = "completed";
        
        if (homeWins > awayWins) {
          winnerId = match.home_team_id;
        } else if (awayWins > homeWins) {
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
          home_score: totalHomeScore,
          away_score: totalAwayScore,
          status: finalStatus,
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

  function updateRoundScore(roundIndex: number, field: "home_score" | "away_score", value: string) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex ? { ...r, [field]: value } : r
      )
    );
  }

  function updateRoundStatus(roundIndex: number, status: MatchStatus) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex ? { ...r, status } : r
      )
    );
  }

  function getRoleIcon(role: string | null) {
    if (role === "captain") return <ShieldCheck size={12} color={colors.accent} strokeWidth={2.5} />;
    if (role === "player") return <User size={12} color={colors.textTertiary} strokeWidth={2} />;
    return null;
  }

  function getRoleLabel(role: string | null) {
    if (role === "captain") return "C";
    if (role === "substitute") return "SUB";
    return null;
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
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{match.round_label}</Text>
              <Text style={styles.headerMeta}>{match.scheduled_date}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Teams with squads */}
            <View style={styles.teamsSection}>
              {/* Home Team */}
              <View style={styles.teamBlock}>
                <View style={styles.teamHeader}>
                  {match.home_team && (
                    <View
                      style={[
                        styles.teamIndicator,
                        { backgroundColor: match.home_team.colour_hex },
                      ]}
                    />
                  )}
                  <Text style={styles.teamName}>
                    {match.home_team?.name || "TBD"}
                  </Text>
                </View>
                {homeParticipants.length > 0 && (
                  <View style={styles.squadList}>
                    {homeParticipants.map((member) => (
                      <View key={member.id} style={styles.memberRow}>
                        <View style={styles.memberInfo}>
                          {getRoleIcon(member.role)}
                          <Text style={styles.memberName}>{member.name}</Text>
                        </View>
                        {getRoleLabel(member.role) && (
                          <View style={[
                            styles.roleBadge,
                            member.role === "captain" && styles.roleBadgeCaptain,
                            member.role === "substitute" && styles.roleBadgeSub,
                          ]}>
                            <Text style={[
                              styles.roleText,
                              member.role === "captain" && styles.roleTextCaptain,
                            ]}>
                              {getRoleLabel(member.role)}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                {homeParticipants.length === 0 && !loadingMembers && (
                  <Text style={styles.noSquad}>No members in this team</Text>
                )}
                {loadingMembers && (
                  <Text style={styles.loadingText}>Loading...</Text>
                )}
              </View>

              {/* Away Team */}
              <View style={styles.teamBlock}>
                <View style={styles.teamHeader}>
                  {match.away_team && (
                    <View
                      style={[
                        styles.teamIndicator,
                        { backgroundColor: match.away_team.colour_hex },
                      ]}
                    />
                  )}
                  <Text style={styles.teamName}>
                    {match.away_team?.name || "TBD"}
                  </Text>
                </View>
                {awayParticipants.length > 0 && (
                  <View style={styles.squadList}>
                    {awayParticipants.map((member) => (
                      <View key={member.id} style={styles.memberRow}>
                        <View style={styles.memberInfo}>
                          {getRoleIcon(member.role)}
                          <Text style={styles.memberName}>{member.name}</Text>
                        </View>
                        {getRoleLabel(member.role) && (
                          <View style={[
                            styles.roleBadge,
                            member.role === "captain" && styles.roleBadgeCaptain,
                            member.role === "substitute" && styles.roleBadgeSub,
                          ]}>
                            <Text style={[
                              styles.roleText,
                              member.role === "captain" && styles.roleTextCaptain,
                            ]}>
                              {getRoleLabel(member.role)}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                {awayParticipants.length === 0 && !loadingMembers && (
                  <Text style={styles.noSquad}>No members in this team</Text>
                )}
                {loadingMembers && (
                  <Text style={styles.loadingText}>Loading...</Text>
                )}
              </View>
            </View>

            {/* Rounds */}
            <View style={styles.roundsSection}>
              <Text style={styles.sectionLabel}>Score by Round</Text>
              {rounds.map((round, index) => (
                <View key={round.round_number} style={styles.roundRow}>
                  <Text style={styles.roundNumber}>{round.round_number}</Text>
                  
                  <View style={styles.roundInputs}>
                    <TextInput
                      style={[
                        styles.scoreInput,
                        !canEditHomeScore && styles.scoreInputDisabled
                      ]}
                      value={round.home_score}
                      onChangeText={(v) => updateRoundScore(index, "home_score", v)}
                      keyboardType="number-pad"
                      placeholder="—"
                      placeholderTextColor={colors.textTertiary}
                      editable={canEditHomeScore}
                    />
                    <Text style={styles.scoreSeparator}>:</Text>
                    <TextInput
                      style={[
                        styles.scoreInput,
                        !canEditAwayScore && styles.scoreInputDisabled
                      ]}
                      value={round.away_score}
                      onChangeText={(v) => updateRoundScore(index, "away_score", v)}
                      keyboardType="number-pad"
                      placeholder="—"
                      placeholderTextColor={colors.textTertiary}
                      editable={canEditAwayScore}
                    />
                  </View>

                  <View style={styles.roundStatus}>
                    <TouchableOpacity
                      onPress={() => updateRoundStatus(index, round.status === "completed" ? "scheduled" : "completed")}
                      style={[
                        styles.statusToggle,
                        round.status === "completed" && styles.statusToggleActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.statusToggleText,
                        round.status === "completed" && styles.statusToggleTextActive,
                      ]}>
                        {round.status === "completed" ? "Done" : "Pending"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Match Status - Hidden for captains */}
            {!isCaptain && (
              <View style={styles.statusSection}>
                <Text style={styles.sectionLabel}>Match Status</Text>
                <View style={styles.statusPickerContainer}>
                  <Picker
                    selectedValue={overallStatus}
                    onValueChange={(value) => setOverallStatus(value as MatchStatus)}
                    style={styles.statusPicker}
                  >
                    <Picker.Item label="Scheduled" value="scheduled" />
                    <Picker.Item label="Ongoing" value="ongoing" />
                    <Picker.Item label="Completed" value="completed" />
                    <Picker.Item label="Cancelled" value="cancelled" />
                  </Picker>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton,
                updateResult.isPending && styles.saveButtonLoading,
              ]}
              activeOpacity={0.8}
              disabled={updateResult.isPending}
            >
              <Text style={styles.saveButtonText}>
                {updateResult.isPending ? "Saving..." : "Save Result"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(33, 28, 22, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    maxHeight: "92%",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  headerMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  scrollContainer: {
    maxHeight: 480,
  },
  teamsSection: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  teamBlock: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  teamIndicator: {
    width: 3,
    height: 16,
    borderRadius: radius.sm,
  },
  teamName: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  squadList: {
    gap: 6,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  memberName: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.inputFill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleBadgeCaptain: {
    backgroundColor: `${colors.accent}15`,
    borderColor: `${colors.accent}30`,
  },
  roleBadgeSub: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.borderStrong,
  },
  roleText: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  roleTextCaptain: {
    color: colors.accent,
  },
  noSquad: {
    ...typography.caption,
    color: colors.textTertiary,
    fontStyle: "italic",
    paddingVertical: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textTertiary,
    paddingVertical: spacing.sm,
  },
  roundsSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  roundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roundNumber: {
    ...typography.bodyBold,
    color: colors.textTertiary,
    width: 20,
  },
  roundInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  scoreInput: {
    width: 48,
    height: 40,
    backgroundColor: colors.inputFill,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.heading,
    color: colors.textPrimary,
    textAlign: "center",
    fontSize: 18,
  },
  scoreInputDisabled: {
    backgroundColor: colors.base,
    color: colors.textTertiary,
    opacity: 0.6,
  },
  scoreSeparator: {
    ...typography.body,
    color: colors.textTertiary,
  },
  roundStatus: {
    width: 72,
  },
  statusToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.base,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  statusToggleActive: {
    backgroundColor: `${colors.success}15`,
    borderColor: `${colors.success}40`,
  },
  statusToggleText: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: "600",
  },
  statusToggleTextActive: {
    color: colors.success,
  },
  statusSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusPickerContainer: {
    backgroundColor: colors.inputFill,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  statusPicker: {
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonLoading: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
    fontSize: 16,
  },
});
