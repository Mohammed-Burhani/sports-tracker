import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StandingWithTeam } from "@/types";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

interface StandingsTableProps {
  standings: StandingWithTeam[];
  compact?: boolean;
}

export function StandingsTable({ standings, compact = false }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <View style={[styles.emptyCard, shadows.card]}>
        <Text style={styles.emptyText}>No standings data yet</Text>
        <Text style={styles.emptySubtext}>
          Complete matches to see team rankings
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.table, shadows.card]}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.colPos]}>#</Text>
        <Text style={[styles.headerText, styles.colTeam]}>Team</Text>
        <Text style={[styles.headerText, styles.colStat]}>P</Text>
        <Text style={[styles.headerText, styles.colStat]}>W</Text>
        <Text style={[styles.headerText, styles.colStat]}>D</Text>
        <Text style={[styles.headerText, styles.colStat]}>L</Text>
        <Text style={[styles.headerText, styles.colStat]}>GD</Text>
        <Text style={[styles.headerText, styles.colPts]}>Pts</Text>
      </View>

      {/* Table Rows */}
      {standings.map((standing, index) => {
        const isTop3 = standing.position <= 3;
        const isFirst = standing.position === 1;
        
        return (
          <View
            key={standing.id}
            style={[
              styles.tableRow,
              isTop3 && styles.tableRowHighlight,
              isFirst && styles.tableRowFirst,
              index === standings.length - 1 && styles.tableRowLast,
            ]}
          >
            <View style={[styles.positionCell, styles.colPos]}>
              {isTop3 && (
                <View style={[
                  styles.positionBadge,
                  isFirst && styles.positionBadgeFirst,
                ]}>
                  <Text style={[
                    styles.positionText,
                    isFirst && styles.positionTextFirst,
                  ]}>
                    {standing.position}
                  </Text>
                </View>
              )}
              {!isTop3 && (
                <Text style={styles.positionText}>{standing.position}</Text>
              )}
            </View>

            <View style={[styles.teamCell, styles.colTeam]}>
              <View
                style={[
                  styles.teamDot,
                  { backgroundColor: standing.team.colour_hex },
                ]}
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {standing.team.name}
              </Text>
            </View>

            <Text style={[styles.statText, styles.colStat]}>
              {standing.played}
            </Text>
            <Text style={[styles.statText, styles.colStat, styles.statWin]}>
              {standing.won}
            </Text>
            <Text style={[styles.statText, styles.colStat]}>
              {standing.drawn}
            </Text>
            <Text style={[styles.statText, styles.colStat, styles.statLoss]}>
              {standing.lost}
            </Text>
            <Text style={[
              styles.statText,
              styles.colStat,
              standing.goal_difference > 0 && styles.statPositive,
              standing.goal_difference < 0 && styles.statNegative,
            ]}>
              {standing.goal_difference > 0 ? "+" : ""}
              {standing.goal_difference}
            </Text>
            <Text style={[styles.pointsText, styles.colPts]}>
              {standing.points}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.inputFill,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowHighlight: {
    backgroundColor: `${colors.success}03`,
  },
  tableRowFirst: {
    backgroundColor: `${colors.success}08`,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  colPos: {
    width: 40,
  },
  colTeam: {
    flex: 1,
  },
  colStat: {
    width: 32,
  },
  colPts: {
    width: 40,
  },
  positionCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  positionBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.success}15`,
  },
  positionBadgeFirst: {
    backgroundColor: colors.success,
  },
  positionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  positionTextFirst: {
    color: colors.cardSurface,
  },
  teamCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    fontSize: 14,
    flex: 1,
  },
  statText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 13,
  },
  statWin: {
    color: colors.success,
    fontWeight: "600",
  },
  statLoss: {
    color: colors.textTertiary,
  },
  statPositive: {
    color: colors.success,
    fontWeight: "600",
  },
  statNegative: {
    color: colors.danger,
    fontWeight: "600",
  },
  pointsText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },
  emptyCard: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: "center",
  },
});
