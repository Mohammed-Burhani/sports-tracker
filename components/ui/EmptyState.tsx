import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "./Button";
import { colors, spacing, typography, radius } from "@/constants/theme";

interface EmptyStateProps {
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}

export function EmptyState({
  emoji,
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {(icon || emoji) && (
        <View style={styles.tile}>{icon ?? <Text style={styles.emoji}>{emoji}</Text>}</View>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <View style={styles.buttonContainer}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    marginTop: spacing.xs,
  },
});
