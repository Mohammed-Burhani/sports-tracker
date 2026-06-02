import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import { FormInput } from './ui/FormInput';
import { Button } from './ui/Button';
import type { GroupWithTeams, Team } from '@/types';

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

interface GroupSheetProps {
  visible: boolean;
  group?: GroupWithTeams;
  teams: Team[];
  onClose: () => void;
  onSave: (data: { name: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onAssignTeam?: (teamId: string) => void;
  onUnassignTeam?: (teamId: string) => void;
}

export function GroupSheet({
  visible,
  group,
  teams,
  onClose,
  onSave,
  onDelete,
  onAssignTeam,
  onUnassignTeam,
}: GroupSheetProps) {
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (group) {
        setName(group.name);
      } else {
        setName('');
      }
      setErrors({});
    }
  }, [visible, group]);

  const handleSave = async () => {
    setErrors({});

    const result = groupSchema.safeParse({ name });

    if (!result.success) {
      const fieldErrors: { name?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as 'name';
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onSave({ name });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Group',
      'Are you sure? Teams will be unassigned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await onDelete();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const unassignedTeams = teams.filter(t => !t.group_id);
  const assignedTeams = group ? teams.filter(t => t.group_id === group.id) : [];

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
            <Text style={styles.title}>
              {group ? 'Edit Group' : 'Add Group'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <FormInput
              label="Group Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Group A"
              error={errors.name}
              autoFocus
            />

            {group && (
              <>
                <Text style={styles.sectionTitle}>Assigned Teams ({assignedTeams.length})</Text>
                {assignedTeams.length === 0 ? (
                  <Text style={styles.emptyText}>No teams assigned yet</Text>
                ) : (
                  <View style={styles.teamsList}>
                    {assignedTeams.map((team) => (
                      <View key={team.id} style={styles.teamItem}>
                        <View style={styles.teamItemLeft}>
                          <View style={[styles.teamDot, { backgroundColor: team.colour_hex }]} />
                          <Text style={styles.teamItemName}>{team.name}</Text>
                        </View>
                        {onUnassignTeam && (
                          <TouchableOpacity
                            onPress={() => onUnassignTeam(team.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="remove-circle-outline" size={20} color={colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.sectionTitle}>Available Teams ({unassignedTeams.length})</Text>
                {unassignedTeams.length === 0 ? (
                  <Text style={styles.emptyText}>All teams assigned</Text>
                ) : (
                  <View style={styles.teamsList}>
                    {unassignedTeams.map((team) => (
                      <View key={team.id} style={styles.teamItem}>
                        <View style={styles.teamItemLeft}>
                          <View style={[styles.teamDot, { backgroundColor: team.colour_hex }]} />
                          <Text style={styles.teamItemName}>{team.name}</Text>
                        </View>
                        {onAssignTeam && (
                          <TouchableOpacity
                            onPress={() => onAssignTeam(team.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="add-circle-outline" size={20} color={colors.primaryAccent} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <Button
                label="Cancel"
                onPress={onClose}
                variant="secondary"
                disabled={isLoading}
              />
              <Button
                label="Save"
                onPress={handleSave}
                disabled={isLoading}
                loading={isLoading}
              />
            </View>

            {group && onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                disabled={isLoading}
              >
                <Text style={styles.deleteText}>Delete Group</Text>
              </TouchableOpacity>
            )}
          </View>
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
    maxHeight: '80%',
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
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.md,
  },
  teamsList: {
    gap: spacing.xs,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  teamItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamItemName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  deleteButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  deleteText: {
    ...typography.bodyBold,
    color: colors.danger,
  },
});
