import React from "react";
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
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from 'expo-linear-gradient';
import { queryKeys } from "@/constants/queryKeys";
import { getDashboardStats } from "@/lib/api/dashboard";
import { StatCard } from "@/components/ui/StatCard";
import { EventCard } from "@/components/EventCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getSportMeta } from "@/constants/sports";
import { ActivityItem, Event } from "@/types";
import { colors, spacing, typography, radius, shadows, sportThemes } from "@/constants/theme";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function Dashboard() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardStats,
  });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primaryAccent}
            />
          }
        >
          {/* Header */}
          <ScreenHeader
            greeting="Welcome back"
            userName="Dashboard"
            emoji="👋"
            onActionPress={() => router.push("/(app)/events/create")}
            actionIcon={<Text style={styles.plusIcon}>+</Text>}
          />

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Events this month"
              value={data?.eventsThisMonth ?? 0}
              accent={sportThemes.cricket.accent}
              loading={isLoading}
              emoji="🏆"
            />
            <StatCard
              label="Sessions today"
              value={data?.sessionsToday ?? 0}
              accent={sportThemes.table_tennis.accent}
              loading={isLoading}
              emoji="⏱️"
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              label="Active participants"
              value={data?.totalRegisteredParticipants ?? 0}
              accent={sportThemes.football.accent}
              loading={isLoading}
              emoji="👥"
            />
            <StatCard
              label="Upcoming (7 days)"
              value={data?.upcomingEvents?.length ?? 0}
              accent={sportThemes.badminton.accent}
              loading={isLoading}
              emoji="📅"
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(app)/events/create")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[sportThemes.cricket.start, sportThemes.cricket.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionEmoji}>🏆</Text>
                <Text style={styles.actionLabel}>New Event</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(app)/sessions/create")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[sportThemes.table_tennis.start, sportThemes.table_tennis.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionEmoji}>⏱️</Text>
                <Text style={styles.actionLabel}>Log Session</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Ongoing Events */}
          {(isLoading || (data?.ongoingEvents?.length ?? 0) > 0) && (
            <View style={styles.section}>
              <SectionHeader label="Ongoing Events" emoji="🔴" />
              {isLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.horizontalList}>
                    {data?.ongoingEvents.map((event: Event) => (
                      <View key={event.id} style={styles.horizontalCard}>
                        <EventCard
                          event={event}
                          onPress={() => router.push(`/(app)/events/${event.id}`)}
                        />
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* Upcoming Events */}
          <View style={styles.section}>
            <SectionHeader label="Upcoming Events" emoji="📅" />
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (data?.upcomingEvents?.length ?? 0) === 0 ? (
              <View style={[styles.emptyCard, shadows.card]}>
                <Text style={styles.emptyText}>No upcoming events in the next 7 days</Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => router.push("/(app)/events/create")}
                >
                  <Text style={styles.emptyActionText}>Create one →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              data?.upcomingEvents.map((event: Event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/(app)/events/${event.id}`)}
                />
              ))
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <SectionHeader label="Recent Activity" emoji="⚡" />
            {isLoading ? (
              <SkeletonCard />
            ) : (data?.recentActivity?.length ?? 0) === 0 ? (
              <View style={[styles.emptyCard, shadows.card]}>
                <Text style={styles.emptyText}>No recent session activity</Text>
              </View>
            ) : (
              data?.recentActivity.map((item: ActivityItem) => {
                const sport = getSportMeta(item.sport);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.activityCard, shadows.card]}
                    onPress={() => router.push(`/(app)/sessions/${item.session_id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.activityEmoji}>{sport.emoji}</Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{item.session_name}</Text>
                      <Text style={styles.activitySubtitle}>{item.event_name}</Text>
                    </View>
                    <StatusBadge status={item.status} size="sm" />
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Bottom padding for floating tab bar */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  plusIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  actionGradient: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xl,
  },
  horizontalList: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  horizontalCard: {
    width: 280,
  },
  emptyCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.md,
  },
  emptyActionText: {
    ...typography.caption,
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  activitySubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
