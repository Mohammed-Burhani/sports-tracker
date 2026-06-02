import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import type { Team, MemberWithTeam } from '@/types';

interface TeamAssignmentSheetProps {
  visible: boolean;
  member: MemberWithTeam | null;
  teams: Team[];
  onClose: () => void;
  onAssign: (teamId: string) => void;
}

export function TeamAssignmentSheet({
  visible,
  member,
  teams,
  onClose,
  onAssign,
}: TeamAssignmentSheetProps) {
  if (!member) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Assign to Team</Text>
              <Text style={styles.subtitle}>{member.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
            <Text style={styles.hintText}>Select a team to assign this member</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {teams.map((team) => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.teamOption,
                  member.team_id === team.id && styles.teamOptionSelected,
                ]}
                onPress={() => {
                  onAssign(team.id);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.teamOptionLeft}>
                  <View
                    style={[
                      styles.teamDot,
                      { backgroundColor: team.colour_hex },
                    ]}
                  />
                  <View>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamCount}>
                      {team.player_count} {team.player_count === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                </View>
                {member.team_id === team.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  hintText: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamOptionSelected: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  teamOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  teamName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  teamCount: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
