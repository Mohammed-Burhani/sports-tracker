import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, MapPin, Calendar, Users, Edit, Trash2, RefreshCw } from "lucide-react-native";
import { useEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useMatchesByEvent } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useStandings } from "@/hooks/useStandings";
import { useGenerateSchedule } from "@/hooks/useSchedule";
import { useQuickMatchResult } from "@/hooks/useQuickMatchResult";
import { getSportMeta, getFormatMeta } from "@/constants/sports";
import { MatchCard } from "@/components/MatchCard";
import { MatchResultSheet } from "@/components/MatchResultSheet";
import { StandingsTable } from "@/components/StandingsTable";
import { colors, spacing, typography, radius, shadows, sportThemes } from "@/constants/theme";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormatBadge } from "@/components/ui/FormatBadge";
import { MatchWithTeams } from "@/types";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [showMatchSheet, setShowMatchSheet] = useState(false);

  const { data: event, isLoading: eventLoading, refetch } = useEvent(id);
  const { data: matches, isLoading: matchesLoading } = useMatchesByEvent(id);
  const { data: teams } = useTeams(id);
  const { data: standings } = useStandings(id);
  const deleteEvent = useDeleteEvent();
  const regenerateSchedule = useGenerateSchedule();
  const quickMarkResult = useQuickMatchResult();

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

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger, shadows.card]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color={colors.danger} strokeWidth={2.5} />
            </TouchableOpacity>
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
                <View style={styles.teamsGrid}>
                  {teams?.map((team) => (
                    <View
                      key={team.id}
                      style={[
                        styles.teamCard,
                        shadows.card,
                        { backgroundColor: `${team.colour_hex}15`, borderColor: `${team.colour_hex}40` },
                      ]}
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
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

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
});
