import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { X, User, ShieldCheck, Users as UsersIcon } from "lucide-react-native";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { Team, Member } from "@/types";
import { getMembersByTeam } from "@/lib/api/members";
import { updateMember } from "@/lib/api/members";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

interface TeamSheetProps {
  visible: boolean;
  team: Team | null;
  maxPlayers: number | null;
  onClose: () => void;
  onMembersUpdated: () => void;
}

export function TeamSheet({
  visible,
  team,
  maxPlayers,
  onClose,
  onMembersUpdated,
}: TeamSheetProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (visible && team) {
      loadMembers();
    }
  }, [visible, team]);

  async function loadMembers() {
    if (!team) return;

    setLoading(true);
    try {
      const data = await getMembersByTeam(team.id);
      setMembers(data);
    } catch (error) {
      showErrorToast("Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(
    member: Member,
    newRole: "captain" | "player" | "substitute" | null
  ) {
    if (!team) return;

    // Check if trying to assign captain when one already exists
    if (newRole === "captain") {
      const existingCaptain = members.find(
        (m) => m.role === "captain" && m.id !== member.id
      );
      if (existingCaptain) {
        showErrorToast("Team already has a captain. Unassign current captain first.");
        return;
      }
    }

    setUpdating(member.id);
    try {
      await updateMember(member.id, { role: newRole });
      await loadMembers();
      onMembersUpdated();
      showSuccessToast("Role updated");
    } catch (error: any) {
      const errorMsg = error.message || "Failed to update role";
      showErrorToast(errorMsg);
    } finally {
      setUpdating(null);
    }
  }

  if (!team) return null;

  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { captain: 0, player: 1, substitute: 2, null: 3 };
    return (
      (roleOrder[a.role || "null"] || 3) - (roleOrder[b.role || "null"] || 3)
    );
  });

  const playersCount = members.filter(
    (m) => m.role === "captain" || m.role === "player"
  ).length;
  const isOverLimit = maxPlayers !== null && playersCount > maxPlayers;
  const isAtLimit = maxPlayers !== null && playersCount >= maxPlayers;

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
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.teamIndicator,
                    { backgroundColor: team.colour_hex },
                  ]}
                />
                <Text style={styles.headerTitle}>{team.name}</Text>
              </View>
              <Text style={styles.headerMeta}>
                {playersCount}
                {maxPlayers !== null ? ` / ${maxPlayers}` : ""} active players
                {isOverLimit && (
                  <Text style={styles.overLimitText}> (over limit)</Text>
                )}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X
                size={20}
                color={colors.textSecondary}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <UsersIcon
                size={16}
                color={colors.textTertiary}
                strokeWidth={2}
              />
              <Text style={styles.infoBannerText}>
                Assign roles to manage team composition. Captain and Player
                count toward active roster.
              </Text>
            </View>

            {/* Role Limit Warning */}
            {isOverLimit && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  ⚠️ Team exceeds max players ({maxPlayers}). Change some to
                  substitute.
                </Text>
              </View>
            )}

            {/* Members List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.loadingText}>Loading members...</Text>
              </View>
            ) : members.length === 0 ? (
              <View style={styles.emptyState}>
                <UsersIcon
                  size={32}
                  color={colors.textTertiary}
                  strokeWidth={2}
                />
                <Text style={styles.emptyText}>No members in this team</Text>
                <Text style={styles.emptyHint}>
                  Assign members from the event page
                </Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                {sortedMembers.map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberAge}>{member.age}y</Text>
                      </View>
                      {member.role && (
                        <View style={styles.currentRoleBadge}>
                          {member.role === "captain" && (
                            <ShieldCheck
                              size={12}
                              color={colors.accent}
                              strokeWidth={2.5}
                            />
                          )}
                          {member.role === "player" && (
                            <User
                              size={12}
                              color={colors.textTertiary}
                              strokeWidth={2}
                            />
                          )}
                          <Text
                            style={[
                              styles.currentRoleText,
                              member.role === "captain" &&
                                styles.currentRoleTextCaptain,
                            ]}
                          >
                            {member.role === "captain"
                              ? "Captain"
                              : member.role === "player"
                              ? "Player"
                              : "Substitute"}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.roleButtons}>
                      {updating === member.id ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.accent}
                        />
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.roleButton,
                              member.role === "captain" &&
                                styles.roleButtonActive,
                            ]}
                            onPress={() => handleRoleChange(member, "captain")}
                            activeOpacity={0.7}
                          >
                            <ShieldCheck
                              size={14}
                              color={
                                member.role === "captain"
                                  ? colors.accent
                                  : colors.textTertiary
                              }
                              strokeWidth={2.5}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.roleButton,
                              member.role === "player" &&
                                styles.roleButtonActive,
                            ]}
                            onPress={() => handleRoleChange(member, "player")}
                            activeOpacity={0.7}
                            disabled={
                              isAtLimit &&
                              member.role !== "player" &&
                              member.role !== "captain"
                            }
                          >
                            <User
                              size={14}
                              color={
                                member.role === "player"
                                  ? colors.accent
                                  : isAtLimit &&
                                    member.role !== "player" &&
                                    member.role !== "captain"
                                  ? colors.borderStrong
                                  : colors.textTertiary
                              }
                              strokeWidth={2}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.roleButton,
                              member.role === "substitute" &&
                                styles.roleButtonActive,
                            ]}
                            onPress={() =>
                              handleRoleChange(member, "substitute")
                            }
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.roleButtonText,
                                member.role === "substitute" &&
                                  styles.roleButtonTextActive,
                              ]}
                            >
                              SUB
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.roleButton,
                              !member.role && styles.roleButtonActive,
                            ]}
                            onPress={() => handleRoleChange(member, null)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.roleButtonText,
                                !member.role && styles.roleButtonTextActive,
                              ]}
                            >
                              —
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerHint}>
              Tap role icons to assign captain, player, substitute, or unset
            </Text>
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
    maxHeight: "88%",
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  teamIndicator: {
    width: 4,
    height: 20,
    borderRadius: radius.sm,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  headerMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 4,
  },
  overLimitText: {
    color: colors.danger,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  scrollContainer: {
    maxHeight: 520,
  },
  infoBanner: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    margin: spacing.xl,
    marginBottom: spacing.md,
  },
  infoBannerText: {
    ...typography.small,
    color: colors.textTertiary,
    flex: 1,
    lineHeight: 18,
  },
  warningBanner: {
    backgroundColor: `${colors.danger}15`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  warningText: {
    ...typography.small,
    color: colors.danger,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xxxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyHint: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  membersList: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  memberCard: {
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  memberName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  memberAge: {
    ...typography.small,
    color: colors.textTertiary,
  },
  currentRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.inputFill,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentRoleText: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: "600",
  },
  currentRoleTextCaptain: {
    color: colors.accent,
  },
  roleButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  roleButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleButtonActive: {
    backgroundColor: `${colors.accent}15`,
    borderColor: `${colors.accent}40`,
  },
  roleButtonText: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: "700",
  },
  roleButtonTextActive: {
    color: colors.accent,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerHint: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: "center",
    fontStyle: "italic",
  },
});
