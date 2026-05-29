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
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Calendar, Users, Edit, Plus, Trash2 } from "lucide-react-native";
import { useEvent } from "@/hooks/useEvents";
import { useSessionsByEvent } from "@/hooks/useSessions";
import { useTeams } from "@/hooks/useTeams";
import { useDeleteEvent, useUpdateEvent } from "@/hooks/useEvents";
import { getSportMeta, getFormatMeta } from "@/constants/sports";
import { SessionCard } from "@/components/SessionCard";
import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";
import { Team } from "@/types";
import TeamModal from "@/components/TeamModal";
import { colors, spacing, typography, radius, shadows, sportThemes } from "@/constants/theme";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormatBadge } from "@/components/ui/FormatBadge";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | undefined>();

  const { data: event, isLoading: eventLoading, refetch } = useEvent(id);
  const { data: sessions, isLoading: sessionsLoading } = useSessionsByEvent(id);
  const { data: teams } = useTeams(id);
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();

  if (eventLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={{ padding: spacing.lg }}>
          <Skeleton height={200} rounded />
          <View style={{ height: spacing.lg }} />
          <SkeletonCard />
          <SkeletonCard />
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

  // Group sessions by date
  const sessionsByDate: Record<string, typeof sessions> = {};
  if (sessions) {
    for (const s of sessions) {
      sessionsByDate[s.date] = sessionsByDate[s.date] ?? [];
      sessionsByDate[s.date]!.push(s);
    }
  }

  const completedSessions = sessions?.filter((s) => s.status === "completed").length ?? 0;

  async function handleDelete() {
    Alert.alert("Delete Event", "This will remove the event and all its sessions. Continue?", [
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

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
                    {event.registered_count}/{event.max_participants} participants
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, shadows.card]}>
              <Text style={styles.statValue}>{sessions?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={[styles.statCard, shadows.card]}>
              <Text style={styles.statValue}>{completedSessions}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, shadows.card]}>
              <Text style={styles.statValue}>{teams?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Teams</Text>
            </View>
            <View style={[styles.statCard, shadows.card]}>
              <Text style={styles.statValue}>{event.registered_count}</Text>
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
              style={[styles.actionButton, styles.actionButtonPrimary, shadows.card]}
              onPress={() => router.push({ pathname: "/(app)/sessions/create", params: { eventId: id } })}
              activeOpacity={0.8}
            >
              <Plus size={16} color={colors.textInverse} strokeWidth={2.5} />
              <Text style={styles.actionButtonTextPrimary}>Session</Text>
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Teams ({teams?.length ?? 0}/{event.max_participants ? Math.floor(event.max_participants / 11) : 10})
                </Text>
                <TouchableOpacity
                  style={[styles.addTeamButton, shadows.card]}
                  onPress={() => setTeamModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={14} color={colors.primaryAccent} strokeWidth={2.5} />
                  <Text style={styles.addTeamText}>Add Team</Text>
                </TouchableOpacity>
              </View>

              {(teams?.length ?? 0) === 0 ? (
                <View style={[styles.emptyCard, shadows.card]}>
                  <Text style={styles.emptyText}>
                    No teams added yet. Expected {event.max_participants ? Math.floor(event.max_participants / 11) : 10} teams with {event.max_participants ? Math.floor(event.max_participants / Math.floor(event.max_participants / 11)) : 11} players each.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTeamModalOpen(true)}
                    style={styles.emptyAction}
                  >
                    <Text style={styles.emptyActionText}>Add first team →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.teamsList}>
                  {teams?.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      onPress={() => {
                        setEditTeam(team);
                        setTeamModalOpen(true);
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.teamChip,
                        shadows.card,
                        { backgroundColor: `${team.colour_hex}15`, borderColor: `${team.colour_hex}40` }
                      ]}
                    >
                      <View style={[styles.teamDot, { backgroundColor: team.colour_hex }]} />
                      <View style={styles.teamChipContent}>
                        <Text style={[styles.teamName, { color: team.colour_hex }]}>{team.name}</Text>
                        {team.captain_name && (
                          <Text style={styles.teamCaptain}>Captain: {team.captain_name}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Sessions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            {sessionsLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (sessions?.length ?? 0) === 0 ? (
              <View style={[styles.emptyCard, shadows.card]}>
                <Text style={styles.emptyText}>No sessions yet</Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/(app)/sessions/create", params: { eventId: id } })}
                  style={styles.emptyAction}
                >
                  <Text style={styles.emptyActionText}>Add first session →</Text>
                </TouchableOpacity>
              </View>
            ) : isMultiDay ? (
              Object.keys(sessionsByDate).sort().map((date) => (
                <View key={date} style={styles.dateGroup}>
                  <View style={[styles.dateBadge, { backgroundColor: `${sportTheme.accent}20` }]}>
                    <Text style={[styles.dateBadgeText, { color: sportTheme.accent }]}>{date}</Text>
                  </View>
                  {sessionsByDate[date]!.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onPress={() => router.push(`/(app)/sessions/${s.id}`)}
                    />
                  ))}
                </View>
              ))
            ) : (
              sessions?.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onPress={() => router.push(`/(app)/sessions/${s.id}`)}
                />
              ))
            )}
          </View>

          {/* Bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      <TeamModal
        visible={teamModalOpen}
        onClose={() => { setTeamModalOpen(false); setEditTeam(undefined); }}
        eventId={id}
        teams={teams ?? []}
        editTeam={editTeam}
        onEditTeam={setEditTeam}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  heroGradient: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '600',
  },
  metaList: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
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
    alignItems: 'center',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonDanger: {
    flex: 0,
    paddingHorizontal: spacing.md,
  },
  actionButtonText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  actionButtonTextPrimary: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  addTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addTeamText: {
    ...typography.small,
    color: colors.accentInk,
    fontWeight: '700',
  },
  teamsList: {
    gap: spacing.sm,
  },
  teamChip: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamChipContent: {
    flex: 1,
  },
  teamName: {
    ...typography.bodyBold,
    fontSize: 15,
    marginBottom: 2,
  },
  teamCaptain: {
    ...typography.small,
    color: colors.textTertiary,
  },
  teamDivider: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  emptyCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.md,
  },
  emptyActionText: {
    ...typography.bodyBold,
    color: colors.primaryAccent,
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateBadge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  dateBadgeText: {
    ...typography.small,
    fontWeight: '700',
  },
});
