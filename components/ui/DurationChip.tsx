import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface DurationChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function DurationChip({ label, selected = false, onPress }: DurationChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.cardSurface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
