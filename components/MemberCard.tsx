import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import type { MemberWithTeam } from '@/types';

interface MemberCardProps {
  member: MemberWithTeam;
  onPress: () => void;
  onDelete: () => void;
  showDeleteConfirmation?: boolean;
}

export function MemberCard({ member, onPress, onDelete, showDeleteConfirmation = true }: MemberCardProps) {
  const handleDeletePress = () => {
    if (showDeleteConfirmation) {
      Alert.alert(
        'Delete Member',
        `Are you sure you want to remove ${member.name} from this event? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: onDelete,
          },
        ]
      );
    } else {
      onDelete();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.name}>{member.name}</Text>
          <View style={styles.ageChip}>
            <Text style={styles.ageText}>Age {member.age}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          {member.team ? (
            <View style={styles.teamInfo}>
              <View
                style={[
                  styles.teamDot,
                  { backgroundColor: member.team.colour_hex },
                ]}
              />
              <Text style={styles.teamName}>{member.team.name}</Text>
            </View>
          ) : (
            <Text style={styles.unassigned}>Unassigned</Text>
          )}

          <TouchableOpacity
            onPress={handleDeletePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  ageChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.base,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  ageText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  teamDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  teamName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  unassigned: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 4,
  },
});
