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

interface MemberAssignmentSheetProps {
  visible: boolean;
  team: Team | null;
  members: MemberWithTeam[];
  onClose: () => void;
  onAssign: (memberId: string) => void;
}

export function MemberAssignmentSheet({
  visible,
  team,
  members,
  onClose,
  onAssign,
}: MemberAssignmentSheetProps) {
  if (!team) return null;

  const unassignedMembers = members.filter(m => !m.team_id);

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
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.teamDot,
                  { backgroundColor: team.colour_hex },
                ]}
              />
              <View>
                <Text style={styles.title}>Assign Member</Text>
                <Text style={styles.subtitle}>{team.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
            <Text style={styles.hintText}>
              Select an unassigned member to add to this team
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {unassignedMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No unassigned members</Text>
                <Text style={styles.emptyHint}>
                  All members are already assigned to teams
                </Text>
              </View>
            ) : (
              unassignedMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberOption}
                  onPress={() => {
                    onAssign(member.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={styles.ageChip}>
                      <Text style={styles.ageText}>Age {member.age}</Text>
                    </View>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primaryAccent} />
                </TouchableOpacity>
              ))
            )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  memberName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  ageChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  ageText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  emptyHint: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
