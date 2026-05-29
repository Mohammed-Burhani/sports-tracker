import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEvents } from "@/hooks/useEvents";
import { EventCard } from "@/components/EventCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SportChip } from "@/components/ui/SportChip";
import { SPORTS, FORMATS } from "@/constants/sports";
import { Sport, EventFormat, EventStatus } from "@/types";
import { colors, spacing, typography, radius, sportThemes } from "@/constants/theme";

const STATUSES: EventStatus[] = ["draft", "published", "ongoing", "completed", "cancelled"];

export default function EventsTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState<Sport | undefined>();
  const [format, setFormat] = useState<EventFormat | undefined>();
  const [status, setStatus] = useState<EventStatus | undefined>();

  const { data, isLoading, refetch, isRefetching } = useEvents({
    sport,
    format,
    status,
    search: search.length > 1 ? search : undefined,
  });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primaryAccent} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Events</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(app)/events/create")}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <TextInput
            placeholder="Search events..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          {/* Sport Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <View style={styles.filterContent}>
              <SportChip
                emoji="🎯"
                label="All sports"
                selected={!sport}
                onPress={() => setSport(undefined)}
              />
              {SPORTS.map((s) => {
                const theme = sportThemes[s.sport as keyof typeof sportThemes];
                return (
                  <SportChip
                    key={s.sport}
                    emoji={s.emoji}
                    label={s.label}
                    selected={sport === s.sport}
                    onPress={() => setSport(sport === s.sport ? undefined : s.sport)}
                    gradientStart={theme?.start}
                    gradientEnd={theme?.end}
                  />
                );
              })}
            </View>
          </ScrollView>

          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <View style={styles.filterContent}>
              <TouchableOpacity
                onPress={() => setStatus(undefined)}
                style={[styles.statusChip, !status && styles.statusChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusChipText, !status && styles.statusChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(status === s ? undefined : s)}
                  style={[styles.statusChip, status === s && styles.statusChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* List */}
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (data?.length ?? 0) === 0 ? (
            <EmptyState
              emoji="🏆"
              title="No events found"
              subtitle="Create your first event to get started"
              actionLabel="Create Event"
              onAction={() => router.push("/(app)/events/create")}
            />
          ) : (
            data?.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => router.push(`/(app)/events/${event.id}`)}
              />
            ))
          )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: colors.inputFill,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterRow: {
    marginBottom: spacing.sm,
  },
  filterContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.inputFocusBorder,
  },
  statusChipActive: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.primaryAccent,
  },
  statusChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
