import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Calendar, MapPin, Users } from "lucide-react-native";
import { Event } from "@/types";
import { getSportMeta, getFormatMeta } from "@/constants/sports";
import { StatusBadge } from "./ui/StatusBadge";
import { FormatBadge } from "./ui/FormatBadge";
import { colors, spacing, typography, radius, shadows, sportThemes } from "@/constants/theme";

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const sport = getSportMeta(event.sport);
  const format = getFormatMeta(event.format);
  const isMultiDay = event.end_date && event.end_date !== event.start_date;
  const sportTheme = sportThemes[event.sport as keyof typeof sportThemes] || sportThemes.table_tennis;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${sport.label} ${format.label}`}
      style={({ pressed }) => [
        styles.container,
        shadows.card,
        { transform: [{ scale: pressed ? 0.99 : 1 }], opacity: pressed ? 0.96 : 1 },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: sportTheme.accent }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.emoji}>{sport.emoji}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {event.name}
            </Text>
          </View>
          <StatusBadge status={event.status} size="sm" />
        </View>

        <View style={styles.badges}>
          <FormatBadge label={format.label} color={sportTheme.accent} size="sm" />
          {event.player_type === "team" && <FormatBadge label="Teams" icon="👥" size="sm" />}
          {isMultiDay && <FormatBadge label="Multi-day" size="sm" color={colors.textTertiary} />}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar color={colors.textTertiary} size={13} strokeWidth={2.2} />
            <Text style={styles.meta} numberOfLines={1}>
              {isMultiDay ? `${event.start_date} → ${event.end_date}` : event.start_date}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Users color={colors.textTertiary} size={13} strokeWidth={2.2} />
            <Text style={styles.meta}>
              {event.registered_count}/{event.max_participants}
            </Text>
          </View>
        </View>

        {event.venue && (
          <View style={styles.metaItem}>
            <MapPin color={colors.textTertiary} size={13} strokeWidth={2.2} />
            <Text style={styles.venue} numberOfLines={1}>
              {event.venue}
            </Text>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  emoji: {
    fontSize: 22,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
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
  venue: {
    ...typography.caption,
    color: colors.textTertiary,
    flex: 1,
  },
});
