import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Clock, MapPin } from "lucide-react-native";
import { Session } from "@/types";
import { getSportMeta, getFormatMeta } from "@/constants/sports";
import { StatusBadge } from "./ui/StatusBadge";
import { FormatBadge } from "./ui/FormatBadge";
import { colors, spacing, typography, radius, shadows, sportThemes } from "@/constants/theme";

interface SessionCardProps {
  session: Session & { event?: { name: string; sport: string; format: string } };
  onPress?: () => void;
  playerCount?: { expected: number; actual: number };
}

export function SessionCard({ session, onPress, playerCount }: SessionCardProps) {
  const sportKey = (session as any).event?.sport ?? "table_tennis";
  const sport = getSportMeta(sportKey);
  const format = getFormatMeta((session as any).event?.format ?? "friendly");
  const sportTheme = sportThemes[sportKey as keyof typeof sportThemes] || sportThemes.table_tennis;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${session.name} session`}
      style={({ pressed }) => [
        styles.container,
        shadows.card,
        { transform: [{ scale: pressed ? 0.99 : 1 }], opacity: pressed ? 0.96 : 1 },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: sportTheme.accent }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {session.event && (
              <Text style={styles.eventName} numberOfLines={1}>
                {sport.emoji} {(session as any).event.name}
              </Text>
            )}
            <Text style={styles.title} numberOfLines={1}>
              {session.name}
            </Text>
          </View>
          <StatusBadge status={session.status} size="sm" />
        </View>

        <View style={styles.badges}>
          <FormatBadge label={format.label} color={sportTheme.accent} size="sm" />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock color={colors.textTertiary} size={13} strokeWidth={2.2} />
            <Text style={styles.meta}>
              {session.date} · {session.start_time}
            </Text>
          </View>
          {session.venue_area && (
            <View style={styles.metaItem}>
              <MapPin color={colors.textTertiary} size={13} strokeWidth={2.2} />
              <Text style={styles.meta} numberOfLines={1}>
                {session.venue_area}
              </Text>
            </View>
          )}
        </View>

        {playerCount && (
          <View style={styles.playerCount}>
            <View style={styles.separator} />
            <View style={styles.countRow}>
              <Text style={styles.countLabel}>
                Expected <Text style={styles.countValue}>{playerCount.expected}</Text>
              </Text>
              <Text style={styles.countLabel}>
                Actual <Text style={styles.countValue}>{playerCount.actual}</Text>
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  accentBar: {
    height: 3,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  eventName: {
    ...typography.small,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  playerCount: {
    marginTop: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.sm,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  countLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  countValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
});
