import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import { FormInput } from './ui/FormInput';
import { Button } from './ui/Button';
import type { MemberWithTeam } from '@/types';

const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(1, 'Age must be at least 1').max(120, 'Age must be at most 120'),
});

interface MemberSheetProps {
  visible: boolean;
  member?: MemberWithTeam;
  onClose: () => void;
  onSave: (data: { name: string; age: number }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function MemberSheet({
  visible,
  member,
  onClose,
  onSave,
  onDelete,
}: MemberSheetProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState<{ name?: string; age?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (member) {
        setName(member.name);
        setAge(member.age.toString());
      } else {
        setName('');
        setAge('');
      }
      setErrors({});
    }
  }, [visible, member]);

  const handleSave = async () => {
    setErrors({});

    const ageNum = parseInt(age, 10);
    const result = memberSchema.safeParse({ name, age: ageNum });

    if (!result.success) {
      const fieldErrors: { name?: string; age?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as 'name' | 'age';
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onSave({ name, age: ageNum });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    Alert.alert(
      'Delete Member',
      'Are you sure you want to delete this member?',
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
              Alert.alert('Error', 'Failed to delete member. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {member ? 'Edit Member' : 'Add Member'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <FormInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter member name"
              error={errors.name}
              autoFocus
            />

            <FormInput
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="Enter age"
              keyboardType="number-pad"
              error={errors.age}
            />
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

            {member && onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                disabled={isLoading}
              >
                <Text style={styles.deleteText}>Delete Member</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
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
