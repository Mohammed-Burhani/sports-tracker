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
import { useEvents } from "@/hooks/useEvents";
import { useStandings } from "@/hooks/useStandings";
import { getSportMeta } from "@/constants/sports";
import { StandingsTable } from "@/components/StandingsTable";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

export default function StandingsScreen() {
  const router = useRouter();
  const { data: events, isLoading, refetch } = useEvents({ format: "league", status: "published" });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Standings</Text>
        </View>

        {/* Events List */}
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
          {events?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyText}>No league events</Text>
              <Text style={styles.emptySubtext}>
                Standings will appear here for league format events
              </Text>
            </View>
          ) : (
            events?.map((event) => (
              <StandingsCard key={event.id} eventId={event.id} eventName={event.name} sport={event.sport} />
            ))
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StandingsCard({ eventId, eventName, sport }: { eventId: string; eventName: string; sport: string }) {
  const router = useRouter();
  const { data: standings } = useStandings(eventId);
  const sportMeta = getSportMeta(sport);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/events/${eventId}`)}
      style={[styles.eventCard, shadows.card]}
      activeOpacity={0.8}
    >
      {/* Event Header */}
      <View style={styles.eventHeader}>
        <Text style={styles.sportEmoji}>{sportMeta.emoji}</Text>
        <Text style={styles.eventName}>{eventName}</Text>
      </View>

      {/* Standings Table */}
      <StandingsTable standings={standings || []} compact />
    </TouchableOpacity>
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
  eventCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sportEmoji: {
    fontSize: 24,
  },
  eventName: {
    ...typography.heading,
    color: colors.textPrimary,
    flex: 1,
  },
});
