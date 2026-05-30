import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Filter } from "lucide-react-native";
import { useMatches } from "@/hooks/useMatches";
import { getSportMeta } from "@/constants/sports";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MatchStatus } from "@/types";

export default function MatchesScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<MatchStatus | undefined>();
  const { data: matches, isLoading, refetch } = useMatches({ status: statusFilter });

  const statusOptions: (MatchStatus | "all")[] = ["all", "scheduled", "ongoing", "completed", "cancelled"];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterContainer}
        >
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setStatusFilter(status === "all" ? undefined : status)}
              style={[
                styles.filterChip,
                (status === "all" && !statusFilter) || statusFilter === status
                  ? styles.filterChipActive
                  : null,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  (status === "all" && !statusFilter) || statusFilter === status
                    ? styles.filterChipTextActive
                    : null,
                ]}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Matches List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primaryAccent}
            />
          }
        >
          {matches?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyText}>No matches found</Text>
              <Text style={styles.emptySubtext}>
                Matches will appear here once events are created
              </Text>
            </View>
          ) : (
            matches?.map((match) => {
              const sport = getSportMeta(match.event.sport);
              
              return (
                <TouchableOpacity
                  key={match.id}
                  onPress={() => router.push(`/(app)/matches/${match.id}`)}
                  style={[styles.matchCard, shadows.card]}
                  activeOpacity={0.8}
                >
                  {/* Event Info */}
                  <View style={styles.matchHeader}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                      <View style={styles.eventTextContainer}>
                        <Text style={styles.eventName} numberOfLines={1}>
                          {match.event.name}
                        </Text>
                        <Text style={styles.roundLabel}>{match.round_label}</Text>
                      </View>
                    </View>
                    <StatusBadge status={match.status} size="sm" />
                  </View>

                  {/* Teams */}
                  <View style={styles.teamsContainer}>
                    <View style={styles.teamRow}>
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
                      {match.status === "completed" && match.home_score !== null && (
                        <Text style={styles.score}>{match.home_score}</Text>
                      )}
                    </View>

                    <Text style={styles.vs}>vs</Text>

                    <View style={styles.teamRow}>
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
                      {match.status === "completed" && match.away_score !== null && (
                        <Text style={styles.score}>{match.away_score}</Text>
                      )}
                    </View>
                  </View>

                  {/* Match Details */}
                  <View style={styles.matchFooter}>
                    {match.court && (
                      <Text style={styles.courtText}>📍 {match.court.name}</Text>
                    )}
                    <Text style={styles.dateText}>{match.scheduled_date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 100 }} />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.hero,
    color: colors.textPrimary,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.base,
  },
  filterContainer: {
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  filterChipText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: colors.accentInk,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.huge,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  matchCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  sportEmoji: {
    fontSize: 24,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  roundLabel: {
    ...typography.small,
    color: colors.textTertiary,
  },
  teamsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  score: {
    ...typography.title,
    color: colors.textPrimary,
    fontSize: 20,
  },
  vs: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: "center",
    fontWeight: "600",
  },
  matchFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
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
