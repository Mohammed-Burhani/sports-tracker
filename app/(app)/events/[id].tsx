import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, MapPin, Calendar, Users, Edit, Trash2, RefreshCw, Shuffle } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useMatchesByEvent } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useStandings } from "@/hooks/useStandings";
import { useGenerateSchedule } from "@/hooks/useSchedule";
import { useQuickMatchResult } from "@/hooks/useQuickMatchResult";
import { useMembers, useAddMember, useUpdateMember, useDeleteMember, useAssignMembersToTeams } from "@/hooks/useMembers";
import { getSportMeta, getFormatMeta } from "@/constants/sports";
import { MatchCard } from "@/components/MatchCard";
import { MatchResultSheet } from "@/components/MatchResultSheet";
import { StandingsTable } from "@/components/StandingsTable";
import { MemberCard } from "@/components/MemberCard";
import { MemberSheet } from "@/components/MemberSheet";
import { TeamAssignmentSheet } from "@/components/TeamAssignmentSheet";
import { MemberAssignmentSheet } from "@/components/MemberAssignmentSheet";
import { colors, spacing, typography, radius, shadows, sportThemes } from "@/constants/theme";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormatBadge } from "@/components/ui/FormatBadge";
import { MatchWithTeams, MemberWithTeam, Team } from "@/types";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [showMatchSheet, setShowMatchSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithTeam | undefined>();
  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const [showAssignConfirm, setShowAssignConfirm] = useState(false);
  const [showTeamAssignSheet, setShowTeamAssignSheet] = useState(false);
  const [showMemberAssignSheet, setShowMemberAssignSheet] = useState(false);
  const [selectedTeamForAssign, setSelectedTeamForAssign] = useState<Team | null>(null);

  const { data: event, isLoading: eventLoading, refetch } = useEvent(id);
  const { data: matches, isLoading: matchesLoading } = useMatchesByEvent(id);
  const { data: teams } = useTeams(id);
  const { data: standings } = useStandings(id);
  const { data: members = [], isLoading: membersLoading } = useMembers(id);
  const deleteEvent = useDeleteEvent();
  const regenerateSchedule = useGenerateSchedule();
  const quickMarkResult = useQuickMatchResult();
  const addMemberMutation = useAddMember(id);
  const updateMemberMutation = useUpdateMember(id);
  const deleteMemberMutation = useDeleteMember(id);
  const assignMembersToTeamsMutation = useAssignMembersToTeams(id);

  if (eventLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={{ padding: spacing.lg }}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={styles.emptyText}>Event not found</Text>
      </SafeAreaView>
    );
  }

  const sport = getSportMeta(event.sport);
  const format = getFormatMeta(event.format);
  const isMultiDay = event.end_date && event.end_date !== event.start_date;
  const sportTheme = sportThemes[event.sport as keyof typeof sportThemes] || sportThemes.table_tennis;

  // Group matches by round
  const matchesByRound: Record<string, typeof matches> = {};
  if (matches) {
    for (const match of matches) {
      matchesByRound[match.round_label] = matchesByRound[match.round_label] ?? [];
      matchesByRound[match.round_label]!.push(match);
    }
  }

  const completedMatches = matches?.filter((m) => m.status === "completed").length ?? 0;

  async function handleDelete() {
    Alert.alert("Delete Event", "This will remove the event and all its matches. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteEvent.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  async function handleRegenerateSchedule() {
    console.log('handleRegenerateSchedule called');
    Alert.alert(
      "Regenerate Schedule",
      "This will delete all existing matches and create a new schedule. Continue?",
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => console.log('Regenerate cancelled')
        },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: async () => {
            console.log('User confirmed regenerate, calling API...');
            try {
              console.log('Calling regenerateSchedule.mutateAsync with eventId:', id);
              const result = await regenerateSchedule.mutateAsync(id);
              console.log('Regenerate result:', result);
              showSuccessToast("Schedule regenerated");
            } catch (error: any) {
              console.error('Regenerate error:', error);
              console.error('Error details:', JSON.stringify(error, null, 2));
              showErrorToast(`Failed to regenerate schedule: ${error.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  }

  function handleMatchPress(match: MatchWithTeams) {
    setSelectedMatch(match);
    setShowMatchSheet(true);
  }

  function handleMarkWin(match: MatchWithTeams, teamId: string) {
    console.log('handleMarkWin called:', { matchId: match.id, teamId, eventId: event?.id });
    if (!event) {
      console.error('No event found');
      return;
    }
    
    console.log('Calling quickMarkResult.mutate');
    quickMarkResult.mutate({
      matchId: match.id,
      eventId: event.id,
      eventFormat: event.format,
      winnerTeamId: teamId,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
    });
  }

  function handleAddMember() {
    setSelectedMember(undefined);
    setShowMemberSheet(true);
  }

  function handleEditMember(member: MemberWithTeam) {
    setSelectedMember(member);
    setShowMemberSheet(true);
  }

  async function handleSaveMember(data: { name: string; age: number }) {
    if (!event) return;

    if (selectedMember) {
      await updateMemberMutation.mutateAsync({
        id: selectedMember.id,
        name: data.name,
        age: data.age,
      });
    } else {
      await addMemberMutation.mutateAsync({
        organizationId: event.organization_id,
        name: data.name,
        age: data.age,
      });
    }
    setShowMemberSheet(false);
  }

  async function handleDeleteMember() {
    if (!selectedMember) return;
    await deleteMemberMutation.mutateAsync(selectedMember.id);
    setShowMemberSheet(false);
  }

  async function handleConfirmAssign() {
    setShowAssignConfirm(false);
    try {
      const count = await assignMembersToTeamsMutation.mutateAsync();
      showSuccessToast(`${count} member${count !== 1 ? 's' : ''} assigned to teams`);
    } catch (error) {
      showErrorToast('Failed to assign members to teams');
    }
  }

  function handleMemberCardPress(member: MemberWithTeam) {
    setSelectedMember(member);
    setShowTeamAssignSheet(true);
  }

  async function handleAssignMemberToTeam(teamId: string) {
    if (!selectedMember) return;
    try {
      await updateMemberMutation.mutateAsync({
        id: selectedMember.id,
        name: selectedMember.name,
        age: selectedMember.age,
        teamId: teamId,
      });
      showSuccessToast('Member assigned to team');
    } catch (error) {
      showErrorToast('Failed to assign member');
    }
  }

  function handleTeamCardPress(team: Team) {
    setSelectedTeamForAssign(team);
    setShowMemberAssignSheet(true);
  }

  async function handleAssignToTeam(memberId: string) {
    if (!selectedTeamForAssign) return;
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    try {
      await updateMemberMutation.mutateAsync({
        id: member.id,
        name: member.name,
        age: member.age,
        teamId: selectedTeamForAssign.id,
      });
      showSuccessToast('Member assigned to team');
    } catch (error) {
      showErrorToast('Failed to assign member');
    }
  }

  const unassignedMembersCount = members.filter(m => !m.team_id).length;
  const showAssignButton = members.length > 0 && (teams?.length ?? 0) > 0 && unassignedMembersCount > 0;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.primaryAccent}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={2.5} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Card */}
          <View style={[styles.heroCard, shadows.cardElevated]}>
            <LinearGradient
              colors={[sportTheme.start, sportTheme.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroGradient}
            >
              <Text style={styles.heroEmoji}>{sport.emoji}</Text>
            </LinearGradient>

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>{event.name}</Text>

              <View style={styles.badgeRow}>
                <FormatBadge label={format.label} color={sportTheme.accent} size="sm" />
                <StatusBadge status={event.status} size="sm" />
                {event.player_type === "team" && (
                  <View style={[styles.teamBadge, shadows.card]}>
                    <Text style={styles.teamBadgeText}>Team</Text>
                  </View>
                )}
              </View>

              <View style={styles.metaList}>
                {event.venue && (
                  <View style={styles.metaRow}>
                    <MapPin size={14} color={colors.textSecondary} strokeWidth={2.5} />
                    <Text style={styles.metaText}>{event.venue}</Text>
                  </View>
                )}
                <View style={styles.metaRow}>
                  <Calendar size={14} color={colors.textSecondary} strokeWidth={2.5} />
                  <Text style={styles.metaText}>
                    {isMultiDay ? `${event.start_date} → ${event.end_date}` : event.start_date}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Users size={14} color={colors.textSecondary} strokeWidth={2.5} />
                  <Text style={styles.metaText}>
                    {event.max_participants} participants
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, shadows.card]}>
              <Text style={styles.statValue}>{matches?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={[styles.statCard, shadows.card]}>
              <Text style={styles.statValue}>{completedMatches}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, shadows.card]}>
              <Text style={styles.statValue}>{teams?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Teams</Text>
            </View>
            <View style={[styles.statCard, shadows.card]}>
              <Text style={styles.statValue}>{event.max_participants}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={[styles.descriptionCard, shadows.card]}>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, shadows.card]}
              onPress={() => router.push(`/(app)/events/${id}/edit`)}
              activeOpacity={0.8}
            >
              <Edit size={16} color={colors.textPrimary} strokeWidth={2.5} />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, shadows.card]}
              onPress={() => {
                console.log('Regenerate button pressed!');
                handleRegenerateSchedule();
              }}
              activeOpacity={0.8}
              disabled={regenerateSchedule.isPending}
            >
              <RefreshCw size={16} color={colors.accent} strokeWidth={2.5} />
              <Text style={[styles.actionButtonText, { color: colors.accent }]}>
                {regenerateSchedule.isPending ? "..." : "Regenerate"}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger, shadows.card]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color={colors.danger} strokeWidth={2.5} />
            </TouchableOpacity> */}
          </View>

          {/* Teams Section */}
          {event.player_type === "team" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Teams ({teams?.length ?? 0})</Text>

              {(teams?.length ?? 0) === 0 ? (
                <View style={[styles.emptyCard, shadows.card]}>
                  <Text style={styles.emptyText}>No teams yet</Text>
                </View>
              ) : (
                <>
                  <View style={styles.teamHint}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.accent} className="mt-1" />
                    <Text style={styles.teamHintText}>
                      Tap a team to assign unassigned members
                    </Text>
                  </View>
                  <View style={styles.teamsGrid}>
                    {teams?.map((team) => (
                      <TouchableOpacity
                        key={team.id}
                        style={[
                          styles.teamCard,
                          shadows.card,
                          { backgroundColor: `${team.colour_hex}15`, borderColor: `${team.colour_hex}40` },
                        ]}
                        onPress={() => handleTeamCardPress(team)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.teamDot, { backgroundColor: team.colour_hex }]} />
                        <View style={styles.teamCardContent}>
                          <Text style={[styles.teamCardName, { color: team.colour_hex }]}>
                            {team.name}
                          </Text>
                          <Text style={styles.teamCardPlayers}>
                            {team.player_count} players
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Members Section */}
          <View style={styles.section}>
            <View style={styles.membersSectionHeader}>
              <Text style={styles.sectionTitle}>Members ({members.length})</Text>
              <TouchableOpacity
                style={[styles.addMemberButton, shadows.card]}
                onPress={handleAddMember}
                activeOpacity={0.8}
              >
                <Text style={styles.addMemberButtonText}>+ Add Member</Text>
              </TouchableOpacity>
            </View>

            {showAssignButton && (
              <TouchableOpacity
                style={[styles.assignButton, shadows.card]}
                onPress={() => setShowAssignConfirm(true)}
                activeOpacity={0.8}
                disabled={assignMembersToTeamsMutation.isPending}
              >
                {assignMembersToTeamsMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Shuffle size={18} color="#fff" strokeWidth={2.5} />
                    <Text style={styles.assignButtonText}>Randomly Assign to Teams</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.memberHint}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accent} className="mt-1" />
              <Text style={styles.memberHintText}>
                Tap a member to manually assign or reassign to a team
              </Text>
            </View>

            {membersLoading ? (
              <ActivityIndicator size="small" color={colors.primaryAccent} />
            ) : members.length === 0 ? (
              <View style={[styles.emptyCard, shadows.card]}>
                <Users size={32} color={colors.textTertiary} strokeWidth={2} />
                <Text style={styles.emptyText}>No members yet</Text>
                <TouchableOpacity
                  style={[styles.emptyActionButton, shadows.card]}
                  onPress={handleAddMember}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyActionButtonText}>+ Add First Member</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.membersList}>
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onPress={() => handleMemberCardPress(member)}
                    onDelete={() => {
                      Alert.alert(
                        'Delete Member',
                        `Remove ${member.name} from this event?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteMemberMutation.mutateAsync(member.id);
                            },
                          },
                        ]
                      );
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Schedule Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              {event.format === "tournament" && matches && matches.length > 0 && (
                <Text style={styles.sectionHint}>
                  Mark Win/Loss for each team
                </Text>
              )}
            </View>

            {matchesLoading ? (
              <Text style={styles.loadingText}>Loading matches...</Text>
            ) : (matches?.length ?? 0) === 0 ? (
              <View style={[styles.emptyCard, shadows.card]}>
                <Text style={styles.emptyText}>No matches scheduled</Text>
              </View>
            ) : (
              Object.keys(matchesByRound)
                .sort((a, b) => {
                  // Sort rounds by round_number
                  const matchA = matchesByRound[a]![0];
                  const matchB = matchesByRound[b]![0];
                  return matchA.round_number - matchB.round_number;
                })
                .map((roundLabel) => (
                  <View key={roundLabel} style={styles.roundGroup}>
                    <View style={[styles.roundBadge, { backgroundColor: `${sportTheme.accent}20` }]}>
                      <Text style={[styles.roundBadgeText, { color: sportTheme.accent }]}>
                        {roundLabel}
                      </Text>
                    </View>
                    {matchesByRound[roundLabel]!.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        format={event.format}
                        onPress={event.format === "league" ? () => handleMatchPress(match) : undefined}
                        onMarkWin={event.format === "tournament" ? (teamId) => handleMarkWin(match, teamId) : undefined}
                      />
                    ))}
                  </View>
                ))
            )}
          </View>

          {/* Standings Section (League only) */}
          {event.format === "league" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Standings</Text>
              <StandingsTable standings={standings || []} />
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Match Result Sheet */}
      <MatchResultSheet
        visible={showMatchSheet}
        match={selectedMatch}
        format={event.format}
        onClose={() => {
          setShowMatchSheet(false);
          setSelectedMatch(null);
        }}
      />

      {/* Member Sheet */}
      <MemberSheet
        visible={showMemberSheet}
        member={selectedMember}
        onClose={() => {
          setShowMemberSheet(false);
          setSelectedMember(undefined);
        }}
        onSave={handleSaveMember}
        onDelete={selectedMember ? handleDeleteMember : undefined}
      />

      {/* Assign Confirmation Modal */}
      <Modal
        visible={showAssignConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAssignConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, shadows.cardElevated]}>
            <Text style={styles.modalTitle}>Randomly Assign to Teams</Text>
            <Text style={styles.modalMessage}>
              This will randomly distribute unassigned members across all teams. Continue?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAssignConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmAssign}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextConfirm}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Team Assignment Sheet */}
      <TeamAssignmentSheet
        visible={showTeamAssignSheet}
        member={selectedMember || null}
        teams={teams || []}
        onClose={() => {
          setShowTeamAssignSheet(false);
          setSelectedMember(undefined);
        }}
        onAssign={handleAssignMemberToTeam}
      />

      {/* Member Assignment Sheet */}
      <MemberAssignmentSheet
        visible={showMemberAssignSheet}
        team={selectedTeamForAssign}
        members={members}
        onClose={() => {
          setShowMemberAssignSheet(false);
          setSelectedTeamForAssign(null);
        }}
        onAssign={handleAssignToTeam}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  heroCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  heroGradient: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 40,
  },
  heroContent: {
    padding: spacing.lg,
  },
  heroTitle: {
    ...typography.hero,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  teamBadge: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  teamBadgeText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  metaList: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
  },
  statValue: {
    ...typography.stat,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  descriptionCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  actionButtonDanger: {
    flex: 0,
    paddingHorizontal: spacing.md,
  },
  actionButtonText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  sectionHint: {
    ...typography.small,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  teamsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  teamCard: {
    width: "48%",
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamCardContent: {
    flex: 1,
  },
  teamCardName: {
    ...typography.bodyBold,
    fontSize: 14,
    marginBottom: 2,
  },
  teamCardPlayers: {
    ...typography.small,
    color: colors.textTertiary,
  },
  roundGroup: {
    marginBottom: spacing.lg,
  },
  roundBadge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  roundBadgeText: {
    ...typography.small,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    padding: spacing.xl,
  },
  membersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  addMemberButton: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addMemberButtonText: {
    ...typography.bodyBold,
    color: colors.primaryAccent,
    fontSize: 14,
  },
  assignButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  assignButtonText: {
    ...typography.bodyBold,
    color: "#fff",
  },
  membersList: {
    gap: spacing.sm,
  },
  emptyActionButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  emptyActionButtonText: {
    ...typography.bodyBold,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalMessage: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primaryAccent,
  },
  modalButtonTextCancel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  modalButtonTextConfirm: {
    ...typography.bodyBold,
    color: "#fff",
  },
  teamHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  teamHintText: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  memberHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  memberHintText: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
