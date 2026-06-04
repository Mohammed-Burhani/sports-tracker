import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ShieldCheck,
  Users,
  Calendar,
  Trophy,
  LogOut,
  Copy,
  Check,
} from "lucide-react-native";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";
import {
  getCaptainTeamDetails,
  getActiveCaptainSession,
  clearCaptainSession,
} from "@/lib/api/captainAuth";
import { useMatchesByEvent } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useMembers } from "@/hooks/useMembers";
import { useStandings } from "@/hooks/useStandings";
import { getSportMeta } from "@/constants/sports";
import { MatchCard } from "@/components/MatchCard";
import { StandingsTable } from "@/components/StandingsTable";
import { MemberCard } from "@/components/MemberCard";
import { CaptainTeamDetails, MatchWithTeams, MemberWithTeam } from "@/types";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import * as Clipboard from "expo-clipboard";

export default function CaptainDashboard() {
  const router = useRouter();
  const [teamDetails, setTeamDetails] = useState<CaptainTeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  const { data: matches } = useMatchesByEvent(teamDetails?.event_id || "");
  const { data: allTeams } = useTeams(teamDetails?.event_id || "");
  const { data: allMembers } = useMembers(teamDetails?.event_id || "");
  const { data: standings } = useStandings(teamDetails?.event_id || "");

  useEffect(() => {
    loadTeamDetails();
  }, []);

  async function loadTeamDetails() {
    const session = getActiveCaptainSession();

    if (!session) {
      router.replace("/(auth)/captain-sign-in");
      return;
    }

    setLoading(true);
    try {
      const details = await getCaptainTeamDetails(session.teamId);
      if (!details) {
        showErrorToast("Team not found");
        handleSignOut();
        return;
      }
      setTeamDetails(details);
    } catch (error) {
      showErrorToast("Failed to load team details");
      handleSignOut();
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    clearCaptainSession();
    router.replace("/(auth)/captain-sign-in");
  }

  async function handleCopyCode() {
    if (!teamDetails) return;
    await Clipboard.setStringAsync(teamDetails.access_code);
    setCodeCopied(true);
    showSuccessToast("Code copied");
    setTimeout(() => setCodeCopied(false), 2000);
  }

  if (loading || !teamDetails) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading team dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sport = getSportMeta(teamDetails.event_sport);
  const teamMembers = (allMembers || []).filter(
    (m: MemberWithTeam) => m.team_id === teamDetails.team_id
  );
  const teamMatches = (matches || []).filter(
    (m: MatchWithTeams) =>
      m.home_team_id === teamDetails.team_id ||
      m.away_team_id === teamDetails.team_id
  );
  const upcomingMatches = teamMatches.filter(
    (m: MatchWithTeams) => m.status === "scheduled" || m.status === "ongoing"
  );
  const teamStanding = (standings || []).find(
    (s) => s.team_id === teamDetails.team_id
  );

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
              onRefresh={loadTeamDetails}
              tintColor={colors.accent}
            />
          }
        >
          {/* Header with Sign Out */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Captain Access</Text>
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutButton}
              activeOpacity={0.7}
            >
              <LogOut size={18} color={colors.textSecondary} strokeWidth={2.5} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Team Hero Card */}
          <View style={[styles.heroCard, shadows.cardElevated]}>
            <LinearGradient
              colors={[teamDetails.team_color, `${teamDetails.team_color}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroGradient}
            >
              <ShieldCheck size={40} color="#fff" strokeWidth={2.5} />
            </LinearGradient>

            <View style={styles.heroContent}>
              <Text style={styles.teamName}>{teamDetails.team_name}</Text>
              <Text style={styles.eventName}>{teamDetails.event_name}</Text>

              <View style={styles.codeSection}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Team Code</Text>
                  <Text style={styles.codeValue}>{teamDetails.access_code}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyCode}
                  style={[styles.copyButton, shadows.card]}
                  activeOpacity={0.7}
                >
                  {codeCopied ? (
                    <Check size={18} color={colors.success} strokeWidth={2.5} />
                  ) : (
                    <Copy size={18} color={colors.textSecondary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>

              {teamDetails.captain_name && (
                <View style={styles.captainBadge}>
                  <ShieldCheck size={14} color={colors.accent} strokeWidth={2.5} />
                  <Text style={styles.captainText}>
                    Captain: {teamDetails.captain_name}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, shadows.card]}>
              <Users size={24} color={colors.accent} strokeWidth={2} />
              <Text style={styles.statValue}>{teamDetails.team_members_count}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={[styles.statCard, shadows.card]}>
              <Calendar size={24} color={colors.accent} strokeWidth={2} />
              <Text style={styles.statValue}>{teamDetails.upcoming_matches_count}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={[styles.statCard, shadows.card]}>
              <Trophy size={24} color={colors.accent} strokeWidth={2} />
              <Text style={styles.statValue}>{teamDetails.completed_matches_count}</Text>
              <Text style={styles.statLabel}>Played</Text>
            </View>
          </View>

          {/* Team Standing */}
          {teamStanding && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Team Standing</Text>
              <View style={[styles.standingCard, shadows.card]}>
                <View style={styles.standingRow}>
                  <Text style={styles.standingLabel}>Position</Text>
                  <Text style={styles.standingValue}>#{teamStanding.position}</Text>
                </View>
                <View style={styles.standingDivider} />
                <View style={styles.standingGrid}>
                  <View style={styles.standingItem}>
                    <Text style={styles.standingItemValue}>{teamStanding.played}</Text>
                    <Text style={styles.standingItemLabel}>Played</Text>
                  </View>
                  <View style={styles.standingItem}>
                    <Text style={[styles.standingItemValue, { color: colors.success }]}>
                      {teamStanding.won}
                    </Text>
                    <Text style={styles.standingItemLabel}>Won</Text>
                  </View>
                  <View style={styles.standingItem}>
                    <Text style={styles.standingItemValue}>{teamStanding.drawn}</Text>
                    <Text style={styles.standingItemLabel}>Draw</Text>
                  </View>
                  <View style={styles.standingItem}>
                    <Text style={[styles.standingItemValue, { color: colors.danger }]}>
                      {teamStanding.lost}
                    </Text>
                    <Text style={styles.standingItemLabel}>Lost</Text>
                  </View>
                </View>
                <View style={styles.standingDivider} />
                <View style={styles.standingRow}>
                  <Text style={styles.standingLabel}>Points</Text>
                  <Text style={[styles.standingValue, { color: colors.accent }]}>
                    {teamStanding.points}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Team Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Squad</Text>
            {teamMembers.length === 0 ? (
              <View style={[styles.emptyCard, shadows.card]}>
                <Users size={32} color={colors.textTertiary} strokeWidth={2} />
                <Text style={styles.emptyText}>No members assigned yet</Text>
              </View>
            ) : (
              <View style={styles.membersList}>
                {teamMembers.map((member: MemberWithTeam) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </View>
            )}
          </View>

          {/* Upcoming Matches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Matches</Text>
            {upcomingMatches.length === 0 ? (
              <View style={[styles.emptyCard, shadows.card]}>
                <Calendar size={32} color={colors.textTertiary} strokeWidth={2} />
                <Text style={styles.emptyText}>No upcoming matches</Text>
              </View>
            ) : (
              <View style={styles.matchesList}>
                {upcomingMatches.map((match: MatchWithTeams) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    format={teamDetails.event_format}
                    highlightTeamId={teamDetails.team_id}
                  />
                ))}
              </View>
            )}
          </View>

          {/* All Teams */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Teams</Text>
            <View style={styles.teamsGrid}>
              {(allTeams || []).map((team) => (
                <View
                  key={team.id}
                  style={[
                    styles.teamCard,
                    shadows.card,
                    team.id === teamDetails.team_id && styles.teamCardHighlight,
                  ]}
                >
                  <View
                    style={[styles.teamDot, { backgroundColor: team.colour_hex }]}
                  />
                  <View style={styles.teamCardContent}>
                    <Text
                      style={[
                        styles.teamCardName,
                        team.id === teamDetails.team_id && styles.teamCardNameHighlight,
                      ]}
                    >
                      {team.name}
                    </Text>
                    <Text style={styles.teamCardPlayers}>
                      {team.player_count} members
                    </Text>
                  </View>
                  {team.id === teamDetails.team_id && (
                    <View style={styles.yourTeamBadge}>
                      <Text style={styles.yourTeamText}>YOU</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Full Standings */}
          {standings && standings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Full Standings</Text>
              <StandingsTable
                standings={standings}
                highlightTeamId={teamDetails.team_id}
              />
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  signOutText: {
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
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    padding: spacing.lg,
  },
  teamName: {
    ...typography.hero,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  eventName: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  codeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  codeBox: {
    flex: 1,
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  codeLabel: {
    ...typography.small,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  codeValue: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 20,
    letterSpacing: 2,
  },
  copyButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  captainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.accent}15`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
  },
  captainText: {
    ...typography.small,
    color: colors.accent,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    ...typography.stat,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  standingCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  standingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  standingLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  standingValue: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 24,
  },
  standingDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  standingGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  standingItem: {
    alignItems: "center",
  },
  standingItemValue: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 20,
    marginBottom: 2,
  },
  standingItemLabel: {
    ...typography.small,
    color: colors.textTertiary,
  },
  membersList: {
    gap: spacing.sm,
  },
  matchesList: {
    gap: spacing.sm,
  },
  teamsGrid: {
    gap: spacing.sm,
  },
  teamCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  teamCardHighlight: {
    backgroundColor: `${colors.accent}10`,
    borderColor: `${colors.accent}40`,
    borderWidth: 2,
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
    color: colors.textPrimary,
    marginBottom: 2,
  },
  teamCardNameHighlight: {
    color: colors.accent,
  },
  teamCardPlayers: {
    ...typography.small,
    color: colors.textTertiary,
  },
  yourTeamBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  yourTeamText: {
    ...typography.small,
    color: "#fff",
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
