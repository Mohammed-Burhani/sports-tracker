import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import type { GroupWithTeams } from '@/types';

interface GroupCardProps {
  group: GroupWithTeams;
  onPress?: () => void;
  onDelete?: () => void;
  showTeams?: boolean;
}

export function GroupCard({ group, onPress, onDelete, showTeams = true }: GroupCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, shadows.card]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={18} color={colors.primaryAccent} />
          </View>
          <View>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.teamCount}>
              {group.teams?.length || 0} {group.teams?.length === 1 ? 'team' : 'teams'}
            </Text>
          </View>
        </View>
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {showTeams && group.teams && group.teams.length > 0 && (
        <View style={styles.teamsContainer}>
          {group.teams.map((team) => (
            <View key={team.id} style={styles.teamChip}>
              <View style={[styles.teamDot, { backgroundColor: team.colour_hex }]} />
              <Text style={styles.teamName}>{team.name}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primaryAccent}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  teamCount: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  teamsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.base,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamName: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
