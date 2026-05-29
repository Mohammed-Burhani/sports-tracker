import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

interface StatCardProps {
  label: string;
  value: number | string;
  /** Accent used to tint the icon tile. */
  accent?: string;
  loading?: boolean;
  emoji?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  sub?: string;
}

export function StatCard({
  label,
  value,
  accent = colors.accent,
  loading = false,
  emoji,
  icon,
  subtitle,
  sub,
}: StatCardProps) {
  return (
    <View style={[styles.card, shadows.card]}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={accent} />
        </View>
      ) : (
        <>
          {(emoji || icon) && (
            <View style={[styles.tile, { backgroundColor: tint(accent) }]}>
              {icon ?? <Text style={styles.emoji}>{emoji}</Text>}
            </View>
          )}
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {(subtitle || sub) && <Text style={styles.sub}>{subtitle || sub}</Text>}
        </>
      )}
    </View>
  );
}

/** Low-opacity tint of an accent for tile backgrounds. */
function tint(hex: string) {
  return `${hex}1F`;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  loading: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  tile: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 20,
  },
  value: {
    ...typography.stat,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sub: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
